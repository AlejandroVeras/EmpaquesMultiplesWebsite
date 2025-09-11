<?php
require_once '../config/database.php';
require_once '../config/utils.php';
require_once '../auth/jwt.php';

Utils::setCorsHeaders();

$database = new Database();
$pdo = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getLunchRecords($pdo);
        break;
    case 'POST':
        createLunchRecord($pdo);
        break;
    case 'PUT':
        updateLunchRecord($pdo);
        break;
    case 'DELETE':
        deleteLunchRecord($pdo);
        break;
    default:
        Utils::sendError('Método no permitido', 405);
}

function getLunchRecords($pdo) {
    $user = JWTAuth::authenticate();
    
    $pagination = Utils::getPaginationParams();
    $filters = [];
    $params = [];
    
    // Build WHERE clause based on user permissions and filters
    $where_conditions = ['1=1'];
    
    // User permissions check
    if (!JWTAuth::hasPermission($user['permissions'], 'view_all_records')) {
        if (JWTAuth::hasPermission($user['permissions'], 'view_today_records')) {
            $where_conditions[] = 'lr.date = CURDATE()';
        } elseif (JWTAuth::hasPermission($user['permissions'], 'view_own_records')) {
            $where_conditions[] = 'lr.user_id = ?';
            $params[] = $user['user_id'];
        } else {
            Utils::sendError('No tienes permisos para ver registros', 403);
        }
    }
    
    // Date filters
    if (isset($_GET['date_from']) && Utils::validateDate($_GET['date_from'])) {
        $where_conditions[] = 'lr.date >= ?';
        $params[] = $_GET['date_from'];
    }
    
    if (isset($_GET['date_to']) && Utils::validateDate($_GET['date_to'])) {
        $where_conditions[] = 'lr.date <= ?';
        $params[] = $_GET['date_to'];
    }
    
    if (isset($_GET['date']) && Utils::validateDate($_GET['date'])) {
        $where_conditions[] = 'lr.date = ?';
        $params[] = $_GET['date'];
    }
    
    // Department filter
    if (isset($_GET['department_id']) && is_numeric($_GET['department_id'])) {
        $where_conditions[] = 'u.department_id = ?';
        $params[] = $_GET['department_id'];
    }
    
    // User filter
    if (isset($_GET['user_id']) && is_numeric($_GET['user_id'])) {
        if (JWTAuth::hasPermission($user['permissions'], 'view_all_records')) {
            $where_conditions[] = 'lr.user_id = ?';
            $params[] = $_GET['user_id'];
        }
    }
    
    try {
        // Count total records
        $count_query = "
            SELECT COUNT(*) as total
            FROM lunch_records lr
            JOIN users u ON lr.user_id = u.id
            WHERE " . implode(' AND ', $where_conditions);
        
        $count_stmt = $pdo->prepare($count_query);
        $count_stmt->execute($params);
        $total = $count_stmt->fetch()['total'];
        
        // Get records with pagination
        $query = "
            SELECT lr.id, lr.date, lr.time, lr.comments, lr.created_at, lr.updated_at,
                   u.full_name as user_name, u.username,
                   d.name as department_name,
                   creator.full_name as created_by_name
            FROM lunch_records lr
            JOIN users u ON lr.user_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            JOIN users creator ON lr.created_by = creator.id
            WHERE " . implode(' AND ', $where_conditions) . "
            ORDER BY lr.date DESC, lr.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $pagination['limit'];
        $params[] = $pagination['offset'];
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $records = $stmt->fetchAll();
        
        Utils::sendResponse(Utils::buildPaginationResponse(
            $records, 
            $total, 
            $pagination['page'], 
            $pagination['limit']
        ));
        
    } catch (Exception $e) {
        Utils::sendError('Error al obtener registros: ' . $e->getMessage(), 500);
    }
}

