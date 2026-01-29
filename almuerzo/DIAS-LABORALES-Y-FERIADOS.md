# 📅 DÍAS LABORALES Y FERIADOS - SISTEMA DE ALMUERZO

## 🗓️ DÍAS LABORALES

### Horario de Trabajo: Lunes a Viernes

El sistema de almuerzo de Empaques Múltiples está configurado para trabajar **únicamente de Lunes a Viernes**, reflejando el horario laboral real de la empresa.

#### ✅ Días Incluidos
- **Lunes** ✓
- **Martes** ✓
- **Miércoles** ✓
- **Jueves** ✓
- **Viernes** ✓

#### ❌ Días Excluidos
- **Sábado** ✗ (No laboral)
- **Domingo** ✗ (No laboral)

---

## 🎉 DÍAS FERIADOS OFICIALES

### República Dominicana - Feriados 2025

El sistema **automáticamente excluye** los siguientes días feriados oficiales:

| Fecha | Feriado |
|-------|---------|
| 01/01/2025 | Año Nuevo |
| 06/01/2025 | Día de los Santos Reyes (Epifanía) |
| 21/01/2025 | Día de Nuestra Señora de la Altagracia |
| 26/01/2025 | Día de Duarte |
| 27/02/2025 | Día de la Independencia Nacional |
| 18/04/2025 | Viernes Santo |
| 01/05/2025 | Día del Trabajo |
| 19/06/2025 | Corpus Christi |
| 16/08/2025 | Día de la Restauración |
| 24/09/2025 | Día de Nuestra Señora de las Mercedes |
| 06/11/2025 | Día de la Constitución |
| 25/12/2025 | Navidad |

### República Dominicana - Feriados 2026 (Pre-cargados)

| Fecha | Feriado |
|-------|---------|
| 01/01/2026 | Año Nuevo |
| 06/01/2026 | Día de los Santos Reyes |
| 21/01/2026 | Día de Nuestra Señora de la Altagracia |
| 26/01/2026 | Día de Duarte |
| 27/02/2026 | Día de la Independencia Nacional |
| 03/04/2026 | Viernes Santo |
| 01/05/2026 | Día del Trabajo |
| 04/06/2026 | Corpus Christi |
| 16/08/2026 | Día de la Restauración |
| 24/09/2026 | Día de Nuestra Señora de las Mercedes |
| 06/11/2026 | Día de la Constitución |
| 25/12/2026 | Navidad |

---

## ⚙️ FUNCIONAMIENTO AUTOMÁTICO

### 🔹 Registro Semanal

Cuando un usuario selecciona **"Semana Completa"**:

1. ✅ El sistema registra **solo de Lunes a Viernes**
2. ❌ **Excluye automáticamente sábados y domingos**
3. ⚠️ **Verifica feriados** y NO registra en esos días
4. 📊 **Muestra mensaje** indicando días excluidos

**Ejemplo:**
```
Semana del 21-25 de Enero 2025:
- Lunes 20/01    → ✅ Registrado
- Martes 21/01   → ❌ Feriado (Altagracia) - Excluido
- Miércoles 22/01 → ✅ Registrado
- Jueves 23/01   → ✅ Registrado
- Viernes 24/01  → ✅ Registrado

Resultado: "3 días registrados (1 feriado excluido)"
```

### 🔹 Registro Mensual

Cuando un usuario selecciona **"Mes Completo"**:

1. 📅 **Calendario visual** muestra todo el mes
2. 🔴 **Domingos** marcados en rojo (no seleccionables)
3. 🟡 **Sábados** marcados en amarillo (no seleccionables)
4. 🟠 **Feriados** marcados en naranja (no seleccionables)
5. ✅ **Solo días laborales** son seleccionables
6. ⚠️ **Filtrado automático** al registrar

**Ejemplo Visual:**
```
Enero 2025:
Dom Lun Mar Mié Jue Vie Sáb
 -   -   -  🟢  🟢  🟢  🟡
🔴  🟠  🟢  🟢  🟢  🟢  🟡
🔴  🟠  🟢  🟢  🟢  🟢  🟡
🔴  🟢  🟢  🟢  🟢  🟢  🟡

🔴 = Domingo (cerrado)
🟡 = Sábado (cerrado)
🟠 = Feriado (cerrado)
🟢 = Día laboral (seleccionable)
```

