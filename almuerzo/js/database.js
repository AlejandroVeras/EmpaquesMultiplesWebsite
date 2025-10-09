// firestore.js - Operaciones de base de datos con usuarios y sin emails

// Registrar asistencia al almuerzo
function registrarAsistencia(userId, nombre, username) {
    const fecha = new Date();
    const fechaString = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaString = fecha.toTimeString().split(' ')[0]; // HH:MM:SS
    
    return db.collection('asistencias').add({
        userId: userId,
        nombre: nombre,
        username: username,
        fecha: fechaString,
        hora: horaString,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Obtener asistencias del usuario actual
function obtenerAsistenciasUsuario(userId) {
    return db.collection('asistencias')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get()
        .then((querySnapshot) => {
            const asistencias = [];
            querySnapshot.forEach((doc) => {
                asistencias.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return asistencias;
        });
}

// Verificar si el usuario ya registró asistencia hoy
function verificarAsistenciaHoy(userId) {
    const hoy = new Date().toISOString().split('T')[0];
    
    return db.collection('asistencias')
        .where('userId', '==', userId)
        .where('fecha', '==', hoy)
        .get()
        .then((querySnapshot) => {
            return !querySnapshot.empty;
        });
}

// Obtener todas las asistencias (solo admin)
function obtenerTodasAsistencias() {
    return db.collection('asistencias')
        .orderBy('timestamp', 'desc')
        .get()
        .then((querySnapshot) => {
            const asistencias = [];
            querySnapshot.forEach((doc) => {
                asistencias.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return asistencias;
        });
}

// Filtrar asistencias por fecha
function filtrarAsistenciasPorFecha(fechaInicio, fechaFin) {
    return db.collection('asistencias')
        .where('fecha', '>=', fechaInicio)
        .where('fecha', '<=', fechaFin)
        .orderBy('fecha', 'desc')
        .get()
        .then((querySnapshot) => {
            const asistencias = [];
            querySnapshot.forEach((doc) => {
                asistencias.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return asistencias;
        });
}

// Obtener estadísticas de asistencias
function obtenerEstadisticas() {
    const hoy = new Date().toISOString().split('T')[0];
    const inicioMes = new Date().toISOString().slice(0, 7) + '-01';
    const finMes = new Date().toISOString().slice(0, 7) + '-31';
    
    return Promise.all([
        // Asistencias hoy
        db.collection('asistencias')
            .where('fecha', '==', hoy)
            .get(),
        
        // Asistencias del mes
        db.collection('asistencias')
            .where('fecha', '>=', inicioMes)
            .where('fecha', '<=', finMes)
            .get(),
        
        // Total asistencias
        db.collection('asistencias').get()
    ])
    .then(([hoySnapshot, mesSnapshot, totalSnapshot]) => {
        return {
            hoy: hoySnapshot.size,
            mes: mesSnapshot.size,
            total: totalSnapshot.size
        };
    });
}