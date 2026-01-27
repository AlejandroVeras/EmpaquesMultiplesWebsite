// database.js - Operaciones de base de datos

// Registrar asistencia al almuerzo
function registrarAsistencia(userId, nombre, email) {
    const fecha = new Date();
    const fechaString = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaString = fecha.toTimeString().split(' ')[0]; // HH:MM:SS
    
    const asistenciaRef = database.ref('asistencias').push();
    
    return asistenciaRef.set({
        userId: userId,
        nombre: nombre,
        email: email,
        fecha: fechaString,
        hora: horaString,
        timestamp: fecha.getTime()
    });
}

// Obtener asistencias del usuario actual
function obtenerAsistenciasUsuario(userId) {
    return database.ref('asistencias')
        .orderByChild('userId')
        .equalTo(userId)
        .once('value')
        .then((snapshot) => {
            const asistencias = [];
            snapshot.forEach((childSnapshot) => {
                asistencias.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            return asistencias.sort((a, b) => b.timestamp - a.timestamp);
        });
}

// Verificar si el usuario ya registró asistencia hoy
function verificarAsistenciaHoy(userId) {
    const hoy = new Date().toISOString().split('T')[0];
    
    return database.ref('asistencias')
        .orderByChild('userId')
        .equalTo(userId)
        .once('value')
        .then((snapshot) => {
            let yaRegistrado = false;
            snapshot.forEach((childSnapshot) => {
                const asistencia = childSnapshot.val();
                if (asistencia.fecha === hoy) {
                    yaRegistrado = true;
                }
            });
            return yaRegistrado;
        });
}

// Obtener todas las asistencias (solo admin)
function obtenerTodasAsistencias() {
    return database.ref('asistencias')
        .once('value')
        .then((snapshot) => {
            const asistencias = [];
            snapshot.forEach((childSnapshot) => {
                asistencias.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            return asistencias.sort((a, b) => b.timestamp - a.timestamp);
        });
}

// Filtrar asistencias por fecha
function filtrarAsistenciasPorFecha(fechaInicio, fechaFin) {
    return obtenerTodasAsistencias()
        .then((asistencias) => {
            return asistencias.filter((asistencia) => {
                return asistencia.fecha >= fechaInicio && asistencia.fecha <= fechaFin;
            });
        });
}

// Obtener estadísticas de asistencias
function obtenerEstadisticas() {
    return obtenerTodasAsistencias()
        .then((asistencias) => {
            const hoy = new Date().toISOString().split('T')[0];
            const esteMes = new Date().toISOString().slice(0, 7); // YYYY-MM
            
            const asistenciasHoy = asistencias.filter(a => a.fecha === hoy).length;
            const asistenciasMes = asistencias.filter(a => a.fecha.startsWith(esteMes)).length;
            const totalAsistencias = asistencias.length;
            
            return {
                hoy: asistenciasHoy,
                mes: asistenciasMes,
                total: totalAsistencias
            };
        });
}

// =====================
// Menú semanal (admin/usuario)
// =====================

// Guardar menú semanal completo
// Estructura esperada:
// {
//   lunes: "...",
//   martes: "...",
//   miercoles: "...",
//   jueves: "...",
//   viernes: "...",
//   sabado: "...",
//   domingo: "..."
// }
function guardarMenuSemanal(menuSemanal) {
    return database.ref('menuSemanal').set(menuSemanal);
}

// Obtener menú semanal completo
function obtenerMenuSemanal() {
    return database.ref('menuSemanal')
        .once('value')
        .then((snapshot) => snapshot.val() || {});
}

// Obtener menú del día actual en español (según configuración local)
function obtenerMenuDeHoy() {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const hoyIndex = new Date().getDay(); // 0=domingo ... 6=sabado
    const hoyNombre = dias[hoyIndex];
    return obtenerMenuSemanal().then((menu) => ({
        dia: hoyNombre,
        descripcion: (menu && menu[hoyNombre]) ? menu[hoyNombre] : ''
    }));
}

// =====================
// Registro Semanal (NEW)
// =====================

// Tipos de registro: 'diario', 'semanal', 'personalizado'
// Estructura de preferencia semanal:
// {
//   userId: "...",
//   tipo: "semanal" | "diario" | "personalizado",
//   diasSeleccionados: ['lunes', 'martes', ...], // solo para 'personalizado'
//   fechaCreacion: timestamp,
//   activo: true
// }

// Guardar preferencia de registro del usuario
function guardarPreferenciaRegistro(userId, tipo, diasSeleccionados = []) {
    const preferenciaRef = database.ref(`preferenciasRegistro/${userId}`);
    
    return preferenciaRef.set({
        tipo: tipo, // 'diario', 'semanal', 'personalizado'
        diasSeleccionados: tipo === 'personalizado' ? diasSeleccionados : [],
        fechaCreacion: new Date().getTime(),
        activo: true
    });
}

// Obtener preferencia de registro del usuario
function obtenerPreferenciaRegistro(userId) {
    return database.ref(`preferenciasRegistro/${userId}`)
        .once('value')
        .then((snapshot) => snapshot.val() || null);
}

// Registrar asistencia automática para todos los usuarios con "semanal"
// Detectar si hoy debe ser registrado automáticamente para un usuario
function debeRegistrarseHoy(userId, preferencia) {
    if (!preferencia) return false;
    
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const hoyIndex = new Date().getDay();
    const hoyNombre = dias[hoyIndex];
    
    if (preferencia.tipo === 'semanal') {
        // Registrar de lunes a viernes automáticamente
        return hoyIndex >= 1 && hoyIndex <= 5;
    } else if (preferencia.tipo === 'personalizado') {
        return preferencia.diasSeleccionados.includes(hoyNombre);
    } else if (preferencia.tipo === 'diario') {
        return true; // Siempre debe registrarse si elige diario
    }
    
    return false;
}

// Registrar asistencia automática si está configurado el registro semanal
function registrarAsistenciaAutomatica(userId, nombre, email) {
    return obtenerPreferenciaRegistro(userId)
        .then((preferencia) => {
            if (debeRegistrarseHoy(userId, preferencia)) {
                // Verificar si ya registró hoy
                return verificarAsistenciaHoy(userId)
                    .then((yaRegistrado) => {
                        if (!yaRegistrado) {
                            // Registrar automáticamente
                            return registrarAsistencia(userId, nombre, email)
                                .then(() => ({ exito: true, mensaje: 'Asistencia registrada automáticamente' }));
                        } else {
                            return { exito: false, mensaje: 'Ya está registrado para hoy' };
                        }
                    });
            } else {
                return { exito: false, mensaje: 'No debe registrarse hoy según su configuración' };
            }
        })
        .catch(() => ({ exito: false, mensaje: 'Error al procesar el registro' }));
}

// Obtener descripción de la preferencia de registro
function obtenerDescripcionPreferencia(preferencia) {
    if (!preferencia) return 'Sin configurar';
    
    if (preferencia.tipo === 'semanal') {
        return 'Registro automático de lunes a viernes';
    } else if (preferencia.tipo === 'personalizado') {
        const dias = preferencia.diasSeleccionados.join(', ');
        return `Registro personalizado: ${dias}`;
    } else if (preferencia.tipo === 'diario') {
        return 'Registro manual diario';
    }
    
    return 'Sin configurar';
}

// =====================
// Gestión de Días Feriados (NEW)
// =====================

// Obtener todos los días feriados
function obtenerDiasFeriados() {
    return database.ref('diasFeriados').once('value')
        .then((snapshot) => {
            const feriados = [];
            snapshot.forEach((childSnapshot) => {
                feriados.push({
                    fecha: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            return feriados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        });
}

// Agregar un día feriado
function agregarDiaFeriado(fecha, nombre) {
    return database.ref(`diasFeriados/${fecha}`).set({
        nombre: nombre,
        fechaCreacion: new Date().getTime()
    });
}

// Eliminar un día feriado
function eliminarDiaFeriado(fecha) {
    return database.ref(`diasFeriados/${fecha}`).remove();
}

// Verificar si una fecha es feriado
function esUnDiaFeriado(fecha) {
    return obtenerDiasFeriados()
        .then((feriados) => {
            return feriados.some((f) => f.fecha === fecha);
        });
}

// Obtener nombre del feriado si existe
function obtenerNombreFeriado(fecha) {
    return obtenerDiasFeriados()
        .then((feriados) => {
            const feriado = feriados.find((f) => f.fecha === fecha);
            return feriado ? feriado.nombre : null;
        });
}

// Actualizar debeRegistrarseHoy para validar feriados
function debeRegistrarseHoyConFeriados(userId, preferencia) {
    if (!preferencia) return Promise.resolve(false);
    
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const hoyIndex = new Date().getDay();
    const hoyNombre = dias[hoyIndex];
    const hoyFecha = new Date().toISOString().split('T')[0];
    
    let debeRegistrarse = false;
    
    if (preferencia.tipo === 'semanal') {
        debeRegistrarse = hoyIndex >= 1 && hoyIndex <= 5;
    } else if (preferencia.tipo === 'personalizado') {
        debeRegistrarse = preferencia.diasSeleccionados.includes(hoyNombre);
    } else if (preferencia.tipo === 'diario') {
        return Promise.resolve(false);
    }
    
    // Si debe registrarse, validar que no sea feriado
    if (debeRegistrarse) {
        return esUnDiaFeriado(hoyFecha)
            .then((esFeriado) => {
                return !esFeriado;
            });
    }
    
    return Promise.resolve(false);
}