function createLunchRecord($pdo) {
    $user = JWTAuth::authenticate('register_lunch');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    Utils::validateRequired($input, ['user_id', 'date']);
    
    $user_id = intval($input['user_id']);
    $date = Utils::sanitizeInput($input['date']);
    $time = isset($input['time']) ? Utils::sanitizeInput($input['time']) : date('H:i:s');
    $comments = isset($input['comments']) ? Utils::sanitizeInput($input['comments']) : null;
    
    // Validate date format
    if (!Utils::validateDate($date)) {
        Utils::sendError('Formato de fecha inválido', 400);
    }
    
    // Check if user can register for others
    if ($user_id != $user['user_id'] && !JWTAuth::hasPermission($user['permissions'], 'register_lunch')) {
        Utils::sendError('No puedes registrar almuerzo para otros usuarios', 403);
    }
    
    try {
        // Check if user exists and is active
        $user_check = $pdo->prepare("SELECT id, full_name FROM users WHERE id = ? AND active = TRUE");
        $user_check->execute([$user_id]);
        if (!$user_check->fetch()) {
            Utils::sendError('Usuario no encontrado o inactivo', 404);
        }
        
        // Check for existing record on same date
        $duplicate_check = $pdo->prepare("
            SELECT id FROM lunch_records WHERE user_id = ? AND date = ?
        ");
        $duplicate_check->execute([$user_id, $date]);
        if ($duplicate_check->fetch()) {
            Utils::sendError('Ya existe un registro de almuerzo para este usuario en esta fecha', 409);
        }
        
        // Insert lunch record
        $stmt = $pdo->prepare("
            INSERT INTO lunch_records (user_id, date, time, comments, created_by)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([$user_id, $date, $time, $comments, $user['user_id']]);
        $record_id = $pdo->lastInsertId();
        
        // Log activity
        Utils::logActivity($pdo, $user['user_id'], 'create', 'lunch_record', $record_id, [
            'target_user_id' => $user_id,
            'date' => $date
        ]);
        
        // Get the created record with user details
        $get_record = $pdo->prepare("
            SELECT lr.id, lr.date, lr.time, lr.comments, lr.created_at,
                   u.full_name as user_name, u.username,
                   d.name as department_name
            FROM lunch_records lr
            JOIN users u ON lr.user_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE lr.id = ?
        ");
        $get_record->execute([$record_id]);
        $record = $get_record->fetch();
        
        Utils::sendResponse([
            'success' => true,
            'message' => 'Registro de almuerzo creado exitosamente',
            'record' => $record
        ], 201);
        
    } catch (Exception $e) {
        Utils::sendError('Error al crear registro: ' . $e->getMessage(), 500);
    }
}

function updateLunchRecord($pdo) {
    $user = JWTAuth::authenticate('edit_all_records');
    
    $record_id = $_GET['id'] ?? null;
    if (!$record_id || !is_numeric($record_id)) {
        Utils::sendError('ID de registro requerido', 400);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $time = isset($input['time']) ? Utils::sanitizeInput($input['time']) : null;
    $comments = isset($input['comments']) ? Utils::sanitizeInput($input['comments']) : null;
    
    try {
        // Check if record exists
        $check_stmt = $pdo->prepare("SELECT user_id, date FROM lunch_records WHERE id = ?");
        $check_stmt->execute([$record_id]);
        $existing_record = $check_stmt->fetch();
        
        if (!$existing_record) {
            Utils::sendError('Registro no encontrado', 404);
        }
        
        // Build update query
        $update_fields = [];
        $params = [];
        
        if ($time !== null) {
            $update_fields[] = 'time = ?';
            $params[] = $time;
        }
        
        if ($comments !== null) {
            $update_fields[] = 'comments = ?';
            $params[] = $comments;
        }
        
        if (empty($update_fields)) {
            Utils::sendError('No hay campos para actualizar', 400);
        }
        
        $params[] = $record_id;
        
        $stmt = $pdo->prepare("
            UPDATE lunch_records 
            SET " . implode(', ', $update_fields) . "
            WHERE id = ?
        ");
        
        $stmt->execute($params);
        
        // Log activity
        Utils::logActivity($pdo, $user['user_id'], 'update', 'lunch_record', $record_id, [
            'updated_fields' => array_keys($input)
        ]);
        
        Utils::sendResponse([
            'success' => true,
            'message' => 'Registro actualizado exitosamente'
        ]);
        
    } catch (Exception $e) {
        Utils::sendError('Error al actualizar registro: ' . $e->getMessage(), 500);
    }
}

function deleteLunchRecord($pdo) {
    $user = JWTAuth::authenticate('delete_records');
    
    $record_id = $_GET['id'] ?? null;
    if (!$record_id || !is_numeric($record_id)) {
        Utils::sendError('ID de registro requerido', 400);
    }
    
    try {
        // Check if record exists
        $check_stmt = $pdo->prepare("SELECT user_id, date FROM lunch_records WHERE id = ?");
        $check_stmt->execute([$record_id]);
        $existing_record = $check_stmt->fetch();
        
        if (!$existing_record) {
            Utils::sendError('Registro no encontrado', 404);
        }
        
        // Delete record
        $stmt = $pdo->prepare("DELETE FROM lunch_records WHERE id = ?");
        $stmt->execute([$record_id]);
        
        // Log activity
        Utils::logActivity($pdo, $user['user_id'], 'delete', 'lunch_record', $record_id, [
            'deleted_user_id' => $existing_record['user_id'],
            'deleted_date' => $existing_record['date']
        ]);
        
        Utils::sendResponse([
            'success' => true,
            'message' => 'Registro eliminado exitosamente'
        ]);
        
    } catch (Exception $e) {
        Utils::sendError('Error al eliminar registro: ' . $e->getMessage(), 500);
    }
}
?>