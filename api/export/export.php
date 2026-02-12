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
        exportData($pdo);
        break;
    default:
        Utils::sendError('Método no permitido', 405);
}

function exportData($pdo) {
    $user = JWTAuth::authenticate('export_data');
    
    $format = $_GET['format'] ?? 'csv';
    $date_from = $_GET['date_from'] ?? null;
    $date_to = $_GET['date_to'] ?? null;
    $department_id = $_GET['department_id'] ?? null;
    
    if (!in_array($format, ['csv', 'excel'])) {
        Utils::sendError('Formato no válido. Use csv o excel', 400);
    }
    
    try {
        // Build query with filters
        $where_conditions = ['1=1'];
        $params = [];
        
        if ($date_from && Utils::validateDate($date_from)) {
            $where_conditions[] = 'lr.date >= ?';
            $params[] = $date_from;
        }
        
        if ($date_to && Utils::validateDate($date_to)) {
            $where_conditions[] = 'lr.date <= ?';
            $params[] = $date_to;
        }
        
        if ($department_id && is_numeric($department_id)) {
            $where_conditions[] = 'u.department_id = ?';
            $params[] = $department_id;
        }
        
        // Get data
        $query = "
            SELECT lr.date, lr.time, lr.comments, lr.created_at,
                   u.full_name as empleado, u.username,
                   d.name as departamento,
                   creator.full_name as registrado_por
            FROM lunch_records lr
            JOIN users u ON lr.user_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            JOIN users creator ON lr.created_by = creator.id
            WHERE " . implode(' AND ', $where_conditions) . "
            ORDER BY lr.date DESC, lr.created_at DESC
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $records = $stmt->fetchAll();
        
        if (empty($records)) {
            Utils::sendError('No hay datos para exportar con los filtros especificados', 404);
        }
        
        // Log export activity
        Utils::logActivity($pdo, $user['user_id'], 'export', 'lunch_records', null, [
            'format' => $format,
            'filters' => compact('date_from', 'date_to', 'department_id'),
            'record_count' => count($records)
        ]);
        
        if ($format === 'csv') {
            exportToCSV($records);
        } else {
            exportToExcel($records);
        }
        
    } catch (Exception $e) {
        Utils::sendError('Error al exportar datos: ' . $e->getMessage(), 500);
    }
}

function exportToCSV($records) {
    $filename = 'registros_almuerzo_' . date('Y-m-d_H-i-s') . '.csv';
    
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: 0');
    
    // Output UTF-8 BOM for Excel compatibility
    echo "\xEF\xBB\xBF";
    
    $output = fopen('php://output', 'w');
    
    // CSV Headers
    $headers = [
        'Fecha',
        'Hora',
        'Empleado',
        'Usuario',
        'Departamento',
        'Comentarios',
        'Registrado Por',
        'Fecha de Registro'
    ];
    
    fputcsv($output, $headers);
    
    // Data rows
    foreach ($records as $record) {
        $row = [
            $record['date'],
            $record['time'] ?: 'N/A',
            $record['empleado'],
            $record['username'],
            $record['departamento'] ?: 'N/A',
            $record['comments'] ?: '',
            $record['registrado_por'],
            date('Y-m-d H:i:s', strtotime($record['created_at']))
        ];
        
        fputcsv($output, $row);
    }
    
    fclose($output);
    exit();
}

function exportToExcel($records) {
    // For Excel export, we'll create a basic HTML table that Excel can open
    // In a production environment, you might want to use a library like PHPSpreadsheet
    
    $filename = 'registros_almuerzo_' . date('Y-m-d_H-i-s') . '.xls';
    
    header('Content-Type: application/vnd.ms-excel; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: 0');
    
    echo '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    echo '<head>';
    echo '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">';
    echo '<meta name="ProgId" content="Excel.Sheet">';
    echo '<meta name="Generator" content="Microsoft Excel 11">';
    echo '<style>';
    echo 'table { border-collapse: collapse; width: 100%; }';
    echo 'th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }';
    echo 'th { background-color: #e9f4ef; font-weight: bold; }';
    echo '</style>';
    echo '</head>';
    echo '<body>';
    
    echo '<table>';
    echo '<tr>';
    echo '<th>Fecha</th>';
    echo '<th>Hora</th>';
    echo '<th>Empleado</th>';
    echo '<th>Usuario</th>';
    echo '<th>Departamento</th>';
    echo '<th>Comentarios</th>';
    echo '<th>Registrado Por</th>';
    echo '<th>Fecha de Registro</th>';
    echo '</tr>';
    
    foreach ($records as $record) {
        echo '<tr>';
        echo '<td>' . htmlspecialchars($record['date']) . '</td>';
        echo '<td>' . htmlspecialchars($record['time'] ?: 'N/A') . '</td>';
        echo '<td>' . htmlspecialchars($record['empleado']) . '</td>';
        echo '<td>' . htmlspecialchars($record['username']) . '</td>';
        echo '<td>' . htmlspecialchars($record['departamento'] ?: 'N/A') . '</td>';
        echo '<td>' . htmlspecialchars($record['comments'] ?: '') . '</td>';
        echo '<td>' . htmlspecialchars($record['registrado_por']) . '</td>';
        echo '<td>' . htmlspecialchars(date('Y-m-d H:i:s', strtotime($record['created_at']))) . '</td>';
        echo '</tr>';
    }
    
    echo '</table>';
    echo '</body>';
    echo '</html>';
    
    exit();
}
?>