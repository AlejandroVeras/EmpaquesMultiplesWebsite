# 🚀 GUÍA RÁPIDA DE INSTALACIÓN
## Sistema de Almuerzo v2.0 - Actualización

---

## ⏱️ TIEMPO ESTIMADO: 15 minutos

---

## 📋 PRE-REQUISITOS

✅ Acceso al servidor web  
✅ Acceso a Firebase Console  
✅ Backup del sistema actual  
✅ Los archivos de actualización descargados  

---

## 🔧 PASO 1: BACKUP (5 minutos)

### 1.1 Backup de Archivos del Servidor

```bash
# Conectar al servidor
ssh usuario@servidor

# Crear carpeta de backup
mkdir -p /backup/almuerzo-$(date +%Y%m%d)

# Copiar archivos actuales
cp -r /var/www/html/almuerzo/* /backup/almuerzo-$(date +%Y%m%d)/
```

### 1.2 Backup de Firebase

1. Ir a **Firebase Console**
2. Seleccionar proyecto: **empaques-multiples-almuerzo**
3. Ir a **Realtime Database**
4. Clic en menú (⋮) → **Exportar JSON**
5. Guardar archivo: `firebase-backup-2025-01-29.json`

---

## 📤 PASO 2: SUBIR ARCHIVOS NUEVOS (3 minutos)

### 2.1 Archivos a Reemplazar

```bash
# En el servidor, ubicación: /var/www/html/almuerzo/

# Archivos NUEVOS/ACTUALIZADOS:
js/database.js          ← REEMPLAZAR
usuario.html            ← REEMPLAZAR
js/usuario-main.js      ← NUEVO (crear)
```

### 2.2 Comandos de Instalación

```bash
# Ir al directorio del proyecto
cd /var/www/html/almuerzo/

# Reemplazar database.js
cp /ruta/descarga/database.js js/database.js

# Reemplazar usuario.html
cp /ruta/descarga/usuario.html usuario.html

# Crear usuario-main.js (nuevo archivo)
cp /ruta/descarga/usuario-main.js js/usuario-main.js

# Verificar permisos
chmod 644 js/database.js
chmod 644 usuario.html
chmod 644 js/usuario-main.js
```

---

## 🔒 PASO 3: ACTUALIZAR REGLAS DE FIREBASE (2 minutos)

### 3.1 Ir a Firebase Console

1. Abrir: https://console.firebase.google.com/
2. Seleccionar: **empaques-multiples-almuerzo**
3. Menú lateral → **Realtime Database**
4. Pestaña → **Reglas**

### 3.2 Pegar Nuevas Reglas

**Copiar el contenido de `firebase-rules-updated.json` y pegarlo:**

```json
{
  "rules": {
    ".read": "auth != null",
    
    "asistencias": {
      ".read": "auth != null",
      "$id": {
        ".write": "auth != null && newData.child('userId').val() === auth.uid"
      }
    },
    
    "preferencias": {
      "$uid": {
        ".read": "auth != null && ($uid === auth.uid || auth.token.email === 'soporte.it.casaempaques@gmail.com' || root.child('roles').child(auth.uid).val() === 'admin')",
        ".write": "auth != null && $uid === auth.uid"
      }
    },
    
    "menuSemanal": {
      ".read": "auth != null",
      ".write": "auth != null && (auth.token.email === 'soporte.it.casaempaques@gmail.com' || root.child('roles').child(auth.uid).val() === 'admin')"
    },
    
    "usernames": {
      ".read": "auth != null && (auth.token.email === 'soporte.it.casaempaques@gmail.com' || root.child('roles').child(auth.uid).val() === 'admin')",
      "$username": {
        ".write": "auth != null && (auth.token.email === 'soporte.it.casaempaques@gmail.com' || root.child('roles').child(auth.uid).val() === 'admin') && !data.exists()"
      }
    },
    
    "roles": {
      "$uid": {
        ".read": "auth != null && ($uid === auth.uid || auth.token.email === 'soporte.it.casaempaques@gmail.com' || root.child('roles').child(auth.uid).val() === 'admin')",
        ".write": "auth != null && (auth.token.email === 'soporte.it.casaempaques@gmail.com' || root.child('roles').child(auth.uid).val() === 'admin')"
      }
    },
    
    "perfiles": {
      ".read": "auth != null && (auth.token.email === 'soporte.it.casaempaques@gmail.com' || root.child('roles').child(auth.uid).val() === 'admin')",
      "$uid": {
        ".read": "auth != null && ($uid === auth.uid || auth.token.email === 'soporte.it.casaempaques@gmail.com' || root.child('roles').child(auth.uid).val() === 'admin')",
        ".write": "auth != null && (auth.token.email === 'soporte.it.casaempaques@gmail.com' || root.child('roles').child(auth.uid).val() === 'admin')"
      }
    }
  }
}
```

### 3.3 Publicar Reglas

1. Revisar que no haya errores de sintaxis
2. Clic en **"Publicar"**
3. Confirmar cambios

---

## ✅ PASO 4: VERIFICACIÓN (5 minutos)

### 4.1 Prueba Básica

1. Abrir navegador en modo incógnito
2. Ir a: `https://www.casaempaques.com/almuerzo/login.html`
3. Iniciar sesión con usuario de prueba
4. Verificar que se vean las 4 opciones de registro:
   - ✅ Registro Diario
   - ✅ Semana Completa
   - ✅ Mes Completo
   - ✅ Personalizado

