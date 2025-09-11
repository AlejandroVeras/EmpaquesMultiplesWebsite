<?php
/**
 * Utility functions for the Lunch Registration System
 */

class Utils {
    
    /**
     * Set CORS headers
     */
    public static function setCorsHeaders() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if (in_array($origin, AppConfig::$cors_origins)) {
            header("Access-Control-Allow-Origin: $origin");
        }
        
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Content-Type: application/json; charset=UTF-8");
        
        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
    
    /**
     * Send JSON response
     */
    public static function sendResponse($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    /**
     * Send error response
     */
    public static function sendError($message, $status = 400, $details = null) {
        $response = ['error' => true, 'message' => $message];
        if ($details) {
            $response['details'] = $details;
        }
        self::sendResponse($response, $status);
    }
    
    /**
     * Validate required fields
     */
    public static function validateRequired($data, $required_fields) {
        $missing = [];
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                $missing[] = $field;
            }
        }
        
        if (!empty($missing)) {
            self::sendError('Campos requeridos faltantes: ' . implode(', ', $missing), 400);
        }
    }
    
    /**
     * Sanitize input
     */
    public static function sanitizeInput($input) {
        if (is_array($input)) {
            return array_map([self::class, 'sanitizeInput'], $input);
        }
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Get client IP address
     */
    public static function getClientIP() {
        $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ips = explode(',', $_SERVER[$key]);
                $ip = trim($ips[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    /**
     * Log activity
     */
    public static function logActivity($pdo, $user_id, $action, $resource_type, $resource_id = null, $details = null) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $user_id,
                $action,
                $resource_type,
                $resource_id,
                $details ? json_encode($details) : null,
                self::getClientIP(),
                $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]);
        } catch (Exception $e) {
            error_log("Error logging activity: " . $e->getMessage());
        }
    }
    
    /**
     * Generate secure random string
     */
    public static function generateRandomString($length = 32) {
        return bin2hex(random_bytes($length / 2));
    }
    
    /**
     * Validate email
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Hash password
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536, // 64 MB
            'time_cost' => 4,       // 4 iterations
            'threads' => 3,         // 3 threads
        ]);
    }
    
    /**
     * Verify password
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    /**
     * Get pagination parameters
     */
    public static function getPaginationParams($default_limit = 20, $max_limit = 100) {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min($max_limit, max(1, intval($_GET['limit'] ?? $default_limit)));
        $offset = ($page - 1) * $limit;
        
        return ['page' => $page, 'limit' => $limit, 'offset' => $offset];
    }
    
    /**
     * Build pagination response
     */
    public static function buildPaginationResponse($data, $total, $page, $limit) {
        $total_pages = ceil($total / $limit);
        
        return [
            'data' => $data,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $total_pages,
                'total_items' => $total,
                'items_per_page' => $limit,
                'has_next' => $page < $total_pages,
                'has_prev' => $page > 1
            ]
        ];
    }
    
    /**
     * Validate date format
     */
    public static function validateDate($date, $format = 'Y-m-d') {
        $d = DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }
    
    /**
     * Get system configuration
     */
    public static function getSystemConfig($pdo, $key) {
        try {
            $stmt = $pdo->prepare("SELECT config_value FROM system_config WHERE config_key = ?");
            $stmt->execute([$key]);
            $result = $stmt->fetch();
            return $result ? $result['config_value'] : null;
        } catch (Exception $e) {
            return null;
        }
    }
    
    /**
     * Set system configuration
     */
    public static function setSystemConfig($pdo, $key, $value, $description = null) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO system_config (config_key, config_value, description)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), description = COALESCE(VALUES(description), description)
            ");
            return $stmt->execute([$key, $value, $description]);
        } catch (Exception $e) {
            return false;
        }
    }
}
?>