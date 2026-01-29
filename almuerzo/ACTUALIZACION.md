# 🔄 ACTUALIZACIÓN DEL SISTEMA DE ALMUERZO v2.0
## Nuevas Funcionalidades de Registro Múltiple

---

## 📋 RESUMEN DE LA ACTUALIZACIÓN

Se ha actualizado el sistema de registro de asistencia al almuerzo para permitir a los usuarios **registrarse de manera más flexible y conveniente**:

### ✨ Nuevas Opciones de Registro

1. **📅 Registro Diario** (Manual) - Como antes
2. **📆 Registro Semanal** (Automático) - **NUEVO**
3. **🗓️ Registro Mensual** (Selección de días) - **NUEVO**
4. **⚙️ Registro Personalizado** (Días específicos) - **NUEVO**

---

## 🎯 FUNCIONALIDADES NUEVAS

### 1️⃣ Registro Diario (Modo Clásico)
- **Descripción:** El usuario registra su asistencia manualmente cada día
- **Ventaja:** Control total sobre cada día
- **Uso:** Ideal para usuarios con horarios variables

### 2️⃣ Registro Semanal Automático
- **Descripción:** El sistema registra automáticamente de Lunes a Sábado
- **Ventaja:** No necesita registrarse cada día
- **Uso:** Ideal para usuarios que siempre almuerzan en la empresa
- **Características:**
  - Registro automático al iniciar sesión
  - Excluye domingos
  - Respeta días feriados
  - Se puede modificar la semana en curso

### 3️⃣ Registro Mensual con Calendario
- **Descripción:** Vista de calendario completo del mes
- **Ventaja:** Planificación visual de todo el mes
- **Uso:** Seleccionar múltiples días del mes de una sola vez
- **Características:**
  - Calendario interactivo
  - Días ya registrados se muestran en verde
  - Domingos deshabilitados
  - Selección múltiple con un clic

### 4️⃣ Registro Personalizado
- **Descripción:** Seleccionar días específicos de la semana
- **Ventaja:** Flexible para horarios recurrentes
- **Uso:** Para usuarios que solo almuerzan ciertos días
- **Ejemplo:** Solo Lunes, Miércoles y Viernes
- **Características:**
  - Selección de 1 a 6 días de la semana
  - Registro automático en los días seleccionados
  - Se repite semanalmente

---

## 🔧 ARCHIVOS ACTUALIZADOS

### 1. `database.js` - Nuevas Funciones

```javascript
// Funciones añadidas:
- registrarAsistenciaMultiple()      // Registrar varios días a la vez
- obtenerDiasLaboralesSemana()       // Obtener días laborales de la semana
- obtenerDiasLaboralesMes()          // Obtener días laborales del mes
- verificarDiasRegistrados()         // Verificar qué días ya están registrados
- obtenerDiasRegistradosEstaSemana() // Días registrados en semana actual
- guardarPreferenciaRegistro()       // Guardar preferencia del usuario
- obtenerPreferenciaRegistro()       // Obtener preferencia del usuario
- obtenerDescripcionPreferencia()    // Descripción legible de preferencia
- esUnDiaFeriado()                   // Verificar si es día feriado
- registrarAsistenciaAutomatica()    // Registro automático según preferencia
```

### 2. `usuario.html` - Nueva Interfaz

**Componentes añadidos:**
- ✅ Tarjetas de selección de modo de registro
- ✅ Selector de días personalizados
- ✅ Calendario semanal interactivo
- ✅ Calendario mensual con grid
- ✅ Indicadores visuales de estado
- ✅ Badges informativos

**Estilos CSS añadidos:**
- Tarjetas de opción con efecto hover
- Selectores de días con estados (normal, seleccionado, registrado, deshabilitado)
- Grid de calendario responsive
- Animaciones y transiciones

### 3. `usuario-main.js` - Nueva Lógica

**Funciones principales:**
- `configurarOpcionesRegistro()` - Configura los 4 modos de registro
- `renderizarDiasSemana()` - Muestra los días de la semana actual
- `renderizarCalendarioMes()` - Genera calendario mensual
- `guardarMiPreferenciaRegistro()` - Guarda la preferencia seleccionada
- `cargarPreferenciaRegistro()` - Carga preferencia guardada
- `ejecutarRegistroAutomatico()` - Ejecuta registro automático al cargar
- `registrarSeleccionSemanal()` - Procesa registro de semana
- `registrarSeleccionMensual()` - Procesa registro mensual

---

## 📊 ESTRUCTURA DE DATOS EN FIREBASE

### Nueva Colección: `preferencias/{userId}`

