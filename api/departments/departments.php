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
        getDepartments($pdo);
        break;
    case 'POST':
        createDepartment($pdo);
        break;
    case 'PUT':
        updateDepartment($pdo);
        break;
    case 'DELETE':
        deleteDepartment($pdo);
        break;
    default:
        Utils::sendError('Método no permitido', 405);
}

function getDepartments($pdo) {
    $user = JWTAuth::authenticate();
    
    try {
        // Get all active departments
        $stmt = $pdo->prepare("
            SELECT id, name, active, created_at, updated_at
            FROM departments 
            WHERE active = TRUE
            ORDER BY name ASC
        ");
        
        $stmt->execute();
        $departments = $stmt->fetchAll();
        
        Utils::sendResponse([
            'success' => true,
            'data' => $departments
        ]);
        
    } catch (Exception $e) {
        Utils::sendError('Error al obtener departamentos: ' . $e->getMessage(), 500);
    }
}

function createDepartment($pdo) {
    $user = JWTAuth::authenticate('manage_departments');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    Utils::validateRequired($input, ['name']);
    
    $name = Utils::sanitizeInput($input['name']);
    
    try {
        // Check if department already exists
        $check_stmt = $pdo->prepare("SELECT id FROM departments WHERE name = ?");
        $check_stmt->execute([$name]);
        if ($check_stmt->fetch()) {
            Utils::sendError('El departamento ya existe', 409);
        }
        
        // Insert department
        $stmt = $pdo->prepare("INSERT INTO departments (name) VALUES (?)");
        $stmt->execute([$name]);
        $department_id = $pdo->lastInsertId();
        
        // Log activity
        Utils::logActivity($pdo, $user['user_id'], 'create', 'department', $department_id, [
            'name' => $name
        ]);
        
        Utils::sendResponse([
            'success' => true,
            'message' => 'Departamento creado exitosamente',
            'department_id' => $department_id
        ], 201);
        
    } catch (Exception $e) {
        Utils::sendError('Error al crear departamento: ' . $e->getMessage(), 500);
    }
}

function updateDepartment($pdo) {
    $user = JWTAuth::authenticate('manage_departments');
    
    $department_id = $_GET['id'] ?? null;
    if (!$department_id || !is_numeric($department_id)) {
        Utils::sendError('ID de departamento requerido', 400);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        // Check if department exists
        $check_stmt = $pdo->prepare("SELECT name FROM departments WHERE id = ?");
        $check_stmt->execute([$department_id]);
        if (!$check_stmt->fetch()) {
            Utils::sendError('Departamento no encontrado', 404);
        }
        
        // Build update query
        $update_fields = [];
        $params = [];
        
        if (isset($input['name'])) {
            $name = Utils::sanitizeInput($input['name']);
            // Check if new name already exists
            $name_check = $pdo->prepare("SELECT id FROM departments WHERE name = ? AND id != ?");
            $name_check->execute([$name, $department_id]);
            if ($name_check->fetch()) {
                Utils::sendError('Ya existe un departamento con ese nombre', 409);
            }
            $update_fields[] = 'name = ?';
            $params[] = $name;
        }
        
        if (isset($input['active'])) {
            $update_fields[] = 'active = ?';
            $params[] = $input['active'] ? 1 : 0;
        }
        
        if (empty($update_fields)) {
            Utils::sendError('No hay campos para actualizar', 400);
        }
        
        $params[] = $department_id;
        
        $stmt = $pdo->prepare("
            UPDATE departments 
            SET " . implode(', ', $update_fields) . "
            WHERE id = ?
        ");
        
        $stmt->execute($params);
        
        // Log activity
        Utils::logActivity($pdo, $user['user_id'], 'update', 'department', $department_id, [
            'updated_fields' => array_keys($input)
        ]);
        
        Utils::sendResponse([
            'success' => true,
            'message' => 'Departamento actualizado exitosamente'
        ]);
        
    } catch (Exception $e) {
        Utils::sendError('Error al actualizar departamento: ' . $e->getMessage(), 500);
    }
}

function deleteDepartment($pdo) {
    $user = JWTAuth::authenticate('manage_departments');
    
    $department_id = $_GET['id'] ?? null;
    if (!$department_id || !is_numeric($department_id)) {
        Utils::sendError('ID de departamento requerido', 400);
    }
    
    try {
        // Check if department exists
        $check_stmt = $pdo->prepare("SELECT name FROM departments WHERE id = ?");
        $check_stmt->execute([$department_id]);
        $existing_dept = $check_stmt->fetch();
        
        if (!$existing_dept) {
            Utils::sendError('Departamento no encontrado', 404);
        }
        
        // Check if department has users
        $users_check = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE department_id = ? AND active = TRUE");
        $users_check->execute([$department_id]);
        $user_count = $users_check->fetch()['count'];
        
        if ($user_count > 0) {
            Utils::sendError('No se puede eliminar el departamento porque tiene usuarios asignados', 400);
        }
        
        // Soft delete - deactivate department
        $stmt = $pdo->prepare("UPDATE departments SET active = FALSE WHERE id = ?");
        $stmt->execute([$department_id]);
        
        // Log activity
        Utils::logActivity($pdo, $user['user_id'], 'delete', 'department', $department_id, [
            'deleted_name' => $existing_dept['name']
        ]);
        
        Utils::sendResponse([
            'success' => true,
            'message' => 'Departamento desactivado exitosamente'
        ]);
        
    } catch (Exception $e) {
        Utils::sendError('Error al eliminar departamento: ' . $e->getMessage(), 500);
    }
}
?>