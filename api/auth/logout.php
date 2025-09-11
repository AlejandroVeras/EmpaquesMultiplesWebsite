<?php
require_once '../config/database.php';
require_once '../config/utils.php';
require_once 'jwt.php';

Utils::setCorsHeaders();

$user = JWTAuth::authenticate();

$database = new Database();
$pdo = $database->getConnection();

// Revoke current token
$token = JWTAuth::getTokenFromHeader();
if ($token) {
    JWTAuth::revokeToken($token);
}

// Log logout
Utils::logActivity($pdo, $user['user_id'], 'logout', 'auth');

Utils::sendResponse([
    'success' => true,
    'message' => 'Sesión cerrada exitosamente'
]);
?>