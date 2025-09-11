# Sistema de Registro de Almuerzos - Empaques Múltiples

Este es un sistema moderno de registro de almuerzos desarrollado con React y Supabase, que reemplaza el sistema anterior con funcionalidades avanzadas.

## 🚀 Características

### Funcionalidades Principales
- ✅ **Autenticación segura** con Supabase Auth
- ✅ **Dashboard con estadísticas** y gráficos en tiempo real
- ✅ **Exportación a Excel** de reportes detallados
- ✅ **Funcionamiento offline** con sincronización automática
- ✅ **Control de roles** (Admin, RRHH, Recepción, Usuario)
- ✅ **Gestión de usuarios y departamentos**
- ✅ **Reportes en tiempo real** con Supabase Realtime
- ✅ **Diseño responsive** con colores corporativos

### Roles y Permisos
- **Admin**: Acceso completo al sistema, gestión de usuarios y departamentos
- **RRHH**: Puede ver registros de los últimos 60 días, crear registros para otros
- **Recepción**: Puede ver registros de los últimos 60 días, crear registros para otros
- **Usuario**: Solo puede ver y crear sus propios registros

## 📋 Requisitos

- Cuenta de Supabase
- Node.js 18+ y npm
- Navegador web moderno

## 🛠️ Configuración de Base de Datos

### 1. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Copia la URL y la clave pública (anon key)

### 2. Ejecutar scripts SQL
Ejecuta los siguientes scripts en el editor SQL de Supabase:

```sql
-- 1. Primero ejecutar: database/01_schema.sql
-- Esto creará las tablas principales: departments, profiles, lunch_records

-- 2. Luego ejecutar: database/02_rls_policies.sql  
-- Esto configurará las políticas de seguridad Row Level Security
```

### 3. Configurar Authentication
1. En Supabase Dashboard → Authentication → Settings
2. Habilita "Enable email confirmations" si deseas confirmación por email
3. Configura los providers de autenticación según necesites

## ⚙️ Instalación y Desarrollo

### 1. Instalar dependencias
```bash
cd lunch-system
npm install
```

### 2. Configurar variables de entorno
Actualiza `src/lib/supabase.js` con tu URL y clave de Supabase:
```javascript
const supabaseUrl = 'TU_SUPABASE_URL'
const supabaseKey = 'TU_SUPABASE_ANON_KEY'
```

### 3. Desarrollo local
```bash
npm run dev
```
El sistema estará disponible en `http://localhost:3000`

### 4. Build para producción
```bash
npm run build
```
Los archivos se generarán en `../dist-lunch/`

## 🚀 Despliegue

### Opción 1: Integración con sitio existente
Los archivos ya están configurados para integrarse con el sitio web existente:
1. El build se genera en `dist-lunch/`
2. La página `almuerzo.html` actúa como landing page
3. Los usuarios pueden acceder al nuevo sistema o usar el anterior

### Opción 2: Despliegue independiente
1. Sube el contenido de `dist-lunch/` a tu servidor web
2. Configura tu servidor para servir `index.html` para todas las rutas (SPA)
3. Asegúrate de que la imagen del logo esté disponible

## 👥 Gestión de Usuarios

### Crear primer administrador
1. Registra un usuario normal a través de la interfaz
2. En Supabase Dashboard → Authentication → Users
3. Copia el UUID del usuario
4. En SQL Editor ejecuta:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'UUID_DEL_USUARIO';
```

### Crear departamentos
Los departamentos básicos se crean automáticamente, pero puedes agregar más:
```sql
INSERT INTO departments (name) VALUES ('Nuevo Departamento');
```

## 📊 Características Técnicas

### Base de Datos
- **PostgreSQL** con Supabase
- **Row Level Security** para control de acceso
- **Triggers** para campos automáticos (updated_at)
- **Índices** optimizados para consultas frecuentes

### Frontend
- **React 19** con hooks modernos
- **Vite** para build rápido
- **React Router** para navegación
- **Recharts** para gráficos
- **Lucide React** para iconos
- **XLSX** para exportación Excel
- **Dexie** para almacenamiento offline

### Funciones Offline
- **IndexedDB** para almacenamiento local
- **Sync Queue** para sincronización
- **Detección automática** de conexión
- **Retry automático** cuando vuelve conexión

## 🔧 Mantenimiento

### Backup automático
El sistema está preparado para implementar Edge Functions para:
- Reportes diarios automáticos por email
- Backup mensual de datos
- Limpieza de registros antiguos

### Monitoreo
- Logs de Supabase para errores
- Métricas de uso en Dashboard
- Alertas de sincronización offline

## 📱 Uso del Sistema

### Para Usuarios
1. Registrarse o iniciar sesión
2. Ir a "Registrar Almuerzo"
3. Completar el formulario
4. Ver historial en Dashboard

### Para RRHH/Recepción
1. Acceso a Dashboard completo
2. Registrar almuerzos para otros empleados
3. Exportar reportes
4. Ver estadísticas de últimos 60 días

### Para Administradores
1. Gestión completa de usuarios
2. Crear/editar departamentos
3. Cambiar roles de usuarios
4. Acceso total a reportes

## 🎨 Personalización

Los colores corporativos están definidos en `src/styles.css`:
```css
:root {
  --verde: #116835;
  --verde-oscuro: #0c4725;
  --verde-claro: #e9f4ef;
  /* ... más colores */
}
```

## 📞 Soporte

Para soporte técnico o dudas sobre el sistema:
1. Revisar logs en Supabase Dashboard
2. Verificar consola del navegador para errores frontend
3. Comprobar políticas RLS si hay problemas de permisos

## 🔐 Seguridad

- Autenticación JWT con Supabase
- Row Level Security en base de datos
- Validación tanto frontend como backend
- Políticas estrictas por rol de usuario
- Encriptación de datos en tránsito y reposo