# 🚀 Deployment Checklist - Sistema de Registro de Almuerzos

Esta lista de verificación te ayudará a desplegar el sistema de registro de almuerzos en producción.

## ✅ Pre-requisitos

- [ ] Cuenta en Supabase ([supabase.com](https://supabase.com))
- [ ] Acceso al servidor web donde se alojará la aplicación
- [ ] Permisos para ejecutar scripts SQL en Supabase

## 📋 Pasos de Despliegue

### 1. Configurar Supabase

#### 1.1 Crear Proyecto
- [ ] Iniciar sesión en Supabase
- [ ] Crear nuevo proyecto
- [ ] Anotar la URL del proyecto (se verá como: `https://xxxxx.supabase.co`)
- [ ] Anotar la clave pública/anon key (disponible en Settings > API)

#### 1.2 Ejecutar Scripts SQL
- [ ] Ir a SQL Editor en Supabase Dashboard
- [ ] Ejecutar `database/01_schema.sql` (crear tablas)
- [ ] Ejecutar `database/02_rls_policies.sql` (configurar seguridad)
- [ ] Verificar que las tablas se crearon correctamente en Table Editor

#### 1.3 Verificar Configuración
- [ ] Confirmar que existen 3 tablas: `departments`, `profiles`, `lunch_records`
- [ ] Verificar que hay departamentos por defecto en la tabla `departments`

### 2. Configurar la Aplicación

#### 2.1 Actualizar Credenciales
Si las credenciales de Supabase cambian:
- [ ] Editar `lunch-system/src/lib/supabase.js`
- [ ] Actualizar `supabaseUrl` con tu URL
- [ ] Actualizar `supabaseKey` con tu anon key
- [ ] Ejecutar `cd lunch-system && npm run build`

#### 2.2 Verificar Build
- [ ] Confirmar que existe la carpeta `dist-lunch/`
- [ ] Verificar que contiene `index.html` y carpeta `assets/`

### 3. Subir Archivos al Servidor

#### 3.1 Archivos Necesarios
- [ ] Subir `almuerzo.html` a la raíz del sitio web
- [ ] Subir toda la carpeta `dist-lunch/` (con su contenido)
- [ ] Verificar que `dist-lunch/logo.png` esté presente

#### 3.2 Estructura de Archivos en Servidor
```
servidor-web/
├── almuerzo.html           # Página de entrada
├── dist-lunch/             # Aplicación
│   ├── index.html
│   ├── logo.png
│   └── assets/
│       ├── index-xxxxx.js
│       ├── index-xxxxx.css
│       └── logo-xxxxx.png
└── ... (resto de tu sitio)
```

### 4. Crear Primer Usuario Admin

#### 4.1 Registrar Usuario
- [ ] Navegar a `https://tudominio.com/almuerzo.html`
- [ ] Hacer clic en "¿No tienes una cuenta? Regístrate"
- [ ] Completar el formulario de registro
- [ ] Verificar el correo electrónico (si está habilitado)
- [ ] Iniciar sesión

#### 4.2 Promover a Admin
- [ ] Ir a Supabase Dashboard > Authentication > Users
- [ ] Copiar el UUID del usuario recién creado
- [ ] Ir a SQL Editor
- [ ] Ejecutar el siguiente script:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'PEGAR-UUID-AQUI';
```

- [ ] Cerrar sesión y volver a iniciar en la aplicación
- [ ] Verificar que ahora aparece "Panel de Administración" en el menú

### 5. Configuración Opcional

#### 5.1 Confirmación de Email (Opcional)
- [ ] Ir a Supabase Dashboard > Authentication > Settings
- [ ] En "Email Auth" decidir si habilitar confirmación por email
- [ ] Configurar plantillas de email si es necesario

#### 5.2 Crear Departamentos Adicionales (Opcional)
Si necesitas más departamentos además de los predeterminados:

```sql
INSERT INTO departments (name) VALUES 
  ('Nuevo Departamento 1'),
  ('Nuevo Departamento 2');
```

### 6. Pruebas Post-Despliegue

#### 6.1 Pruebas de Usuario Regular
- [ ] Crear un usuario de prueba (sin rol admin)
- [ ] Registrar un almuerzo
- [ ] Verificar que aparece en "Registros de Hoy"
- [ ] Verificar que NO puede ver el Panel de Administración
- [ ] Intentar registrar otro almuerzo el mismo día (debe fallar)

#### 6.2 Pruebas de Administrador
- [ ] Iniciar sesión con usuario admin
- [ ] Verificar que puede acceder al Dashboard
- [ ] Probar filtros por fecha
- [ ] Exportar a Excel y verificar el archivo
- [ ] Acceder al Panel de Administración
- [ ] Crear un nuevo usuario desde el panel admin
- [ ] Editar un departamento

#### 6.3 Pruebas de Responsive
- [ ] Abrir en dispositivo móvil o usar DevTools
- [ ] Verificar que el diseño se adapta correctamente
- [ ] Probar todas las funcionalidades en móvil

#### 6.4 Pruebas de Seguridad
- [ ] Verificar que usuarios regulares NO pueden ver registros de otros
- [ ] Verificar que usuarios regulares NO pueden acceder a /admin
- [ ] Intentar manipular roles desde la consola (debe fallar)

### 7. Configuración de Usuarios Adicionales

#### 7.1 Asignar Roles
Para asignar roles a usuarios existentes, ejecutar en SQL Editor:

```sql
-- Convertir a Admin
UPDATE profiles SET role = 'admin' WHERE id = 'UUID_USUARIO';

-- Convertir a RRHH
UPDATE profiles SET role = 'rrhh' WHERE id = 'UUID_USUARIO';

-- Convertir a Recepción
UPDATE profiles SET role = 'recepcion' WHERE id = 'UUID_USUARIO';

-- Usuario regular (por defecto)
UPDATE profiles SET role = 'user' WHERE id = 'UUID_USUARIO';
```

#### 7.2 Asignar Departamentos
```sql
UPDATE profiles 
SET department_id = (SELECT id FROM departments WHERE name = 'Nombre Departamento')
WHERE id = 'UUID_USUARIO';
```

### 8. Mantenimiento

#### 8.1 Backup de Base de Datos
- [ ] Configurar backups automáticos en Supabase (Settings > Database)
- [ ] Establecer política de retención de backups

#### 8.2 Monitoreo
- [ ] Revisar Supabase Dashboard > Database > Logs periódicamente
- [ ] Monitorear uso de almacenamiento
- [ ] Revisar logs de autenticación

#### 8.3 Actualizaciones
Para actualizar la aplicación en el futuro:
- [ ] Hacer cambios en `lunch-system/src/`
- [ ] Ejecutar `npm run build` en `lunch-system/`
- [ ] Reemplazar contenido de `dist-lunch/` en el servidor

## 🔒 Seguridad

### Mejores Prácticas
- [ ] Nunca compartir las credenciales de Supabase públicamente
- [ ] Usar HTTPS en el servidor web (certificado SSL)
- [ ] Revisar políticas RLS regularmente
- [ ] Mantener contraseñas seguras para usuarios admin
- [ ] Desactivar usuarios que ya no trabajan en la empresa

### Políticas de Password
Configurar en Supabase Dashboard > Authentication > Settings:
- [ ] Longitud mínima de contraseña
- [ ] Requisitos de complejidad
- [ ] Tiempo de expiración de sesión

## 📞 Soporte

### Problemas Comunes

**Problema: No puedo iniciar sesión**
- Verificar que el email está confirmado (si está habilitado)
- Verificar credenciales en Supabase > Authentication > Users
- Revisar políticas RLS

**Problema: No veo el Panel de Administración**
- Verificar rol del usuario en tabla `profiles`
- Cerrar sesión y volver a iniciar

**Problema: Error al registrar almuerzo**
- Verificar que no haya un registro previo ese mismo día
- Revisar políticas RLS
- Verificar logs en Supabase Dashboard

**Problema: No puedo exportar a Excel**
- Verificar que el usuario tiene rol admin, rrhh o recepcion
- Revisar permisos del navegador

### Logs y Debugging
- Supabase Dashboard > Database > Logs
- Supabase Dashboard > Authentication > Logs
- Consola del navegador (F12 > Console)

## ✅ Checklist Final

Antes de dar por completado el despliegue:
- [ ] Base de datos configurada en Supabase
- [ ] Archivos subidos al servidor web
- [ ] Al menos un usuario admin creado
- [ ] Pruebas básicas completadas
- [ ] HTTPS habilitado en el servidor
- [ ] URL de acceso compartida con usuarios
- [ ] Documentación entregada a administradores

## 🎉 ¡Listo!

El sistema está desplegado y listo para usar.

**URL de acceso:** `https://tudominio.com/almuerzo.html`

**Próximos pasos:**
1. Compartir URL con empleados
2. Crear usuarios adicionales según sea necesario
3. Asignar roles apropiados
4. Monitorear uso durante los primeros días
