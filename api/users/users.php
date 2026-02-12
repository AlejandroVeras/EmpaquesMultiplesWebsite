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
        getUsers($pdo);
        break;
    case 'POST':
        createUser($pdo);
        break;
    case 'PUT':
        updateUser($pdo);
        break;
    case 'DELETE':
        deleteUser($pdo);
        break;
    default:
        Utils::sendError('Método no permitido', 405);
}

function getUsers($pdo) {
    $user = JWTAuth::authenticate();
    
    // Check if user can view users
    if (!JWTAuth::hasPermission($user['permissions'], 'manage_users') && 
        !JWTAuth::hasPermission($user['permissions'], 'view_all_records')) {
        Utils::sendError('No tienes permisos para ver usuarios', 403);
    }
    
    $pagination = Utils::getPaginationParams();
    $params = [];
    $where_conditions = ['u.active = TRUE'];
    
    // Search filter
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $search = '%' . Utils::sanitizeInput($_GET['search']) . '%';
        $where_conditions[] = '(u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)';
        $params = array_merge($params, [$search, $search, $search]);
    }
    
    // Department filter
    if (isset($_GET['department_id']) && is_numeric($_GET['department_id'])) {
        $where_conditions[] = 'u.department_id = ?';
        $params[] = $_GET['department_id'];
    }
    
    // Role filter
    if (isset($_GET['role_id']) && is_numeric($_GET['role_id'])) {
        $where_conditions[] = 'u.role_id = ?';
        $params[] = $_GET['role_id'];
    }
    
    try {
        // Count total records
        $count_query = "
            SELECT COUNT(*) as total
            FROM users u
            WHERE " . implode(' AND ', $where_conditions);
        
        $count_stmt = $pdo->prepare($count_query);
        $count_stmt->execute($params);
        $total = $count_stmt->fetch()['total'];
        
        // Get users with pagination
        $query = "
            SELECT u.id, u.username, u.full_name, u.email, u.active, u.created_at,
                   d.name as department_name, r.name as role_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            JOIN roles r ON u.role_id = r.id
            WHERE " . implode(' AND ', $where_conditions) . "
            ORDER BY u.full_name ASC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $pagination['limit'];
        $params[] = $pagination['offset'];
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $users = $stmt->fetchAll();
        
        Utils::sendResponse(Utils::buildPaginationResponse(
            $users, 
            $total, 
            $pagination['page'], 
            $pagination['limit']
        ));
        
    } catch (Exception $e) {
        Utils::sendError('Error al obtener usuarios: ' . $e->getMessage(), 500);
    }
}

