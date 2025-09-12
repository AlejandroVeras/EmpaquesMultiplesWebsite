# Sistema de Registro de Comidas para Empleados

Este repositorio contiene un sistema completo de registro de comidas para empleados desarrollado con React y Supabase.

## 🚀 Sistema Implementado

El sistema de registro de comidas está **completamente desarrollado** y listo para usar. Incluye todas las funcionalidades requeridas:

### ✅ Funcionalidades Principales
- **Página de inicio de sesión** con autenticación segura (Supabase Auth)
- **Dashboard para empleados** para registrar si comerán
- **Dashboard para supervisores** con reportes y estadísticas
- **Sistema de roles** (admin, rrhh, recepcion, user)
- **Exportación a Excel** para reportes detallados
- **Reportes de últimos 60 días** con filtros avanzados
- **Funcionamiento offline** con sincronización automática

### 🛠️ Tecnologías Utilizadas
- **Frontend**: React 18 + Vite
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: Supabase Auth
- **Charts**: Recharts
- **Excel Export**: XLSX
- **Offline**: IndexedDB + Dexie
- **Styling**: CSS moderno con variables

## 📂 Estructura del Proyecto

```
/
├── almuerzo.html           # Página de acceso al sistema
├── dist-lunch/             # Versión compilada del sistema
├── lunch-system/           # Código fuente del sistema React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── hooks/         # Hooks personalizados
│   │   └── lib/           # Configuración y utilidades
│   └── package.json
├── database/               # Scripts SQL para Supabase
│   ├── 01_schema.sql      # Esquema de base de datos
│   └── 02_rls_policies.sql # Políticas de seguridad
└── supabase/              # Edge Functions (opcional)
```

## 🚀 Configuración e Instalación

### 1. Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar los scripts SQL en `database/`:
   - Primero: `01_schema.sql` (crea tablas)
   - Segundo: `02_rls_policies.sql` (configura seguridad)

### 2. Configurar Aplicación

1. Ir al directorio `lunch-system/`
2. Instalar dependencias: `npm install`
3. Actualizar `src/lib/supabase.js` con tus credenciales de Supabase
4. Construir para producción: `npm run build`

### 3. Configurar Usuario Administrador

1. Registrar un usuario a través de la interfaz
2. En Supabase Dashboard → Authentication → Users
3. Copiar el UUID del usuario
4. Ejecutar en SQL Editor:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'UUID_DEL_USUARIO';
```

## 📱 Acceso al Sistema

- **URL Principal**: `almuerzo.html` (página de acceso)
- **Sistema Directo**: `dist-lunch/index.html` (aplicación React)

## 👥 Roles de Usuario

- **admin**: Acceso completo, gestión de usuarios y departamentos
- **rrhh**: Reportes de 60 días, registros para otros empleados
- **recepcion**: Reportes de 60 días, registros para otros empleados  
- **user**: Solo sus propios registros

## 📊 Características Avanzadas

- **Tiempo Real**: Actualizaciones automáticas con Supabase Realtime
- **Offline**: Funciona sin conexión, sincroniza automáticamente
- **Responsive**: Funciona en móviles, tablets y escritorio
- **Seguro**: Row Level Security (RLS) en base de datos
- **Optimizado**: Build de producción optimizado

## 📖 Documentación Completa

Ver `README-lunch-system.md` para documentación técnica detallada.

## ✅ Estado del Proyecto

**El sistema está completamente implementado y listo para producción.** Solo requiere:
1. Configuración de credenciales de Supabase
2. Ejecución de scripts de base de datos
3. Creación del primer usuario administrador

Todas las funcionalidades solicitadas están implementadas y funcionando.