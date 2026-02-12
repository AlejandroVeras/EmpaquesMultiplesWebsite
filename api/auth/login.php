<?php
require_once '../config/database.php';
require_once '../config/utils.php';
require_once 'jwt.php';

Utils::setCorsHeaders();

$database = new Database();
$pdo = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        login($pdo);
        break;
    default:
        Utils::sendError('Método no permitido', 405);
}

function login($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    Utils::validateRequired($input, ['username', 'password']);
    
    $username = Utils::sanitizeInput($input['username']);
    $password = $input['password'];
    
    try {
        // Get user with role and permissions
        $stmt = $pdo->prepare("
            SELECT u.id, u.username, u.password, u.full_name, u.email, u.active,
                   d.name as department_name, r.name as role_name, r.permissions
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            JOIN roles r ON u.role_id = r.id
            WHERE u.username = ? AND u.active = TRUE
        ");
        
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if (!$user || !Utils::verifyPassword($password, $user['password'])) {
            Utils::logActivity($pdo, null, 'failed_login', 'auth', null, ['username' => $username]);
            Utils::sendError('Usuario o contraseña incorrectos', 401);
        }
        
        // Create JWT token
        $token = JWTAuth::createToken($user);
        
        // Store token in session table
        JWTAuth::storeToken($user['id'], $token);
        
        // Log successful login
        Utils::logActivity($pdo, $user['id'], 'login', 'auth');
        
        // Clean expired tokens periodically
        if (rand(1, 100) <= 5) { // 5% chance
            JWTAuth::cleanExpiredTokens();
        }
        
        Utils::sendResponse([
            'success' => true,
            'message' => 'Inicio de sesión exitoso',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'full_name' => $user['full_name'],
                'email' => $user['email'],
                'department' => $user['department_name'],
                'role' => $user['role_name'],
                'permissions' => json_decode($user['permissions'], true)
            ]
        ]);
        
    } catch (Exception $e) {
        Utils::sendError('Error en el servidor: ' . $e->getMessage(), 500);
    }
}
?>