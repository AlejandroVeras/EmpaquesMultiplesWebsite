# Guía Rápida de Configuración

## Pasos para activar el sistema

### 1. Crear cuenta en Firebase (5 minutos)
1. Ve a https://console.firebase.google.com/
2. Crea un proyecto nuevo llamado "Empaques-Multiples-Almuerzo"
3. No necesitas habilitar Google Analytics (opcional)

### 2. Configurar Authentication (2 minutos)
1. En el menú lateral: **Authentication** > **Get started**
2. En **Sign-in method**, habilita: **Email/Password**
3. Haz clic en **Save**

### 3. Configurar Realtime Database (3 minutos)
1. En el menú lateral: **Realtime Database** > **Create database**
2. Ubicación: **United States (us-central1)**
3. Modo: **Test mode** (lo cambiaremos después)
4. Haz clic en **Enable**

### 4. Aplicar reglas de seguridad (2 minutos)
1. En Realtime Database, ve a la pestaña **Rules**
2. Copia el contenido del archivo `firebase-rules.json`
3. Pégalo en el editor de reglas
4. Haz clic en **Publish**

### 5. Obtener credenciales (5 minutos)
1. Haz clic en el ícono de engranaje > **Project settings**
2. En **Your apps**, haz clic en el ícono **Web** (`</>`)
3. Registra la app: nombre "Sistema Almuerzo"
4. **NO** marques Firebase Hosting
5. Haz clic en **Register app**
6. Copia el objeto `firebaseConfig` que aparece

### 6. Configurar el código (3 minutos)
1. Abre `almuerzo/js/firebase-config.js`
2. Reemplaza los valores con tus credenciales de Firebase
3. Verifica que `ADMIN_EMAIL` tenga el email correcto del admin
4. Guarda el archivo

### 7. Crear usuarios (5 minutos)
1. En Firebase Console: **Authentication** > **Users** > **Add user**
2. Crea el administrador:
   - Email: `admin@casaempaques.com` (o el que configuraste)
   - Contraseña: (elige una contraseña segura)
3. Crea usuarios regulares con sus emails corporativos

### 8. Probar el sistema (10 minutos)
1. Sube los archivos a tu servidor web
2. Accede a: `https://tu-dominio.com/almuerzo/login.html`
3. Inicia sesión con el usuario admin
4. Verifica que todas las funciones trabajen correctamente
5. Cierra sesión y prueba con un usuario regular

## ✅ ¡Listo!
El sistema está configurado y listo para usar.

## 🔒 Seguridad
- El directorio `/almuerzo/` NO debe estar enlazado desde la navegación principal
- Solo comparte el link con empleados autorizados
- Cambia las contraseñas periódicamente
- Revisa regularmente los logs de Firebase

## 📞 Soporte
Si tienes problemas, contacta al equipo de IT.

---
**Tiempo total de configuración: ~30 minutos**
