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
