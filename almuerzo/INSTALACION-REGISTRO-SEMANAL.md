# Guía de Instalación: Sistema de Registro Semanal

## Paso 1: Actualizar las Reglas de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Realtime Database > Reglas**
4. Reemplaza el contenido con:

```json
{
  "rules": {
    "asistencias": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$asistenciaId": {
        ".validate": "newData.hasChildren(['userId', 'nombre', 'email', 'fecha', 'hora', 'timestamp'])"
      }
    },
    "preferenciasRegistro": {
      ".read": "auth != null",
      "$userId": {
        ".write": "auth.uid == $userId"
      }
    },
    "menuSemanal": {
      ".read": "auth != null"
    },
    "users": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

5. Haz clic en **Publicar**

## Paso 2: Verificar Archivos Actualizados

Asegúrate de que los siguientes archivos estén actualizados:

✅ **almuerzo/js/database.js** - Contiene nuevas funciones para preferencias
✅ **almuerzo/usuario.html** - Interfaz de configuración de registro
✅ **almuerzo/admin.html** - Panel para ver preferencias de usuarios
✅ **almuerzo/css/almuerzo.css** - Estilos para nuevos elementos
✅ **almuerzo/REGISTRO-SEMANAL.md** - Documentación completa

## Paso 3: Prueba del Sistema

### Para Usuarios:

1. Inicia sesión en el sistema de almuerzo
2. Verás una nueva tarjeta **"Configurar Registro de Asistencia"**
3. Selecciona una opción:
   - **Registro Manual Diario**: Mantiene el comportamiento actual
   - **Registro Automático Semanal**: Registra L-V automáticamente
   - **Registro Personalizado**: Elige días específicos
4. Haz clic en **"Guardar Preferencia"**
5. Deberías ver un mensaje de éxito
6. La configuración actual se muestra debajo del botón

### Para Administrador:

1. Inicia sesión como administrador
2. En el panel, verás una nueva sección **"Preferencias de Registro"**
3. Verás:
   - Estadísticas de cuántos usuarios tienen cada tipo de registro
   - Tabla con detalles de cada usuario
   - Buscador por nombre
4. Haz clic en **"Actualizar"** para refrescar la lista

## Paso 4: Configurar Registro Automático (Opcional)

Para que el registro automático funcione correctamente, puedes:

### Opción A: Verificar al acceso del usuario (Recomendado)

En `usuario.html`, agregar al inicio de `inicializarPagina()`:

```javascript
// Intentar registrar automáticamente si está configurado
registrarAsistenciaAutomatica(currentUser.uid, currentUser.displayName, currentUser.email)
    .then((resultado) => {
        if (resultado.exito) {
            console.log('Registro automático completado');
            // Recargar historial
            cargarHistorial();
        }
    });
```

### Opción B: Cloud Function programada

Crear una Cloud Function que se ejecute diariamente a una hora específica:

```javascript
exports.registroAsistenciaAutomatica = functions.pubsub
    .schedule('0 8 * * MON-FRI')  // Lunes a viernes a las 8 AM
    .timeZone('America/Bogota')  // Cambia a tu zona horaria
    .onRun(async (context) => {
        const db = admin.database();
        const preferenciasRef = db.ref('preferenciasRegistro');
        
        const preferences = await preferenciasRef.once('value');
        
        preferences.forEach(async (child) => {
            const userId = child.key;
            const pref = child.val();
            
            if (pref.tipo === 'semanal' || pref.tipo === 'personalizado') {
                // Obtener datos del usuario y registrar
                const userRef = db.ref(`users/${userId}`);
                const userData = await userRef.once('value');
                
                if (userData.exists()) {
                    const user = userData.val();
                    // Registrar asistencia automática
                    await db.ref('asistencias').push({
                        userId: userId,
                        nombre: user.displayName,
                        email: user.email,
                        fecha: new Date().toISOString().split('T')[0],
                        hora: new Date().toTimeString().split(' ')[0],
                        timestamp: Date.now(),
                        automatico: true
                    });
                }
            }
        });
        
        return null;
    });
```

## Paso 5: Verificar Funcionamiento

### Checklist de Validación:

- [ ] Los usuarios pueden acceder a la sección de configuración
- [ ] Pueden seleccionar diferentes tipos de registro
- [ ] Se guarda correctamente la preferencia
- [ ] El admin ve las preferencias en el panel
- [ ] Se muestran correctamente los contadores de usuarios
- [ ] La búsqueda en el panel de admin funciona
- [ ] Los estilos se ven correctamente en desktop y mobile

## Troubleshooting

### Problema: No veo la tarjeta de configuración

**Solución**: 
1. Verifica que `usuario.html` esté actualizado
2. Limpia el cache del navegador (Ctrl+F5)
3. Verifica que `database.js` tenga las nuevas funciones

### Problema: El error dice "obtenerPreferenciaRegistro is not defined"

**Solución**:
1. Verifica que `database.js` esté cargado antes de `usuario.html`
2. Comprueba que el archivo `database.js` contiene las nuevas funciones

### Problema: Las preferencias no se guardan

**Solución**:
1. Verifica las reglas de Firebase (Paso 1)
2. Abre la consola del navegador (F12) para ver errores
3. Comprueba que el usuario está autenticado correctamente

### Problema: El admin no ve las preferencias

**Solución**:
1. Verifica que `admin.html` esté actualizado
2. Asegúrate de que el usuario sea administrador
3. Haz clic en "Actualizar" en la sección de preferencias

## Contacto y Soporte

Para reportar problemas o solicitar mejoras, contacta al equipo de desarrollo.

## Cambios Realizados

- ✅ Agregadas funciones de preferencia en database.js
- ✅ Creada interfaz de configuración en usuario.html
- ✅ Agregada visualización de preferencias en admin.html
- ✅ Agregados estilos CSS para nuevos elementos
- ✅ Documentación completa del sistema