```json
{
  "tipo": "semanal",              // "diario", "semanal", "mensual", "personalizado"
  "diasSeleccionados": [],        // Array de días (solo para personalizado)
  "fechaActualizacion": "2025-01-29T10:30:00Z"
}
```

### Actualización en `asistencias/{id}`

```json
{
  "userId": "abc123",
  "nombre": "Juan Pérez",
  "email": "juan@empaques.local",
  "fecha": "2025-01-29",
  "hora": "12:45:30",
  "timestamp": 1706534730000,
  "tipoRegistro": "multiple"      // NUEVO: "multiple" o undefined (manual)
}
```

---

## 🔒 REGLAS DE SEGURIDAD FIREBASE (ACTUALIZAR)

Agregar a `firebase-rules.json`:

```json
{
  "rules": {
    "preferencias": {
      "$uid": {
        ".read": "auth != null && $uid === auth.uid",
        ".write": "auth != null && $uid === auth.uid"
      }
    }
  }
}
```

---

## 🎨 INTERFAZ DE USUARIO

### Página de Usuario - Nueva Sección

```
┌─────────────────────────────────────────────────────┐
│  Configuración de Registro                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │ 📅 Diario│ │📆 Semanal│ │🗓️ Mensual│ │⚙️ Perso││
│  │  Manual  │ │Automático│ │ Selección│ │nalizado││
│  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                     │
│         [Guardar Preferencia]                      │
└─────────────────────────────────────────────────────┘
```

### Calendario Semanal (Modo Semanal)

```
┌───────────────────────────────────────┐
│  Lunes      Martes    Miércoles       │
│  29 ene     30 ene    31 ene         │
│  [ ✓ ]      [ ✓ ]     [   ]          │
│                                       │
│  Jueves     Viernes   Sábado         │
│  01 feb     02 feb    03 feb         │
│  [ ✓ ]      [   ]     [   ]          │
│                                       │
│      [Registrar Semana]              │
└───────────────────────────────────────┘
```

### Calendario Mensual (Modo Mensual)

```
┌──────────────────────────────────────┐
│  Dom Lun Mar Mié Jue Vie Sáb        │
│   -   1   2   3   4   5   6         │
│   -   8   9  10  11  12  13         │
│   -  15  ✓✓  17  18  19  20         │
│   -  22  23  24  25  26  27         │
│   -  29  30  31                     │
│                                     │
│  ✓ = Ya registrado                  │
│  Clic para seleccionar              │
│                                     │
│  [Registrar Días Seleccionados]     │
└──────────────────────────────────────┘
```

---

## 🚀 FLUJO DE USO

### Flujo 1: Usuario Configura Registro Semanal

1. Usuario inicia sesión
2. Ve opciones de configuración
3. Selecciona "Semana Completa"
4. Clic en "Guardar Preferencia"
5. Sistema registra automáticamente Lun-Sáb de esa semana
6. Cada nueva semana se auto-registra al iniciar sesión

### Flujo 2: Usuario Selecciona Días del Mes

1. Usuario selecciona "Mes Completo"
2. Ve calendario del mes
3. Hace clic en días que va a almorzar
4. Días seleccionados se marcan en azul
5. Clic en "Registrar Días Seleccionados"
6. Confirmación de registro exitoso

### Flujo 3: Usuario con Días Personalizados

1. Usuario selecciona "Personalizado"
2. Aparecen 6 tarjetas (Lun-Sáb)
3. Selecciona: Lunes, Miércoles, Viernes
4. Guarda preferencia
5. Sistema auto-registra solo esos días cada semana

---

## ⚙️ CONFIGURACIÓN TÉCNICA

### Días Feriados

Los días feriados están configurados en `database.js`:

```javascript
const feriados2025 = [
    '2025-01-01', // Año Nuevo
    '2025-01-06', // Día de Reyes
    '2025-01-21', // Virgen de la Altagracia
    // ... más feriados
];
```

**Para agregar más feriados:**
1. Abrir `database.js`
2. Buscar función `esUnDiaFeriado()`
3. Agregar fecha en formato `'YYYY-MM-DD'`

### Excluir Domingos

Los domingos están automáticamente excluidos en:
- Calendario semanal
- Calendario mensual
- Registro automático

---

## 📱 RESPONSIVE DESIGN

### Desktop (> 768px)
- 4 tarjetas de opción en fila
- Calendario con vista completa
- Selectores grandes

### Tablet (576px - 768px)
- 2 tarjetas por fila
- Calendario scrollable
- Selectores medianos

