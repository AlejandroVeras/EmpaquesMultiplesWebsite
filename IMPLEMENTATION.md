# Sistema de Registro de Asistencia al Almuerzo
## Documentación de Implementación

---

## 📋 Resumen Ejecutivo

Se ha implementado un **sistema completo de registro de asistencia al almuerzo** para Empaques Múltiples con las siguientes características principales:

### ✅ Características Implementadas

1. **Página Oculta de Acceso**
   - URL: `/almuerzo/login.html`
   - No accesible desde la navegación principal del sitio
   - Solo accesible mediante URL directa

2. **Sistema de Autenticación Dual**
   - Login para usuarios regulares → Dashboard de usuario
   - Login para administrador → Panel administrativo
   - Autenticación mediante Firebase Authentication

3. **Funcionalidades para Usuario Regular**
   - Registro de asistencia al almuerzo (un clic)
   - Restricción: una sola asistencia por día
   - Visualización de historial personal
   - Interfaz limpia e intuitiva

4. **Funcionalidades para Administrador**
   - Vista de todas las asistencias registradas
   - Estadísticas en tiempo real (hoy, mes, total)
   - Filtrado por rango de fechas
   - Búsqueda por nombre o email
   - Exportación a Excel (formato .xlsx)

5. **Base de Datos Firebase**
   - Realtime Database para almacenamiento
   - Reglas de seguridad implementadas
   - Validación de estructura de datos

