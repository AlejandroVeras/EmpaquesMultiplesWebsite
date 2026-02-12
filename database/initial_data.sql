-- Initial data for lunch registration system
-- Empaques Múltiples SRL

USE empaques_lunch_system;

-- Insert default roles
INSERT INTO roles (name, permissions) VALUES 
('admin', JSON_OBJECT(
    'manage_users', true,
    'manage_departments', true,
    'manage_roles', true,
    'view_all_records', true,
    'edit_all_records', true,
    'delete_records', true,
    'export_data', true,
    'view_logs', true,
    'system_config', true
)),
('rrhh', JSON_OBJECT(
    'manage_users', false,
    'manage_departments', false,
    'manage_roles', false,
    'view_all_records', true,
    'edit_all_records', false,
    'delete_records', false,
    'export_data', true,
    'view_logs', true,
    'system_config', false
)),
('recepcion', JSON_OBJECT(
    'manage_users', false,
    'manage_departments', false,
    'manage_roles', false,
    'view_all_records', false,
    'edit_all_records', false,
    'delete_records', false,
    'export_data', false,
    'view_logs', false,
    'system_config', false,
    'register_lunch', true,
    'view_today_records', true
)),
('usuario', JSON_OBJECT(
    'manage_users', false,
    'manage_departments', false,
    'manage_roles', false,
    'view_all_records', false,
    'edit_all_records', false,
    'delete_records', false,
    'export_data', false,
    'view_logs', false,
    'system_config', false,
    'register_lunch', true,
    'view_own_records', true
));

-- Insert default departments
INSERT INTO departments (name) VALUES 
('Administración'),
('Recursos Humanos'),
('Recepción'),
('Producción'),
('Ventas'),
('Contabilidad'),
('Almacén'),
('Mantenimiento'),
('Calidad'),
('Logística');

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123'
INSERT INTO users (username, password, full_name, email, department_id, role_id) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador del Sistema', 'admin@empaquesmultiples.com', 1, 1);

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES 
('company_name', 'Empaques Múltiples SRL', 'Nombre de la empresa'),
('company_email', 'contacto@empaquesmultiples.com', 'Email de contacto de la empresa'),
('lunch_time_start', '12:00:00', 'Hora de inicio del almuerzo'),
('lunch_time_end', '14:00:00', 'Hora de fin del almuerzo'),
('notification_email', 'rrhh@empaquesmultiples.com', 'Email para notificaciones'),
('backup_retention_days', '30', 'Días de retención de backups'),
('session_timeout_minutes', '480', 'Timeout de sesión en minutos (8 horas)'),
('allow_registration', 'false', 'Permitir auto-registro de usuarios'),
('require_email', 'false', 'Requerir email para usuarios'),
('lunch_cutoff_time', '11:30:00', 'Hora límite para registrar almuerzo del día');

-- Create a view for user details with department and role info
CREATE VIEW user_details AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    u.email,
    u.active,
    u.created_at,
    u.updated_at,
    d.name as department_name,
    r.name as role_name,
    r.permissions
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
JOIN roles r ON u.role_id = r.id;

-- Create a view for lunch records with user details
CREATE VIEW lunch_records_view AS
SELECT 
    lr.id,
    lr.date,
    lr.time,
    lr.comments,
    lr.created_at,
    lr.updated_at,
    u.full_name as user_name,
    u.username,
    d.name as department_name,
    creator.full_name as created_by_name
FROM lunch_records lr
JOIN users u ON lr.user_id = u.id
LEFT JOIN departments d ON u.department_id = d.id
JOIN users creator ON lr.created_by = creator.id;