### 🔹 Registro Personalizado

Cuando un usuario selecciona **"Personalizado"**:

1. 📋 **Solo muestra Lun-Vie** para seleccionar
2. ✅ Usuario elige días específicos
3. 🔄 **Se repite semanalmente**
4. ⚠️ **Respeta feriados** en los días seleccionados

**Ejemplo:**
```
Usuario selecciona: Lunes, Miércoles, Viernes

Semana normal:
- Lunes   → ✅ Registrado
- Martes  → ❌ No seleccionado
- Miércoles → ✅ Registrado
- Jueves  → ❌ No seleccionado
- Viernes → ✅ Registrado

Semana con feriado (Viernes Santo):
- Lunes   → ✅ Registrado
- Martes  → ❌ No seleccionado
- Miércoles → ✅ Registrado
- Jueves  → ❌ No seleccionado
- Viernes → ⚠️ Feriado - No registrado

Resultado: "2 días registrados (1 feriado excluido)"
```

---

## 💡 BENEFICIOS

### Para Empleados
✅ **No pierden almuerzos:** Los feriados no cuentan contra ellos
✅ **Transparencia:** Ven claramente qué días son feriados
✅ **Flexibilidad:** Pueden ajustar según necesidad

### Para Administración
✅ **Datos precisos:** Solo días laborales efectivos
✅ **Control de costos:** No se cuentan días no trabajados
✅ **Planificación:** Saber exactamente cuántos almuerzos preparar

### Para la Empresa
✅ **Ahorro:** No se desperdicia comida en días cerrados
✅ **Eficiencia:** Automatización reduce errores manuales
✅ **Cumplimiento:** Respeta calendario oficial

---

## 🔧 ACTUALIZACIÓN DE FERIADOS

### ¿Cómo agregar nuevos feriados?

Los feriados están definidos en el archivo `database.js`. Para agregar más:

1. **Abrir archivo:** `almuerzo/js/database.js`

2. **Buscar función:** `esUnDiaFeriado()`

3. **Agregar fecha:** En el array `feriados2025`

```javascript
const feriados2025 = [
    '2025-01-01', // Año Nuevo
    '2025-01-06', // Día de Reyes
    // ... más feriados ...
    '2025-12-25', // Navidad
    
    // AGREGAR NUEVOS FERIADOS AQUÍ
    '2025-XX-XX', // Nuevo Feriado
];
```

4. **Formato:** `'YYYY-MM-DD'` (con comillas y guiones)

5. **Guardar y actualizar** el archivo en el servidor

### Feriados Móviles

Algunos feriados cambian de fecha cada año (ej: Viernes Santo, Corpus Christi). Estos deben ser actualizados manualmente cada año:

**Viernes Santo:**
- 2025: 18/04/2025
- 2026: 03/04/2026
- 2027: 26/03/2027 (agregar cuando llegue)

**Corpus Christi:**
- 2025: 19/06/2025
- 2026: 04/06/2026
- 2027: 27/05/2027 (agregar cuando llegue)

---

## 📊 VISUALIZACIÓN EN EL SISTEMA

### Calendario Semanal

```
┌─────────────────────────────────────────┐
│  Lunes    Martes   Miércoles  Jueves  Viernes │
│  20 ene   21 ene   22 ene    23 ene  24 ene  │
│  ✓        ⚠️       ✓         ✓       ✓       │
│           FERIADO                             │
└─────────────────────────────────────────┘
```

### Calendario Mensual

```
┌───────────────────────────────────────────┐
│  Dom  Lun  Mar  Mié  Jue  Vie  Sáb       │
├───────────────────────────────────────────┤
│  🔴   🟠   ✅   ✅   ✅   ✅   🟡        │
│  🔴   ✅   ✅   ✅   ✅   ✅   🟡        │
│  🔴   ✅   ✅   ✅   ✅   ✅   🟡        │
└───────────────────────────────────────────┘

Leyenda:
🔴 Domingo (cerrado)
🟡 Sábado (cerrado)
🟠 Feriado (cerrado)
✅ Día laboral
```

---

## ⚠️ CASOS ESPECIALES

