<?php
/**
 * Database configuration for Empaques Múltiples Lunch System
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'empaques_lunch_system';
    private $username = 'root';
    private $password = '';
    private $charset = 'utf8mb4';
    public $conn;

    // Get database connection
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        
        return $this->conn;
    }
}

/**
 * JWT configuration
 */
class JWTConfig {
    public static $secret_key = "emp4qu3s_mult1pl3s_2025_s3cr3t_k3y";
    public static $issuer = "empaques-multiples.com";
    public static $audience = "lunch-system";
    public static $expire_time = 28800; // 8 hours in seconds
}

/**
 * Application configuration
 */
class AppConfig {
    public static $cors_origins = [
        'http://localhost',
        'https://empaquesmultiples.com',
        'https://www.empaquesmultiples.com'
    ];
    
    public static $upload_path = '../uploads/';
    public static $export_path = '../exports/';
    public static $logs_path = '../logs/';
    
    public static $email_config = [
        'smtp_host' => 'smtp.gmail.com',
        'smtp_port' => 587,
        'smtp_secure' => 'tls',
        'smtp_username' => '',
        'smtp_password' => '',
        'from_email' => 'noreply@empaquesmultiples.com',
        'from_name' => 'Empaques Múltiples - Sistema de Almuerzos'
    ];
    
    public static $timezone = 'America/Santo_Domingo';
    
    public static function init() {
        date_default_timezone_set(self::$timezone);
        
        // Create required directories
        if (!file_exists(self::$upload_path)) {
            mkdir(self::$upload_path, 0755, true);
        }
        if (!file_exists(self::$export_path)) {
            mkdir(self::$export_path, 0755, true);
        }
        if (!file_exists(self::$logs_path)) {
            mkdir(self::$logs_path, 0755, true);
        }
    }
}

// Initialize app configuration
AppConfig::init();
?>