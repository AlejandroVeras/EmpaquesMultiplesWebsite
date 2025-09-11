<?php
require_once '../config/database.php';
require_once '../config/utils.php';

/**
 * JWT Authentication Handler
 */
class JWTAuth {
    
    /**
     * Create JWT token
     */
    public static function createToken($user_data) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        
        $payload = json_encode([
            'iss' => JWTConfig::$issuer,
            'aud' => JWTConfig::$audience,
            'iat' => time(),
            'exp' => time() + JWTConfig::$expire_time,
            'user_id' => $user_data['id'],
            'username' => $user_data['username'],
            'role' => $user_data['role_name'],
            'permissions' => json_decode($user_data['permissions'], true)
        ]);
        
        $header_encoded = self::base64UrlEncode($header);
        $payload_encoded = self::base64UrlEncode($payload);
        
        $signature = hash_hmac('sha256', $header_encoded . "." . $payload_encoded, JWTConfig::$secret_key, true);
        $signature_encoded = self::base64UrlEncode($signature);
        
        return $header_encoded . "." . $payload_encoded . "." . $signature_encoded;
    }
    
    /**
     * Verify JWT token
     */
    public static function verifyToken($token) {
        if (!$token) {
            return false;
        }
        
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        $header = self::base64UrlDecode($parts[0]);
        $payload = self::base64UrlDecode($parts[1]);
        $signature = self::base64UrlDecode($parts[2]);
        
        $expected_signature = hash_hmac('sha256', $parts[0] . "." . $parts[1], JWTConfig::$secret_key, true);
        
        if (!hash_equals($signature, $expected_signature)) {
            return false;
        }
        
        $payload_data = json_decode($payload, true);
        
        if (!$payload_data || $payload_data['exp'] < time()) {
            return false;
        }
        
        return $payload_data;
    }
    
    /**
     * Get token from Authorization header
     */
    public static function getTokenFromHeader() {
        $headers = getallheaders();
        $auth_header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            return $matches[1];
        }
        
        return null;
    }
    
    /**
     * Check if user has permission
     */
    public static function hasPermission($permissions, $required_permission) {
        return isset($permissions[$required_permission]) && $permissions[$required_permission] === true;
    }
    
    /**
     * Middleware to authenticate requests
     */
    public static function authenticate($required_permission = null) {
        $token = self::getTokenFromHeader();
        $payload = self::verifyToken($token);
        
        if (!$payload) {
            Utils::sendError('Token de autenticación inválido o expirado', 401);
        }
        
        // Check if token is blacklisted
        if (self::isTokenBlacklisted($token)) {
            Utils::sendError('Token de autenticación revocado', 401);
        }
        
        // Check permission if required
        if ($required_permission && !self::hasPermission($payload['permissions'], $required_permission)) {
            Utils::sendError('No tienes permisos para realizar esta acción', 403);
        }
        
        return $payload;
    }
    
    /**
     * Check if token is blacklisted
     */
    public static function isTokenBlacklisted($token) {
        try {
            $database = new Database();
            $pdo = $database->getConnection();
            
            $token_hash = hash('sha256', $token);
            
            $stmt = $pdo->prepare("
                SELECT id FROM user_sessions 
                WHERE token_hash = ? AND expires_at > NOW() AND revoked = FALSE
            ");
            $stmt->execute([$token_hash]);
            
            return $stmt->fetch() === false;
        } catch (Exception $e) {
            return true; // Assume blacklisted on error
        }
    }
    
    /**
     * Store token in session table
     */
    public static function storeToken($user_id, $token) {
        try {
            $database = new Database();
            $pdo = $database->getConnection();
            
            $token_hash = hash('sha256', $token);
            $expires_at = date('Y-m-d H:i:s', time() + JWTConfig::$expire_time);
            
            $stmt = $pdo->prepare("
                INSERT INTO user_sessions (user_id, token_hash, expires_at)
                VALUES (?, ?, ?)
            ");
            
            return $stmt->execute([$user_id, $token_hash, $expires_at]);
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * Revoke token (logout)
     */
    public static function revokeToken($token) {
        try {
            $database = new Database();
            $pdo = $database->getConnection();
            
            $token_hash = hash('sha256', $token);
            
            $stmt = $pdo->prepare("
                UPDATE user_sessions 
                SET revoked = TRUE 
                WHERE token_hash = ?
            ");
            
            return $stmt->execute([$token_hash]);
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * Clean expired tokens
     */
    public static function cleanExpiredTokens() {
        try {
            $database = new Database();
            $pdo = $database->getConnection();
            
            $stmt = $pdo->prepare("DELETE FROM user_sessions WHERE expires_at < NOW()");
            return $stmt->execute();
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * Base64 URL encode
     */
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Base64 URL decode
     */
    private static function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
}
?>