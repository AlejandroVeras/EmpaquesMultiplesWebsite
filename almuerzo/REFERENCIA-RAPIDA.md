# Referencia Rápida - Sistema de Registro Semanal

## 🚀 Inicio Rápido

### Para Usuarios:
1. Inicia sesión en `almuerzo/usuario.html`
2. Busca la tarjeta "Configurar Registro de Asistencia"
3. Elige una opción:
   - **📅 Diario**: Registrate manualmente cada día (comportamiento actual)
   - **📅 Automático**: Registrate automáticamente lunes a viernes
   - **🖐️ Personalizado**: Elige días específicos
4. Si es personalizado, selecciona los días
5. Haz clic en "Guardar Preferencia"

### Para Administradores:
1. Inicia sesión en `almuerzo/admin.html`
2. Busca la sección "Preferencias de Registro de Usuarios"
3. Ve las estadísticas de cuántos usuarios tienen cada tipo
4. Busca usuarios específicos si lo necesitas
5. Haz clic en "Actualizar" para refrescar la lista

## 📂 Archivos Cambiados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `js/database.js` | +110 líneas (5 funciones nuevas) | 1-250+ |
| `usuario.html` | +150 líneas (config de registro) | 47-100, 250-300+ |
| `admin.html` | +100 líneas (panel de preferencias) | 330-380, 1150-1230 |
| `css/almuerzo.css` | +50 líneas (estilos nuevos) | 348-400 |

## 🔧 Funciones Nuevas

### database.js
```javascript
guardarPreferenciaRegistro(userId, tipo, diasSeleccionados)
obtenerPreferenciaRegistro(userId)
debeRegistrarseHoy(userId, preferencia)
registrarAsistenciaAutomatica(userId, nombre, email)
obtenerDescripcionPreferencia(preferencia)
```

### usuario.html
```javascript
configurarOpcionesRegistro()
cargarPreferenciaRegistro()
guardarPreferenciaRegistro()
verificarRegistroHoy()
filtrarPreferencias()  // admin solo
```

### admin.html
```javascript
cargarPreferenciasRegistro()
mostrarPreferencias(preferencias)
filtrarPreferencias()
```

## 🎨 Elementos HTML Nuevos

### En usuario.html (NUEVO):
```html
<!-- Tarjeta de configuración -->
<div class="card">
  <div class="card-header">⚙️ Configurar Registro de Asistencia</div>
  <div class="card-body">
    <!-- 3 opciones de registro -->
    <!-- Grid de días (para personalizado) -->
    <!-- Botón guardar -->
  </div>
</div>

<!-- Tarjeta de registro (renombrada) -->
<div class="card" id="tarjetaRegistroDiario">
  <!-- Contenido anterior -->
</div>
```

### En admin.html (NUEVO):
```html
<!-- Tarjeta de preferencias -->
<div class="card">
  <div class="card-header">⏰ Preferencias de Registro</div>
  <div class="card-body">
    <!-- Estadísticas -->
    <!-- Tabla de preferencias -->
    <!-- Buscador -->
  </div>
</div>
```

## 🗄️ Estructura de Base de Datos

```json
{
  "preferenciasRegistro": {
    "uid_usuario": {
      "tipo": "semanal",           // "diario", "semanal", "personalizado"
      "diasSeleccionados": [],     // Solo si es personalizado
      "fechaCreacion": 1234567890,
      "activo": true
    }
  }
}
```

## 📋 Tipos de Registro

| Tipo | Descripción | Uso | diasSeleccionados |
|------|-------------|-----|-------------------|
| **diario** | Manual cada día | Usuarios variables | [] (vacío) |
| **semanal** | Automático L-V | Usuarios regulares | [] (vacío) |
| **personalizado** | Días específicos | Horarios particulares | ["lunes", "martes", ...] |

## 🎯 Casos de Uso

### Caso 1: Usuario que asiste irregularmente
→ Selecciona "Registro Manual Diario"
→ Usa el botón tradicional cuando vaya

### Caso 2: Usuario que asiste siempre L-V
→ Selecciona "Registro Automático Semanal"
→ Se registra automáticamente sin hacer nada

### Caso 3: Usuario que asiste lunes, miércoles y viernes
→ Selecciona "Registro Personalizado"
→ Elige: Lunes, Miércoles, Viernes
→ Se registra automáticamente solo esos días

## ⚙️ Configuración de Firebase

### Reglas necesarias:
```json
{
  "preferenciasRegistro": {
    ".read": "auth != null",
    ".write": "auth != null",
    "$userId": {
      ".write": "auth.uid == $userId || admin"
    }
  }
}
```

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| No veo la tarjeta de config | Verifica que usuario.html esté actualizado |
| Error "function not defined" | Verifica que database.js esté cargado |
| No se guardan preferencias | Revisa reglas de Firebase |
| Admin no ve preferencias | Verifica que admin.html esté actualizado |
| Estilos rotos | Verifica que almuerzo.css esté actualizado |

## 📊 Estadísticas del Panel Admin

Muestra el conteo de usuarios por tipo:
- **Diario**: Usuarios con registro manual
- **Semanal**: Usuarios con registro automático
- **Personalizado**: Usuarios con días específicos

## 🔔 Validaciones

✅ Se valida que:
- Al menos 1 día seleccionado en personalizado
- Tipo de registro válido
- Usuario autenticado antes de guardar
- No permite duplicados en un mismo día

## 📱 Compatibilidad

✅ **Desktop**: Grid completo, tabla con scroll
✅ **Tablet**: Interfaz adaptable
✅ **Mobile**: Stack vertical, tabla scrollable, días en 2 col.

## 🔐 Seguridad

✅ Cada usuario solo ve/modifica su propia preferencia
✅ Admin puede ver todas las preferencias
✅ Validación en cliente y servidor (Firebase rules)
✅ Autenticación requerida

## 🎓 Ejemplo de Código

### Guardar preferencia:
```javascript
guardarPreferenciaRegistro(currentUser.uid, 'personalizado', ['lunes', 'miércoles', 'viernes']);
```

### Obtener preferencia:
```javascript
obtenerPreferenciaRegistro(currentUser.uid).then(pref => {
  console.log(pref); 
  // {tipo: "semanal", diasSeleccionados: [], ...}
});
```

### Verificar si debe registrarse:
```javascript
debeRegistrarseHoy(userId, preferencia);
// Retorna true/false
```

## 📞 Contacto

Para reportar bugs o sugerencias:
1. Revisa REGISTRO-SEMANAL.md
2. Revisa INSTALACION-REGISTRO-SEMANAL.md
3. Abre consola del navegador (F12) para más detalles
