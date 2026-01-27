# Sistema de Gestión de Días Feriados

## 📝 Descripción

Se ha implementado un **sistema de gestión de días feriados** que permite excluir automáticamente los días festivos del registro automático de asistencia al almuerzo.

**Problema que soluciona:**
- Los empleados no se registran automáticamente en días feriados (festivos)
- El registro manual aún está disponible si es necesario
- Evita contar asistencias en días que no hay laborales

## ✨ Características Implementadas

### 1. **Panel de Administración - Gestión de Feriados**
Los administradores pueden:
- ✅ Agregar nuevos días feriados
- ✅ Ver lista completa de feriados configurados
- ✅ Eliminar feriados
- ✅ Ver en qué día de la semana cae cada feriado
- ✅ Actualizar la lista en tiempo real

### 2. **Validación Automática**
El sistema:
- ✅ Detecta si hoy es un día feriado
- ✅ Omite registro automático en feriados
- ✅ Permite registro manual si el empleado lo requiere
- ✅ No afecta registro manual diario

### 3. **Interfaz Intuitiva**
- Formulario simple con fecha y nombre
- Tabla con todos los feriados
- Botón de eliminar con confirmación
- Mensajes de éxito/error

## 🛠️ Archivos Modificados

### 1. **almuerzo/js/database.js** (+60 líneas)

Nuevas funciones agregadas:

```javascript
// Obtener todos los feriados
obtenerDiasFeriados()

// Agregar un feriado
agregarDiaFeriado(fecha, nombre)

// Eliminar un feriado
eliminarDiaFeriado(fecha)

// Verificar si una fecha es feriado
esUnDiaFeriado(fecha)

// Obtener nombre del feriado
obtenerNombreFeriado(fecha)

// Nueva función que valida feriados
debeRegistrarseHoyConFeriados(userId, preferencia)
```

### 2. **almuerzo/admin.html** (+150 líneas)

**Interfaz agregada:**
- Nueva tarjeta "Gestión de Días Feriados"
- Formulario de entrada (fecha + nombre)
- Tabla de feriados configurados
- Botón de actualizar
- Botones de eliminar

**Funciones JavaScript agregadas:**
```javascript
cargarDiasFeriados()
mostrarDiasFeriados(feriados)
agregarFeriado()
eliminarFeriado(fecha)
```

## 📊 Estructura de Base de Datos

Se crea automáticamente la siguiente estructura en Firebase:

```json
{
  "diasFeriados": {
    "2026-01-01": {
      "nombre": "Año Nuevo",
      "fechaCreacion": 1234567890
    },
    "2026-07-20": {
      "nombre": "Independencia Nacional",
      "fechaCreacion": 1234567890
    },
    "2026-12-25": {
      "nombre": "Navidad",
      "fechaCreacion": 1234567890
    }
  }
}
```

## 🔐 Reglas de Firebase

Asegúrate de tener estas reglas:

```json
{
  "rules": {
    "diasFeriados": {
      ".read": "auth != null",
      ".write": "root.child('roles').child(auth.uid).val() === 'admin'"
    }
  }
}
```

**O simplemente:**

```json
{
  "rules": {
    "diasFeriados": {
      ".read": "auth != null"
    }
  }
}
```

## 🚀 Cómo Usar

### Para Administrador:

1. **Accede al panel de admin** (`almuerzo/admin.html`)
2. **Busca la sección "Gestión de Días Feriados"**
3. **Ingresa la fecha** en formato YYYY-MM-DD
4. **Ingresa el nombre del feriado** (Ej: "Año Nuevo", "Navidad")
5. **Haz clic en "Agregar Feriado"**
6. **Verifica que aparezca en la tabla**

### Para Empleados:

- **En días feriados**: NO se registra automáticamente aunque tenga configurado registro automático
- **Pueden registrarse manualmente** si lo desean
- **En días normales**: Funciona normalmente el registro automático

## 📋 Ejemplo Práctico

**Escenario:**
- Juan tiene configurado "Registro Automático Semanal" (L-V)
- El 1 de enero (Año Nuevo) es feriado
- El 1 de enero cae en viernes

**Comportamiento anterior:**
- Juan se registra automáticamente aunque sea feriado ❌

**Comportamiento ahora:**
- Juan NO se registra porque es feriado ✅
- Si Juan viene a laborar, puede registrarse manualmente ✅

## ⚙️ Validación y Lógica

La función `debeRegistrarseHoyConFeriados()` verifica:

1. ¿Tiene configurado registro automático? (semanal o personalizado)
2. ¿Es hoy un día que debe registrarse según su configuración?
3. ¿Es hoy un día feriado? → Si es feriado, NO se registra

```javascript
// Ejemplo de flujo:
// Usuario: Registro semanal
// Hoy: viernes 1 de enero 2026 (Año Nuevo - FERIADO)
// Resultado: NO se registra ✓
```

## 🎯 Casos de Uso

| Situación | Resultado |
|-----------|-----------|
| Empleado con registro automático + Día laborable | ✅ Se registra |
| Empleado con registro automático + Día feriado | ❌ No se registra |
| Empleado con registro manual + Día feriado | ✅ Puede registrarse manualmente |
| Empleado con registro personalizado + No es su día | ❌ No se registra |
| Empleado con registro personalizado + Su día pero es feriado | ❌ No se registra |

## 🔄 Próximas Mejoras (Opcionales)

1. **Excepciones Personales**
   - Permitir que usuarios marquen vacaciones
   - Incapacidades personales
   - Licencias

2. **Integración de Días Feriados**
   - Sincronizar con calendario de Colombia
   - Cargar automáticamente feriados del año

3. **Reportes**
   - Mostrar asistencias por tipo de día (feriado vs laborable)
   - Análisis de patrones de asistencia

4. **Notificaciones**
   - Alertar cuando hay cambios en feriados
   - Confirmar registro automático

## 📝 Notas Importantes

1. **Formato de Fecha**: YYYY-MM-DD (Ej: 2026-01-01)
2. **Los feriados son globales**: Se aplican a todos los usuarios
3. **El registro manual no afecta**: Cualquier usuario puede registrarse manualmente en cualquier día
4. **Persistencia**: Los feriados se guardan en Firebase y persisten entre sesiones

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| No puedo agregar feriados | Verifica que seas admin |
| El feriado no aparece en la tabla | Recarga la página o haz clic en "Actualizar" |
| Los feriados no funcionan | Verifica las reglas de Firebase |
| Fecha en formato incorrecto | Usa YYYY-MM-DD (Ej: 2026-12-25) |

## 🔗 Funciones Relacionadas

- `obtenerDiasFeriados()` - Obtiene todos los feriados
- `esUnDiaFeriado(fecha)` - Verifica si una fecha es feriado
- `debeRegistrarseHoyConFeriados()` - Valida si debe registrarse considerando feriados
- `verificarAsistenciaHoy()` - Verifica si ya registró hoy