### Feriado que cae en fin de semana

Si un feriado oficial cae en **sábado o domingo**, el sistema:
- ✅ Ya está marcado como no laboral (fin de semana)
- ℹ️ No necesita tratamiento especial
- 📋 Puede ser compensado otro día (según política de empresa)

**Ejemplo:**
```
Año Nuevo 2026 cae en Jueves 01/01/2026 → Feriado normal
Si cayera en Sábado → Ya es fin de semana, no afecta
```

### Feriados Trasladados

Algunos feriados se trasladan al lunes siguiente. En República Dominicana:

- Si feriado cae en **martes o miércoles** → Se traslada al **lunes anterior**
- Si feriado cae en **jueves o viernes** → Se traslada al **lunes siguiente**
- Si feriado cae en **sábado o domingo** → Se traslada al **lunes siguiente**

**Importante:** Actualizar el array `feriados2025` con la **fecha trasladada**, no la fecha original.

---

## 📝 MENSAJES DEL SISTEMA

### Mensajes de Confirmación

**Registro sin feriados:**
```
✅ ¡5 días registrados correctamente!
```

**Registro con feriados excluidos:**
```
✅ ¡4 días registrados correctamente!
   (1 día feriado excluido automáticamente)
```

**Todos los días son feriados:**
```
⚠️ Todos los días seleccionados son feriados.
   No se registró ninguna asistencia.
```

---

## 🎯 MEJORES PRÁCTICAS

### Para Usuarios

1. ✅ **Revisar calendario** antes de registrar el mes
2. ✅ **Confiar en el sistema** - excluye feriados automáticamente
3. ✅ **Revisar mensajes** de confirmación para ver días excluidos
4. ⚠️ **No intentar** seleccionar sábados/domingos/feriados

### Para Administradores

1. ✅ **Actualizar feriados** anualmente (especialmente móviles)
2. ✅ **Comunicar feriados nuevos** a los usuarios
3. ✅ **Revisar reportes** considerando días excluidos
4. ✅ **Verificar lista** al inicio de cada año

---

## 📞 SOPORTE

### Preguntas Frecuentes

**P: ¿Por qué no puedo seleccionar el sábado?**  
R: Empaques Múltiples trabaja de Lunes a Viernes. Los sábados no son días laborales.

**P: ¿El sistema sabe de feriados automáticamente?**  
R: Sí, los feriados oficiales de RD están pre-cargados para 2025-2026.

**P: ¿Qué pasa si un feriado cae en mi día seleccionado?**  
R: El sistema lo detecta y NO registra ese día, protegiéndote de errores.

**P: ¿Puedo registrar un feriado manualmente si trabajo ese día?**  
R: No, el sistema lo impide. Contacta a tu supervisor/IT si trabajaste un feriado.

**P: ¿Cómo sé cuántos días fueron excluidos?**  
R: El sistema muestra un mensaje después de registrar: "X días registrados (Y feriados excluidos)"

---

## 🔄 MANTENIMIENTO ANUAL

### Checklist de Inicio de Año

- [ ] Revisar lista de feriados oficiales del nuevo año
- [ ] Actualizar fechas de feriados móviles (Semana Santa, Corpus)
- [ ] Verificar si hay feriados nuevos o cambios
- [ ] Actualizar archivo `database.js`
- [ ] Probar sistema con fechas del nuevo año
- [ ] Comunicar cambios a usuarios
- [ ] Documentar actualizaciones

**Fecha recomendada:** Primera semana de Diciembre (para el año siguiente)

---

## ✅ RESUMEN

| Aspecto | Detalle |
|---------|---------|
| **Días laborales** | Lunes a Viernes únicamente |
| **Fines de semana** | Sábados y Domingos excluidos automáticamente |
| **Feriados 2025** | 12 feriados oficiales pre-cargados |
| **Feriados 2026** | 12 feriados oficiales pre-cargados |
| **Actualización** | Manual, una vez al año |
| **Protección** | Automática - usuarios no pueden registrar días no laborales |
| **Transparencia** | Sistema informa días excluidos en mensajes |

---

**© 2025 Empaques Múltiples SRL**  
Sistema de Registro de Asistencia al Almuerzo v2.0