### 4.2 Prueba de Funcionalidad

#### Test 1: Registro Diario
1. Seleccionar "Registro Diario"
2. Clic en "Guardar Preferencia"
3. Debe aparecer botón "Registrar Asistencia"
4. Registrar y verificar

#### Test 2: Semana Completa
1. Seleccionar "Semana Completa"
2. Guardar preferencia
3. Debe aparecer calendario semanal
4. Verificar días de la semana

#### Test 3: Mes Completo
1. Seleccionar "Mes Completo"
2. Guardar preferencia
3. Debe aparecer calendario mensual
4. Verificar que se pueden seleccionar días

#### Test 4: Personalizado
1. Seleccionar "Personalizado"
2. Debe aparecer selector de días
3. Seleccionar algunos días
4. Guardar y verificar

### 4.3 Verificar Consola

**Abrir consola del navegador (F12):**
- ❌ No debe haber errores rojos
- ⚠️ Ignorar warnings menores
- ✅ Debe mostrar conexión a Firebase

### 4.4 Verificar Base de Datos

**En Firebase Console → Realtime Database:**

```
empaques-multiples-almuerzo/
├── asistencias/
│   └── (registros existentes)
├── preferencias/          ← NUEVO - debe aparecer
│   └── {userId}/
│       ├── tipo: "semanal"
│       ├── diasSeleccionados: []
│       └── fechaActualizacion: "2025-01-29..."
├── roles/
├── perfiles/
└── menuSemanal/
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema 1: "No se ve la nueva interfaz"

**Solución:**
```bash
# Limpiar caché del navegador
Ctrl + Shift + Delete (Chrome)
Cmd + Shift + Delete (Mac)

# O forzar recarga
Ctrl + F5 (Windows)
Cmd + Shift + R (Mac)
```

### Problema 2: "Error de permisos en Firebase"

**Solución:**
1. Verificar que las reglas se publicaron correctamente
2. Esperar 30 segundos para propagación
3. Cerrar sesión y volver a entrar

### Problema 3: "No aparece usuario-main.js"

**Solución:**
1. Verificar que el archivo existe en `/js/`
2. Verificar permisos: `chmod 644 js/usuario-main.js`
3. Verificar que `usuario.html` lo incluye:
```html
<script src="js/usuario-main.js"></script>
```

### Problema 4: "Calendario no se renderiza"

**Solución:**
1. Verificar consola del navegador
2. Asegurar que `database.js` tiene las funciones nuevas
3. Verificar conexión a Firebase

---

## 📊 MONITOREO POST-INSTALACIÓN

### Primeras 24 horas

**Revisar:**
- [ ] Logs de Firebase (Authentication)
- [ ] Logs de Firebase (Database)
- [ ] Logs del servidor web
- [ ] Feedback de usuarios

### Métricas a Vigilar

```
- Tasa de registro exitoso
- Errores en consola
- Tiempo de carga de página
- Preferencias guardadas
```

---

## 📧 COMUNICACIÓN A USUARIOS

### Email Sugerido

**Asunto:** Nueva funcionalidad en el Sistema de Almuerzo 🍽️

```
Estimado equipo,

Nos complace informar que hemos actualizado el Sistema de 
Registro de Almuerzo con nuevas funcionalidades:

✨ NOVEDADES:

1. Registro Semanal Automático
   - Regístrate una vez para toda la semana

2. Calendario Mensual
   - Selecciona todos los días del mes de una vez

3. Configuración Personalizada
   - Elige solo los días que almuerzas

4. Registro Diario (como antes)
   - Control total día a día

📱 Acceso:
https://www.casaempaques.com/almuerzo/login.html

📞 Soporte:
soporte.it@casaempaques.com

¡Esperamos que disfruten estas mejoras!

Saludos,
Equipo de IT
```

---

## ✅ CHECKLIST FINAL

Marcar cuando esté completo:

- [ ] Backup realizado
- [ ] Archivos subidos al servidor
- [ ] Reglas de Firebase actualizadas
- [ ] Pruebas básicas exitosas
- [ ] Sin errores en consola
- [ ] Base de datos verificada
- [ ] Monitoreo configurado
- [ ] Usuarios notificados
- [ ] Documentación archivada

---

## 🎉 ¡INSTALACIÓN COMPLETA!

El sistema está ahora actualizado a la versión 2.0 con todas las nuevas funcionalidades.

### Próximos Pasos

1. **Semana 1:** Monitoreo intensivo
2. **Semana 2:** Recolectar feedback
3. **Semana 3:** Ajustes según necesidad
4. **Mes 1:** Evaluación completa

---

## 📞 CONTACTO DE EMERGENCIA

**Si algo falla:**

1. **Restaurar Backup:**
```bash
cp -r /backup/almuerzo-YYYYMMDD/* /var/www/html/almuerzo/
```

2. **Contactar Soporte:**
- Email: soporte.it@casaempaques.com
- Teléfono: Extensión IT
- Urgente: [Número de emergencia]

---

**Versión:** 2.0.0  
**Fecha de Instalación:** _______________  
**Instalado por:** _______________  
**Verificado por:** _______________

---

**© 2025 Empaques Múltiples SRL**
