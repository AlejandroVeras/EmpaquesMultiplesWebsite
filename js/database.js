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

// Función para verificar si un día es feriado
function esUnDiaFeriado(dateISO) {
    return database.ref('feriados')
        .once('value')
        .then((snapshot) => {
            const feriados = snapshot.val() || {};
            return Object.values(feriados).some(f => f.fecha === dateISO);
        })
        .catch(error => {
            console.error("Error al verificar feriados:", error);
            return false;
        });
}

// Función para registrar asistencia automáticamente
async function registrarAsistenciaAutomatica(userId, userName, userEmail) {
    const preferencia = await obtenerPreferenciaRegistro(userId);
    const hoyISO = new Date().toISOString().split('T')[0];
    const hoyDiaSemana = new Date().getDay(); // 0-6, 0 es domingo

    // Días de la semana para mapear (Firebase guarda como string, JS como number)
    const diasMap = {
        1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo'
    };
    const nombreDiaHoy = diasMap[hoyDiaSemana];

    if (!preferencia || preferencia.tipo === 'diario') {
        return { exito: false, mensaje: 'No debe registrarse hoy según su configuración' };
    }

    const yaRegistrado = await verificarAsistenciaHoy(userId);
    if (yaRegistrado) {
        return { exito: false, mensaje: 'Ya está registrado para hoy' };
    }

    let debeRegistrarse = false;
    if (preferencia.tipo === 'semanal') {
        // Lunes a viernes
        debeRegistrarse = (hoyDiaSemana >= 1 && hoyDiaSemana <= 5);
    } else if (preferencia.tipo === 'personalizado') {
        debeRegistrarse = preferencia.diasSeleccionados.includes(nombreDiaHoy);
    }

    if (debeRegistrarse) {
        await registrarAsistencia(userId, userName, userEmail);
        return { exito: true, mensaje: '¡Registro automático exitoso para hoy!' };
    } else {
        return { exito: false, mensaje: 'No debe registrarse hoy según su configuración' };
    }
}

// =====================
// Preferencias de Registro y Registro Semanal
// =====================

// Obtener la preferencia de registro de un usuario
function obtenerPreferenciaRegistro(userId) {
    return database.ref(`preferencias/${userId}`)
        .once('value')
        .then((snapshot) => snapshot.val() || null);
}

// Guardar la preferencia de registro de un usuario
function guardarPreferenciaRegistro(userId, tipo, diasSeleccionados = []) {
    return database.ref(`preferencias/${userId}`).set({
        tipo: tipo,
        diasSeleccionados: diasSeleccionados
    });
}

// Función auxiliar para obtener una descripción legible de la preferencia
function obtenerDescripcionPreferencia(preferencia) {
    if (!preferencia) return 'Sin configurar';
    if (preferencia.tipo === 'diario') return 'Diario';
    if (preferencia.tipo === 'semanal') return 'Semanal (Lunes a Viernes)';
    if (preferencia.tipo === 'personalizado') {
        return `Personalizado: ${preferencia.diasSeleccionados.join(', ')}`;
    }
    return 'Desconocido';
}

// Obtener los días ya registrados para la semana actual por un usuario
function obtenerDiasRegistradosEstaSemana(userId) {
    const hoy = new Date();
    const primerDiaSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1))); // Lunes de la semana actual
    const ultimaFechaSemana = new Date(primerDiaSemana);
    ultimaFechaSemana.setDate(primerDiaSemana.getDate() + 6); // Domingo de la semana actual

    const primerDiaISO = primerDiaSemana.toISOString().split('T')[0];
    const ultimaFechaISO = ultimaFechaSemana.toISOString().split('T')[0];

    return database.ref('asistencias')
        .orderByChild('userId')
        .equalTo(userId)
        .once('value')
        .then(snapshot => {
            const diasRegistrados = [];
            snapshot.forEach(childSnapshot => {
                const asistencia = childSnapshot.val();
                if (asistencia.fecha >= primerDiaISO && asistencia.fecha <= ultimaFechaISO) {
                    diasRegistrados.push(asistencia.fecha);
                }
            });
            return diasRegistrados;
        });
}

// Registrar múltiples asistencias para una semana (para selección semanal/personalizada)
async function registrarAsistenciaMultiple(userId, userName, userEmail, dias) {
    const batch = {};
    const hoy = new Date();
    const hoyISO = hoy.toISOString().split('T')[0];

    const feriados = await database.ref('feriados').once('value').then(snap => snap.val() || {});
    const fechasFeriadas = Object.values(feriados).map(f => f.fecha);

    for (const fechaISO of dias) {
        // Solo registra si no es un feriado y si el día no ha pasado
        if (fechaISO >= hoyISO && !fechasFeriadas.includes(fechaISO)) {
            const asistenciaRef = database.ref('asistencias').push();
            batch[asistenciaRef.key] = {
                userId: userId,
                nombre: userName,
                email: userEmail,
                fecha: fechaISO,
                hora: hoy.toTimeString().split(' ')[0],
                timestamp: new Date(`${fechaISO}T00:00:00`).getTime() // Usar inicio del día para el timestamp
            };
        }
    }

    if (Object.keys(batch).length > 0) {
        return database.ref('asistencias').update(batch);
    } else {
        return Promise.resolve(); // No hay nada que registrar
    }
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