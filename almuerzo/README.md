# Sistema de Registro de Asistencia al Almuerzo

## Descripción
Sistema completo de registro de asistencia al almuerzo para Empaques Múltiples con autenticación, gestión de usuarios y panel administrativo.

## Características
- ✅ Autenticación con Firebase (usuarios y administrador)
- ✅ Registro de asistencia al almuerzo (una vez por día)
- ✅ Historial personal de asistencias
- ✅ Panel administrativo con vista completa
- ✅ Filtrado por fechas
- ✅ Exportación a Excel
- ✅ Diseño responsive con colores corporativos
- ✅ Página oculta (no accesible desde navegación principal)

## Estructura de Archivos
```
almuerzo/
├── css/
│   └── almuerzo.css          # Estilos personalizados
├── js/
│   ├── firebase-config.js    # Configuración de Firebase
│   ├── auth.js               # Lógica de autenticación
│   ├── database.js           # Operaciones de base de datos
│   └── excel-export.js       # Exportación a Excel
├── login.html                # Página de inicio de sesión
├── usuario.html              # Dashboard de usuario
├── admin.html                # Dashboard de administrador
└── README.md                 # Este archivo
```

## Configuración de Firebase

### Paso 1: Crear un proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Nombra tu proyecto: "Empaques-Multiples-Almuerzo"
4. Sigue los pasos para completar la creación

### Paso 2: Configurar Authentication
1. En el menú lateral, ve a **Authentication**
2. Haz clic en **Comenzar**
3. En la pestaña **Sign-in method**, habilita:
   - **Correo electrónico/contraseña** ✓

### Paso 3: Configurar Realtime Database
1. En el menú lateral, ve a **Realtime Database**
2. Haz clic en **Crear base de datos**
3. Selecciona una ubicación (preferiblemente us-central1)
4. Comienza en **modo de prueba** (ajustaremos las reglas después)

### Paso 4: Configurar las reglas de seguridad
En Realtime Database > Reglas, pega el siguiente código:

```json
{
  "rules": {
    "asistencias": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$asistenciaId": {
        ".validate": "newData.hasChildren(['userId', 'nombre', 'email', 'fecha', 'hora', 'timestamp'])"
      }
    }
  }
}
```

### Paso 5: Obtener las credenciales
1. Ve a **Configuración del proyecto** (ícono de engranaje)
2. En la sección **Tus aplicaciones**, haz clic en el ícono **Web** (</>)
3. Registra la aplicación con el nombre "Sistema Almuerzo"
4. Copia las credenciales que aparecen

### Paso 6: Actualizar firebase-config.js
Abre el archivo `almuerzo/js/firebase-config.js` y reemplaza los valores:

```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef",
    databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com"
};
```

### Paso 7: Crear usuarios
1. En Firebase Console, ve a **Authentication > Users**
2. Haz clic en **Agregar usuario**
3. Crea el usuario administrador:
   - Email: `admin@casaempaques.com`
   - Contraseña: (elige una contraseña segura)
4. Crea usuarios regulares con sus correos corporativos

**Nota importante:** El email del administrador debe coincidir con el definido en `firebase-config.js` (línea 18).

## Uso del Sistema

### Acceso
- **URL de acceso:** `https://tu-dominio.com/almuerzo/login.html`
- Esta página NO está enlazada desde la navegación principal del sitio

### Para Usuarios Regulares
1. Iniciar sesión con credenciales corporativas
2. Hacer clic en "Registrar Asistencia" para el día actual
3. Ver historial de asistencias previas
4. Cerrar sesión

### Para Administrador
1. Iniciar sesión con credenciales de administrador
2. Ver estadísticas (hoy, mes, total)
3. Filtrar asistencias por rango de fechas
4. Buscar por nombre o email
5. Exportar datos a Excel
6. Cerrar sesión

## Características de Seguridad

### Autenticación
- Todas las páginas verifican autenticación al cargar
- Redireccionamiento automático si no está autenticado
- Separación de roles (usuario/admin)

### Base de Datos
- Solo usuarios autenticados pueden leer/escribir
- Validación de estructura de datos
- Timestamps para auditoría

### Restricción de Registro
- Un usuario solo puede registrarse una vez por día
- Validación en cliente y puede agregarse en servidor

## Tecnologías Utilizadas
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Framework CSS:** Bootstrap 5.3
- **Iconos:** Font Awesome 6.4
- **Backend:** Firebase (Authentication + Realtime Database)
- **Exportación:** SheetJS (xlsx)

## Personalización

### Colores Corporativos
Los colores están definidos en `css/almuerzo.css`:
- Primary (Verde): `#116835`
- Hover: `#0d5128`

### Logo
El logo se encuentra en: `../images/logo.png`

### Cambiar Email de Administrador
Edita `js/firebase-config.js`, línea 18:
```javascript
const ADMIN_EMAIL = "nuevo-admin@ejemplo.com";
```

## Soporte y Mantenimiento

### Problemas Comunes

**Error: "Firebase not defined"**
- Verifica que los scripts de Firebase estén cargando correctamente
- Revisa la consola del navegador para errores de red

**Error: "Permission denied"**
- Verifica las reglas de seguridad en Firebase
- Asegúrate de que el usuario esté autenticado

**No se puede exportar a Excel**
- Verifica que SheetJS esté cargando correctamente
- Revisa la consola para errores

### Base de Datos de Respaldo
Se recomienda hacer backups periódicos de la base de datos:
1. En Firebase Console, ve a Realtime Database
2. Haz clic en el menú (⋮) > Exportar JSON
3. Guarda el archivo de respaldo

## Contacto
Para soporte técnico, contacta al equipo de IT de Empaques Múltiples.

---
**© 2025 Empaques Múltiples SRL. Todos los derechos reservados.**