function createUser($pdo) {
    $user = JWTAuth::authenticate('manage_users');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    Utils::validateRequired($input, ['username', 'password', 'full_name', 'role_id']);
    
    $username = Utils::sanitizeInput($input['username']);
    $password = $input['password'];
    $full_name = Utils::sanitizeInput($input['full_name']);
    $email = isset($input['email']) ? Utils::sanitizeInput($input['email']) : null;
    $department_id = isset($input['department_id']) ? intval($input['department_id']) : null;
    $role_id = intval($input['role_id']);
    
    // Validate email if provided
    if ($email && !Utils::validateEmail($email)) {
        Utils::sendError('Formato de email inválido', 400);
    }
    
    // Validate password strength
    if (strlen($password) < 6) {
        Utils::sendError('La contraseña debe tener al menos 6 caracteres', 400);
    }
    
    try {
        // Check if username already exists
        $check_stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $check_stmt->execute([$username]);
        if ($check_stmt->fetch()) {
            Utils::sendError('El nombre de usuario ya existe', 409);
        }
        
        // Check if email already exists (if provided)
        if ($email) {
            $email_check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $email_check->execute([$email]);
            if ($email_check->fetch()) {
                Utils::sendError('El email ya está registrado', 409);
            }
        }
        
        // Check if role exists
        $role_check = $pdo->prepare("SELECT id FROM roles WHERE id = ?");
        $role_check->execute([$role_id]);
        if (!$role_check->fetch()) {
            Utils::sendError('Rol no válido', 400);
        }
        
        // Check if department exists (if provided)
        if ($department_id) {
            $dept_check = $pdo->prepare("SELECT id FROM departments WHERE id = ? AND active = TRUE");
            $dept_check->execute([$department_id]);
            if (!$dept_check->fetch()) {
                Utils::sendError('Departamento no válido', 400);
            }
        }
        
        // Hash password
        $password_hash = Utils::hashPassword($password);
        
        // Insert user
        $stmt = $pdo->prepare("
            INSERT INTO users (username, password, full_name, email, department_id, role_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([$username, $password_hash, $full_name, $email, $department_id, $role_id]);
        $new_user_id = $pdo->lastInsertId();
        
        // Log activity
        Utils::logActivity($pdo, $user['user_id'], 'create', 'user', $new_user_id, [
            'username' => $username,
            'full_name' => $full_name
        ]);
        
        Utils::sendResponse([
            'success' => true,
            'message' => 'Usuario creado exitosamente',
            'user_id' => $new_user_id
        ], 201);
        
    } catch (Exception $e) {
        Utils::sendError('Error al crear usuario: ' . $e->getMessage(), 500);
    }
}

function updateUser($pdo) {
    $user = JWTAuth::authenticate('manage_users');
    
    $user_id = $_GET['id'] ?? null;
    if (!$user_id || !is_numeric($user_id)) {
        Utils::sendError('ID de usuario requerido', 400);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        // Check if user exists
        $check_stmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
        $check_stmt->execute([$user_id]);
        if (!$check_stmt->fetch()) {
            Utils::sendError('Usuario no encontrado', 404);
        }
        
        // Build update query
        $update_fields = [];
        $params = [];
        
        if (isset($input['full_name'])) {
            $update_fields[] = 'full_name = ?';
            $params[] = Utils::sanitizeInput($input['full_name']);
        }
        
        if (isset($input['email'])) {
            $email = Utils::sanitizeInput($input['email']);
            if ($email && !Utils::validateEmail($email)) {
                Utils::sendError('Formato de email inválido', 400);
            }
            $update_fields[] = 'email = ?';
            $params[] = $email;
        }
        
        if (isset($input['department_id'])) {
            $dept_id = $input['department_id'] ? intval($input['department_id']) : null;
            if ($dept_id) {
                $dept_check = $pdo->prepare("SELECT id FROM departments WHERE id = ? AND active = TRUE");
                $dept_check->execute([$dept_id]);
                if (!$dept_check->fetch()) {
                    Utils::sendError('Departamento no válido', 400);
                }
            }
            $update_fields[] = 'department_id = ?';
            $params[] = $dept_id;
        }
        
        if (isset($input['role_id'])) {
            $role_id = intval($input['role_id']);
            $role_check = $pdo->prepare("SELECT id FROM roles WHERE id = ?");
            $role_check->execute([$role_id]);
            if (!$role_check->fetch()) {
                Utils::sendError('Rol no válido', 400);
            }
            $update_fields[] = 'role_id = ?';
            $params[] = $role_id;
        }
        
        if (isset($input['active'])) {
            $update_fields[] = 'active = ?';
            $params[] = $input['active'] ? 1 : 0;
        }
        
        if (isset($input['password']) && !empty($input['password'])) {
            if (strlen($input['password']) < 6) {
                Utils::sendError('La contraseña debe tener al menos 6 caracteres', 400);
            }
            $update_fields[] = 'password = ?';
            $params[] = Utils::hashPassword($input['password']);
        }
        
        if (empty($update_fields)) {
            Utils::sendError('No hay campos para actualizar', 400);
        }
        
        $params[] = $user_id;
        
        $stmt = $pdo->prepare("
            UPDATE users 
            SET " . implode(', ', $update_fields) . "
            WHERE id = ?
        ");
        
        $stmt->execute($params);
        
        // Log activity
        Utils::logActivity($pdo, $user['user_id'], 'update', 'user', $user_id, [
            'updated_fields' => array_keys($input)
        ]);
        
        Utils::sendResponse([
            'success' => true,
            'message' => 'Usuario actualizado exitosamente'
        ]);
        
    } catch (Exception $e) {
        Utils::sendError('Error al actualizar usuario: ' . $e->getMessage(), 500);
    }
}

function deleteUser($pdo) {
    $user = JWTAuth::authenticate('manage_users');
    
    $user_id = $_GET['id'] ?? null;
    if (!$user_id || !is_numeric($user_id)) {
        Utils::sendError('ID de usuario requerido', 400);
    }
    
    // Prevent self-deletion
    if ($user_id == $user['user_id']) {
        Utils::sendError('No puedes eliminar tu propia cuenta', 400);
    }
    
    try {
        // Check if user exists
        $check_stmt = $pdo->prepare("SELECT username, full_name FROM users WHERE id = ?");
        $check_stmt->execute([$user_id]);
        $existing_user = $check_stmt->fetch();
        
        if (!$existing_user) {
            Utils::sendError('Usuario no encontrado', 404);
        }
        
        // Soft delete - deactivate user instead of actual deletion
        $stmt = $pdo->prepare("UPDATE users SET active = FALSE WHERE id = ?");
        $stmt->execute([$user_id]);
        
        // Log activity
        Utils::logActivity($pdo, $user['user_id'], 'delete', 'user', $user_id, [
            'deleted_username' => $existing_user['username'],
            'deleted_full_name' => $existing_user['full_name']
        ]);
        
        Utils::sendResponse([
            'success' => true,
            'message' => 'Usuario desactivado exitosamente'
        ]);
        
    } catch (Exception $e) {
        Utils::sendError('Error al eliminar usuario: ' . $e->getMessage(), 500);
    }
}
?>