### Mobile (< 576px)
- 1 tarjeta por fila
- Calendario compacto
- Selectores adaptables

---

## 🔄 MIGRACIÓN Y COMPATIBILIDAD

### ¿Afecta a usuarios existentes?

**NO**. El sistema es completamente compatible hacia atrás:

1. Usuarios sin preferencia configurada → Modo manual por defecto
2. Registros antiguos → Siguen visibles en historial
3. No se requiere re-configuración

### Migración de Datos

**No se requiere migración**. Los datos existentes funcionan sin cambios.

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: No se registran días automáticamente

**Solución:**
1. Verificar preferencia guardada
2. Revisar que no sea domingo o feriado
3. Verificar reglas de Firebase
4. Revisar consola del navegador

### Problema: Calendario no muestra días registrados

**Solución:**
1. Refrescar página
2. Verificar conexión a Firebase
3. Revisar permisos de lectura

### Problema: No se puede seleccionar un día en calendario

**Solución:**
1. Verificar que no sea domingo
2. Verificar que no sea día pasado
3. Verificar que no esté ya registrado

---

## 📈 VENTAJAS DE LA ACTUALIZACIÓN

### Para Usuarios
✅ Menos clics diarios
✅ No olvidar registrarse
✅ Planificación anticipada
✅ Vista clara del mes
✅ Flexibilidad de horarios

### Para Administradores
✅ Mejor tasa de registro
✅ Datos más completos
✅ Planificación de recursos
✅ Estadísticas más precisas

### Para la Empresa
✅ Mejor control de almuerzos
✅ Reducción de desperdicio
✅ Datos para toma de decisiones
✅ Mejora la experiencia del empleado

---

## 🎓 CAPACITACIÓN RECOMENDADA

### Para Usuarios

**Sesión de 15 minutos cubriendo:**
1. Acceso al sistema
2. Explicación de 4 modos
3. Demostración de calendario
4. Cómo cambiar preferencia
5. Preguntas y respuestas

### Materiales Sugeridos
- Video tutorial de 5 minutos
- Infografía con los 4 modos
- FAQ (Preguntas frecuentes)
- Soporte por email/chat

---

## 📞 SOPORTE POST-ACTUALIZACIÓN

### Canal de Soporte
**Email:** soporte.it@casaempaques.com  
**Teléfono:** Extensión IT  
**Chat:** Sistema interno

### Horario de Soporte
**Lunes a Viernes:** 8:00 AM - 5:00 PM  
**Respuesta:** Dentro de 24 horas

---

## 🔮 FUTURAS MEJORAS SUGERIDAS

### Fase 3 (Futuro)
- [ ] Notificaciones por email
- [ ] App móvil nativa
- [ ] Integración con calendario corporativo
- [ ] Estadísticas personales
- [ ] Recordatorios automáticos
- [ ] Exportar mi historial a PDF
- [ ] Registro por QR code

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Pre-Implementación
- [ ] Backup completo de Firebase
- [ ] Pruebas en entorno de desarrollo
- [ ] Revisión de reglas de seguridad
- [ ] Preparar material de capacitación

### Implementación
- [ ] Subir archivos actualizados
- [ ] Actualizar reglas Firebase
- [ ] Verificar funcionamiento
- [ ] Monitorear errores

### Post-Implementación
- [ ] Comunicar a usuarios
- [ ] Realizar capacitación
- [ ] Recolectar feedback
- [ ] Ajustes según necesidad

---

## 📄 ARCHIVOS PARA DESCARGAR

### Archivos Nuevos/Actualizados:
1. ✅ `database.js` - Versión actualizada
2. ✅ `usuario.html` - Nueva interfaz
3. ✅ `usuario-main.js` - Nueva lógica
4. ✅ `firebase-rules.json` - Reglas actualizadas
5. ✅ `ACTUALIZACION.md` - Este documento

### Instalación:
```bash
# Reemplazar archivos en el servidor:
/almuerzo/js/database.js
/almuerzo/usuario.html
/almuerzo/js/usuario-main.js

# Actualizar reglas en Firebase Console
# Copiar contenido de firebase-rules.json
```

---

## 🎉 CONCLUSIÓN

Esta actualización transforma el sistema de almuerzo en una herramienta más **flexible, conveniente y poderosa**, permitiendo a los usuarios gestionar su asistencia de la manera que mejor se adapte a sus necesidades.

**Versión:** 2.0.0  
**Fecha:** Enero 2025  
**Estado:** ✅ Listo para producción

---

**© 2025 Empaques Múltiples SRL**  
Sistema de Registro de Asistencia al Almuerzo
