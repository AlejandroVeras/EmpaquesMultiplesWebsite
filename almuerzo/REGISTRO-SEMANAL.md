# Sistema de Registro de Asistencia Semanal

## Descripción

Se ha implementado un sistema flexible de registro de asistencia que permite a los usuarios elegir cómo desean registrarse en el almuerzo de la empresa:

1. **Registro Manual Diario**: Registro tradicional donde el usuario debe entrar cada día para registrarse
2. **Registro Automático Semanal**: Registro automático de lunes a viernes (completa la semana sin necesidad de entrar cada día)
3. **Registro Personalizado**: El usuario elige específicamente qué días de la semana asistirá

## Nuevas Características

### Para Usuarios

#### 1. Tarjeta de Configuración de Registro
Los usuarios verán una nueva sección "Configurar Registro de Asistencia" con tres opciones:

**Opción 1: Registro Manual Diario**
- Registro tradicional
- El usuario debe entrar cada día y presionar el botón "Registrar Asistencia"
- Solo puede registrarse una vez por día
- Ideal para usuarios con horarios variables

**Opción 2: Registro Automático Semanal**
- Se registra automáticamente de lunes a viernes
- No necesita entrar al sistema cada día
- Se registra a la hora que el sistema detecta su primer acceso del día
- O puede registrarse manualmente si lo desea
- Ideal para usuarios con asistencia regular

**Opción 3: Registro Personalizado**
- El usuario selecciona específicamente qué días de la semana asistirá
- Puede elegir cualquier combinación de días (lunes a domingo)
- Se registra automáticamente en los días seleccionados
- Perfecto para usuarios con horarios específicos (ej: solo lunes y miércoles)

#### 2. Interfaz de Selección de Días
Cuando se selecciona "Registro Personalizado", aparece un grid con los 7 días de la semana donde el usuario puede:
- Hacer clic en las tarjetas de días para seleccionar/deseleccionar
- Ver un resumen de su configuración actual
- Guardar los cambios

#### 3. Visualización de Preferencia Actual
Bajo el botón de guardar, se muestra:
- La preferencia actual del usuario
- Descripción clara de cómo está configurado su registro

### Para Administrador

#### 1. Nueva Sección "Preferencias de Registro"
En el panel de administración se agregó una nueva tarjeta con:
- Vista de todas las preferencias de registro de los usuarios
- Estadísticas de cuántos usuarios tienen cada tipo de registro
- Tabla detallada con:
  - Usuario y nombre
  - Tipo de registro (Manual/Automático/Personalizado)
  - Detalles (días seleccionados si es personalizado)
  - Fecha de última modificación
- Búsqueda por nombre de usuario
- Botón para actualizar/recargar la lista

#### 2. Estadísticas de Registro
Tres tarjetas mostrando:
- Cantidad de usuarios con registro manual diario
- Cantidad de usuarios con registro automático semanal
- Cantidad de usuarios con registro personalizado

## Estructura de Base de Datos

Se agregó una nueva tabla en Firebase Realtime Database:

```
preferenciasRegistro/
  ├── {userId1}/
  │   ├── tipo: "semanal"
  │   ├── diasSeleccionados: []
  │   ├── fechaCreacion: 1234567890
  │   └── activo: true
  ├── {userId2}/
  │   ├── tipo: "personalizado"
  │   ├── diasSeleccionados: ["lunes", "miércoles", "viernes"]
  │   ├── fechaCreacion: 1234567890
  │   └── activo: true
  └── {userId3}/
      ├── tipo: "diario"
      ├── diasSeleccionados: []
      ├── fechaCreacion: 1234567890
      └── activo: true
```

## Nuevas Funciones JavaScript

### En database.js

```javascript
// Guardar preferencia de registro del usuario
guardarPreferenciaRegistro(userId, tipo, diasSeleccionados)

// Obtener preferencia de registro del usuario
obtenerPreferenciaRegistro(userId)

// Detectar si hoy debe ser registrado automáticamente
debeRegistrarseHoy(userId, preferencia)

// Registrar asistencia automática si está configurado
registrarAsistenciaAutomatica(userId, nombre, email)

// Obtener descripción de la preferencia
obtenerDescripcionPreferencia(preferencia)
```

### En usuario.html

```javascript
// Configurar opciones de registro
configurarOpcionesRegistro()

// Cargar preferencia actual
cargarPreferenciaRegistro()

// Guardar la preferencia
guardarPreferenciaRegistro()

// Verificar si debe registrarse hoy
verificarRegistroHoy()

// Filtrar preferencias (admin)
filtrarPreferencias()
```

### En admin.html

```javascript
// Cargar todas las preferencias
cargarPreferenciasRegistro()

// Mostrar preferencias en tabla
mostrarPreferencias(preferencias)

// Filtrar preferencias por búsqueda
filtrarPreferencias()
```

## Flujo de Uso

### Para Usuarios

1. **Primera vez**:
   - Usuario accede al sistema
   - Ve la tarjeta "Configurar Registro de Asistencia"
   - Selecciona su opción preferida
   - Guarda la configuración

2. **Uso posterior**:
   - Si seleccionó "Diario": Ve el botón de registro tradicional
   - Si seleccionó "Semanal": Se registra automáticamente L-V
   - Si seleccionó "Personalizado": Se registra automáticamente en sus días elegidos

3. **Cambiar preferencia**:
   - Vuelve a la tarjeta de configuración
   - Selecciona otra opción
   - Guarda los cambios

### Para Administrador

1. Accede al panel de administración
2. Ve la nueva sección "Preferencias de Registro"
3. Puede ver estadísticas de cómo se registran los usuarios
4. Puede buscar usuarios específicos para ver su configuración
5. Actualiza la lista con el botón de recargar

## Estilos CSS

Se agregaron nuevas clases CSS para mejorar la presentación:

```css
.option-card           /* Tarjetas de opciones de registro */
.option-card:hover     /* Efecto hover en opciones */
.option-card.selected  /* Opción seleccionada */
.dias-grid            /* Grid de días de la semana */
```

## Reglas de Seguridad Firebase

Se deben actualizar las reglas de seguridad para permitir lectura/escritura en la tabla de preferencias:

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

## Consideraciones Importantes

1. **Registro Automático**: Las funciones de registro automático deben implementarse en:
   - Un Cloud Function que se ejecute diariamente
   - O verificarse al acceso del usuario con `registrarAsistenciaAutomatica()`

2. **Compatibilidad**: El sistema mantiene compatibilidad con:
   - Registro manual tradicional
   - Historial de asistencias existente
   - Panel administrativo existente

3. **Validación**: Se valida que:
   - Al menos un día esté seleccionado en registro personalizado
   - No se registre dos veces en un mismo día
   - Los cambios se guarden correctamente

## Próximas Mejoras Sugeridas

1. Implementar Cloud Functions para registro automático programado
2. Notificaciones cuando se registra automáticamente
3. Estadísticas por usuario sobre tasas de asistencia
4. Informes exportables con análisis de patrones de asistencia
5. Opción de agregar excepciones (ej: días de vacaciones)
