# Sistema Completo de Registro de Almuerzos
## Empaques Múltiples SRL

Este es un sistema completo de registro de almuerzos que incluye autenticación JWT, manejo de roles y permisos, dashboard con estadísticas, panel de administración y exportación de datos.

## Características Implementadas

### ✅ Base de Datos
- **Tablas creadas:**
  - `users` - Usuarios del sistema con roles y departamentos
  - `lunch_records` - Registros de almuerzo con validaciones
  - `departments` - Departamentos de la empresa
  - `roles` - Roles con permisos JSON
  - `activity_logs` - Logs de actividad del sistema
  - `email_notifications` - Cola de notificaciones por email
  - `system_config` - Configuración del sistema
  - `user_sessions` - Gestión de tokens JWT

### ✅ Backend (PHP/MySQL)
- **API RESTful** con endpoints completos
- **Autenticación JWT** con blacklist de tokens
- **Sistema de permisos** basado en roles:
  - **Admin**: Acceso total al sistema
  - **RRHH**: Ver todos los registros y exportar reportes
  - **Recepción**: Registrar almuerzos y ver registros del día
  - **Usuario**: Ver solo sus propios registros
- **Validación de datos** en todas las operaciones
- **Exportación** a CSV y Excel
- **Logs de actividad** para auditoría

### ✅ Frontend
- **Dashboard principal** (`dashboard.html`) con:
  - Estadísticas en tiempo real
  - Filtros por fecha y departamento
  - Tabla de registros con paginación
  - Gráficos estadísticos (Chart.js)
  - Diseño responsive
  
- **Formulario de registro** integrado con:
  - Autocompletado de empleados
  - Validación en tiempo real
  - Confirmación visual
  
- **Panel de administración** (`admin.html`) con:
  - Gestión de usuarios
  - Gestión de departamentos
  - Configuración del sistema
  - Visualización de logs

- **Sistema de login** (`login.html`) con:
  - Autenticación segura
  - Interfaz moderna y responsive
  - Enlace al sistema básico existente

### ✅ Características Adicionales
- **Diseño corporativo** manteniendo los colores de Empaques Múltiples
- **Responsive design** para dispositivos móviles
- **Validaciones** de duplicados y permisos
- **Estructura modular** y escalable

## Estructura de Archivos

```
/
├── database/
│   ├── schema.sql              # Esquema de la base de datos
│   └── initial_data.sql        # Datos iniciales (roles, admin, etc.)
├── api/
│   ├── config/
│   │   ├── database.php        # Configuración de BD
│   │   └── utils.php           # Funciones utilitarias
│   ├── auth/
│   │   ├── jwt.php             # Manejo de JWT
│   │   ├── login.php           # Endpoint de login
│   │   └── logout.php          # Endpoint de logout
│   ├── lunch/
│   │   └── records.php         # CRUD de registros de almuerzo
│   ├── users/
│   │   └── users.php           # CRUD de usuarios
│   ├── departments/
│   │   └── departments.php     # CRUD de departamentos
│   └── export/
│       └── export.php          # Exportación de datos
├── js/
│   ├── dashboard.js            # JavaScript del dashboard
│   └── admin.js                # JavaScript del panel admin
├── dashboard.html              # Dashboard principal
├── login.html                  # Página de login
├── admin.html                  # Panel de administración
└── almuerzo.html               # Sistema básico existente (mantenido)
```

## Instalación y Configuración

### 1. Base de Datos
```sql
-- Ejecutar en MySQL
source database/schema.sql;
source database/initial_data.sql;
```

### 2. Configuración PHP
Editar `api/config/database.php` con las credenciales de tu base de datos:
```php
private $host = 'localhost';
private $db_name = 'empaques_lunch_system';
private $username = 'tu_usuario';
private $password = 'tu_password';
```

### 3. Usuarios por Defecto
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: Administrador

## Endpoints de la API

### Autenticación
- `POST /api/auth/login.php` - Iniciar sesión
- `POST /api/auth/logout.php` - Cerrar sesión

### Registros de Almuerzo
- `GET /api/lunch/records.php` - Obtener registros
- `POST /api/lunch/records.php` - Crear registro
- `PUT /api/lunch/records.php?id={id}` - Actualizar registro
- `DELETE /api/lunch/records.php?id={id}` - Eliminar registro

### Usuarios
- `GET /api/users/users.php` - Listar usuarios
- `POST /api/users/users.php` - Crear usuario
- `PUT /api/users/users.php?id={id}` - Actualizar usuario
- `DELETE /api/users/users.php?id={id}` - Desactivar usuario

### Departamentos
- `GET /api/departments/departments.php` - Listar departamentos
- `POST /api/departments/departments.php` - Crear departamento
- `PUT /api/departments/departments.php?id={id}` - Actualizar departamento
- `DELETE /api/departments/departments.php?id={id}` - Desactivar departamento

### Exportación
- `GET /api/export/export.php?format=csv` - Exportar a CSV
- `GET /api/export/export.php?format=excel` - Exportar a Excel

## Permisos del Sistema

### Administrador
- `manage_users`: Gestionar usuarios
- `manage_departments`: Gestionar departamentos
- `manage_roles`: Gestionar roles
- `view_all_records`: Ver todos los registros
- `edit_all_records`: Editar cualquier registro
- `delete_records`: Eliminar registros
- `export_data`: Exportar datos
- `view_logs`: Ver logs del sistema
- `system_config`: Configurar el sistema

### RRHH
- `view_all_records`: Ver todos los registros
- `export_data`: Exportar reportes
- `view_logs`: Ver logs de actividad

### Recepción
- `register_lunch`: Registrar almuerzos
- `view_today_records`: Ver registros del día actual

### Usuario
- `register_lunch`: Registrar su propio almuerzo
- `view_own_records`: Ver sus propios registros

## Características de Seguridad

- **Passwords hasheados** con Argon2ID
- **Tokens JWT** con expiración de 8 horas
- **Blacklist de tokens** para logout seguro
- **Validación de permisos** en cada endpoint
- **Sanitización de inputs** para prevenir XSS
- **Prepared statements** para prevenir SQL injection
- **Logs de actividad** para auditoría

## Compatibilidad

- **PHP**: 7.4 o superior
- **MySQL**: 5.7 o superior
- **Navegadores**: Chrome, Firefox, Safari, Edge (versiones modernas)
- **Dispositivos**: Responsive design para móviles y tablets

## Próximas Mejoras Sugeridas

1. **Notificaciones por email** automáticas
2. **Modo offline** con sincronización
3. **Exportación automática** mensual
4. **Backup automático** de base de datos
5. **API de estadísticas** más avanzada
6. **Sistema de reportes** personalizables
7. **Integración con Active Directory**
8. **App móvil** nativa

---

© 2025 Empaques Múltiples SRL. Todos los derechos reservados.