6. **Diseño Responsive**
   - Adaptable a dispositivos móviles
   - Optimizado para escritorio
   - Uso de Bootstrap 5.3
   - Colores corporativos (#116835)
   - Logo de Empaques Múltiples

---

## 🏗️ Arquitectura del Sistema

### Estructura de Archivos

```
almuerzo/
│
├── 📄 index.html                  → Redirige a login.html
├── 📄 login.html                  → Página de inicio de sesión
├── 📄 usuario.html                → Dashboard de usuario regular
├── 📄 admin.html                  → Panel de administrador
│
├── 📄 README.md                   → Documentación completa
├── 📄 SETUP.md                    → Guía rápida de configuración
├── 📄 firebase-rules.json         → Reglas de seguridad
│
├── 📂 css/
│   └── almuerzo.css               → Estilos personalizados
│
└── 📂 js/
    ├── firebase-config.js         → Configuración de Firebase (requiere setup)
    ├── firebase-config.example.js → Ejemplo de configuración
    ├── auth.js                    → Lógica de autenticación
    ├── database.js                → Operaciones de base de datos
    └── excel-export.js            → Exportación a Excel
```

### Flujo de Autenticación

```
Usuario accede a /almuerzo/login.html
          ↓
Ingresa credenciales (email + password)
          ↓
Firebase Authentication valida
          ↓
    ¿Es admin?
    /        \
  SÍ         NO
   ↓          ↓
admin.html  usuario.html
```

### Flujo de Registro de Asistencia

```
Usuario en dashboard
          ↓
Clic en "Registrar Asistencia"
          ↓
Verificación: ¿Ya registró hoy?
    /              \
  SÍ                NO
   ↓                 ↓
Mostrar error   Registrar en DB
                     ↓
              Actualizar historial
                     ↓
             Deshabilitar botón
```

---

## 🎨 Diseño Visual

### Colores Corporativos
- **Primary (Verde):** `#116835`
- **Hover:** `#0d5128`
- **Fondo:** Gradiente `#f5f7fa` → `#c3cfe2`
- **Texto:** `#333` (oscuro), `#666` (claro)

### Componentes UI

1. **Tarjetas (Cards)**
   - Border-radius: 15px
   - Sombra suave con efecto hover
   - Header con fondo verde corporativo

2. **Botones**
   - Redondeados (8px)
   - Efecto hover con elevación
   - Iconos de Font Awesome

3. **Formularios**
   - Inputs con focus effect
   - Labels descriptivos
   - Validación visual

4. **Tablas**
   - Header verde corporativo
   - Hover en filas
   - Responsive con scroll horizontal

---

## 🔒 Seguridad

### Reglas de Firebase

```json
{
  "rules": {
    "asistencias": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$asistenciaId": {
        ".validate": "newData.hasChildren(['userId', 'nombre', 'email', 'fecha', 'hora', 'timestamp']) && newData.child('userId').val() == auth.uid"
      }
    }
  }
}
```

### Validaciones Implementadas

1. **Autenticación en todas las páginas**
   - Verificación al cargar
   - Redirección automática si no autenticado

2. **Separación de roles**
   - Admin → Solo puede acceder a admin.html
   - Usuario → Solo puede acceder a usuario.html

3. **Validación de datos**
   - Estructura de datos obligatoria
   - Usuario solo puede escribir sus propias asistencias

4. **Restricción de registro**
   - Una asistencia por día por usuario
   - Validación en cliente

---

## 📊 Base de Datos

### Estructura de Datos

```javascript
asistencias/
  ├── -NjK8dfjk2jd (ID único)
  │   ├── userId: "abc123xyz"
  │   ├── nombre: "Juan Pérez"
  │   ├── email: "juan.perez@casaempaques.com"
  │   ├── fecha: "2025-01-15"
  │   ├── hora: "12:45:30"
  │   └── timestamp: 1705329930000
  │
  ├── -NjK8efgh3kd
  │   ├── userId: "def456uvw"
  │   ├── nombre: "María González"
  │   ├── email: "maria.gonzalez@casaempaques.com"
  │   ├── fecha: "2025-01-15"
  │   ├── hora: "12:47:15"
  │   └── timestamp: 1705330035000
  ...
```

### Operaciones CRUD

| Operación | Función | Descripción |
|-----------|---------|-------------|
| CREATE | `registrarAsistencia()` | Crea nuevo registro de asistencia |
| READ | `obtenerAsistenciasUsuario()` | Lee asistencias de un usuario |
| READ | `obtenerTodasAsistencias()` | Lee todas las asistencias (admin) |
| READ | `verificarAsistenciaHoy()` | Verifica si ya registró hoy |
| READ | `obtenerEstadisticas()` | Calcula estadísticas |

---

## 🚀 Funcionalidades Detalladas

### Para Usuarios Regulares

#### 1. Registro de Asistencia
- **Acción:** Clic en botón "Registrar Asistencia"
- **Restricción:** Una vez por día
- **Feedback:** Mensaje de éxito/error
- **Efecto:** Botón se deshabilita tras registro exitoso

#### 2. Historial Personal
- **Vista:** Tabla ordenada por fecha descendente
- **Campos:** Número, Fecha, Hora, Estado
- **Formato:** Fechas en español (ej: "15 de enero de 2025")

### Para Administrador

#### 1. Estadísticas
- **Hoy:** Contador de asistencias del día actual
- **Este Mes:** Contador del mes en curso
- **Total:** Suma histórica de todas las asistencias

#### 2. Filtrado
- **Por Fecha:** Rango de fecha inicio - fecha fin
- **Por Búsqueda:** Nombre o email
- **Botones Rápidos:**
  - "Ver Hoy": Filtra solo hoy
  - "Limpiar Filtros": Muestra todo

#### 3. Exportación a Excel
- **Formato:** .xlsx (Excel 2007+)
- **Columnas:** No., Nombre, Email, Fecha, Hora
- **Nombre archivo:** `asistencias_YYYY-MM-DD.xlsx`
- **Biblioteca:** SheetJS (xlsx)

---

## 📱 Responsive Design

### Breakpoints

- **Desktop:** > 768px
  - Layout completo
  - Sidebar y contenido lado a lado
  - Tablas con todos los campos

- **Tablet:** 576px - 768px
  - Layout adaptativo
  - Elementos apilados verticalmente
  - Tablas scrollables

- **Mobile:** < 576px
  - Layout compacto
  - Botones full-width
  - Tablas con scroll horizontal
  - Fuentes más pequeñas

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5:** Estructura semántica
- **CSS3:** Estilos modernos con variables CSS
- **JavaScript (ES6+):** Lógica del cliente
- **Bootstrap 5.3:** Framework CSS responsive
- **Font Awesome 6.4:** Iconos

### Backend/Servicios
- **Firebase Authentication:** Gestión de usuarios
- **Firebase Realtime Database:** Almacenamiento de datos
- **SheetJS (xlsx):** Exportación a Excel

### Librerías
```javascript
// Firebase SDK
firebase-app-compat.js v9.22.0
firebase-auth-compat.js v9.22.0
firebase-database-compat.js v9.22.0

// Bootstrap
bootstrap@5.3.0

// Font Awesome
@6.4.0

// SheetJS
xlsx@0.20.0
```

---

## ⚙️ Configuración Requerida

### Antes de usar el sistema, se debe:

1. ✅ Crear proyecto en Firebase Console
2. ✅ Habilitar Authentication (Email/Password)
3. ✅ Crear Realtime Database
4. ✅ Aplicar reglas de seguridad
5. ✅ Obtener credenciales de Firebase
6. ✅ Actualizar `firebase-config.js`
7. ✅ Crear usuarios en Firebase Console

**Tiempo estimado:** 30 minutos

Ver archivo `SETUP.md` para instrucciones paso a paso.

---

## 📞 Acceso al Sistema

### URL de Acceso
```
https://www.casaempaques.com/almuerzo/login.html
```

### Credenciales de Ejemplo

**Administrador:**
- Email: `admin@casaempaques.com`
- Password: (configurar en Firebase)

**Usuario Regular:**
- Email: `empleado@casaempaques.com`
- Password: (configurar en Firebase)

---

## 🔐 Consideraciones de Seguridad

### Implementadas
✅ Autenticación requerida en todas las páginas
✅ Validación de roles (user/admin)
✅ Reglas de seguridad en Firebase
✅ Validación de estructura de datos
✅ Página no enlazada desde navegación principal

### Recomendaciones
⚠️ Cambiar contraseñas periódicamente
⚠️ Usar contraseñas seguras (min 12 caracteres)
⚠️ Revisar logs de Firebase regularmente
⚠️ No compartir credenciales de administrador
⚠️ Mantener actualizado Firebase SDK

---

## 📈 Métricas y Análisis

El sistema proporciona las siguientes métricas:

1. **Asistencias por día**
2. **Asistencias por mes**
3. **Total histórico de asistencias**
4. **Listado completo exportable a Excel**

---

## 🐛 Solución de Problemas Comunes

### Error: "Firebase not defined"
**Causa:** Scripts de Firebase no cargaron
**Solución:** Verificar conexión a internet y CDN

### Error: "Permission denied"
**Causa:** Reglas de Firebase incorrectas o usuario no autenticado
**Solución:** Verificar reglas y autenticación

### No se puede exportar a Excel
**Causa:** Librería SheetJS no cargó
**Solución:** Verificar CDN de SheetJS

### Usuario no puede registrar asistencia
**Causa:** Ya registró hoy o error de red
**Solución:** Verificar conexión y fecha del sistema

---

## 📝 Mantenimiento

### Backups Recomendados
- Exportar JSON de Realtime Database mensualmente
- Guardar copia de usuarios de Authentication
- Documentar cambios de configuración

### Monitoreo
- Revisar logs de Firebase Console
- Verificar uso de cuotas
- Monitorear intentos de acceso fallidos

---

## 🎯 Próximas Mejoras Sugeridas (Futuro)

- [ ] Notificaciones por email al registrar
- [ ] Múltiples opciones de menú
- [ ] Sistema de reservas anticipadas
- [ ] Dashboard con gráficos estadísticos
- [ ] App móvil nativa
- [ ] Integración con sistema de nómina
- [ ] QR code para registro rápido

---

## 📚 Referencias

- [Firebase Documentation](https://firebase.google.com/docs)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [SheetJS Documentation](https://docs.sheetjs.com/)
- [Font Awesome Icons](https://fontawesome.com/icons)

---

## ✅ Estado del Proyecto

**Estado:** ✅ COMPLETADO Y LISTO PARA CONFIGURACIÓN

**Fecha de Implementación:** Enero 2025

**Versión:** 1.0.0

---

**© 2025 Empaques Múltiples SRL. Todos los derechos reservados.**

Desarrollado para mejorar la gestión de asistencia al almuerzo y optimizar procesos internos.
