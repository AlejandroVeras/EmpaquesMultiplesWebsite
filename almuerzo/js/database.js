// database.js - Operaciones de base de datos (VERSIÓN FINAL - LUNES A VIERNES)

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

// =====================
// FUNCIONES PARA REGISTRO MÚLTIPLE
// =====================

// Registrar múltiples días de asistencia (excluye feriados automáticamente)
async function registrarAsistenciaMultiple(userId, nombre, email, fechasArray) {
    // Primero filtrar los días feriados
    const fechasSinFeriados = await filtrarDiasFeriados(fechasArray);
    
    if (fechasSinFeriados.length === 0) {
        throw new Error('Todos los días seleccionados son feriados');
    }
    
    const promises = [];
    const horaString = new Date().toTimeString().split(' ')[0];
    
    fechasSinFeriados.forEach(fechaString => {
        const asistenciaRef = database.ref('asistencias').push();
        const timestamp = new Date(fechaString + 'T12:00:00').getTime();
        
        const promise = asistenciaRef.set({
            userId: userId,
            nombre: nombre,
            email: email,
            fecha: fechaString,
            hora: horaString,
            timestamp: timestamp,
            tipoRegistro: 'multiple' // Marca para identificar registros múltiples
        });
        
        promises.push(promise);
    });
    
    await Promise.all(promises);
    
    // Retornar información sobre días excluidos
    const diasExcluidos = fechasArray.length - fechasSinFeriados.length;
    return {
        registrados: fechasSinFeriados.length,
        excluidos: diasExcluidos,
        fechasRegistradas: fechasSinFeriados
    };
}

// CORREGIDO: Obtener fechas de días laborales de la semana actual (SOLO Lunes a Viernes)
function obtenerDiasLaboralesSemana() {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = Domingo, 6 = Sábado
    
    // Calcular el lunes de la semana actual
    const lunes = new Date(hoy);
    const diff = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    lunes.setDate(diff);
    lunes.setHours(0, 0, 0, 0);
    
    const diasLaborales = [];
    
    // Generar fechas de Lunes a Viernes (5 días) - SOLO DÍAS LABORALES
    for (let i = 0; i < 5; i++) {
        const dia = new Date(lunes);
        dia.setDate(lunes.getDate() + i);
        diasLaborales.push(dia.toISOString().split('T')[0]);
    }
    
    return diasLaborales;
}

// Obtener fechas de días laborales del mes actual (SOLO Lunes a Viernes)
function obtenerDiasLaboralesMes() {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();
    
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    
    const diasLaborales = [];
    
    for (let dia = new Date(primerDia); dia <= ultimoDia; dia.setDate(dia.getDate() + 1)) {
        const diaSemana = dia.getDay();
        // Excluir domingos (0) y sábados (6) - SOLO Lunes a Viernes
        if (diaSemana !== 0 && diaSemana !== 6) {
            diasLaborales.push(new Date(dia).toISOString().split('T')[0]);
        }
    }
    
    return diasLaborales;
}

// Verificar qué días ya están registrados
function verificarDiasRegistrados(userId, fechasArray) {
    return database.ref('asistencias')
        .orderByChild('userId')
        .equalTo(userId)
        .once('value')
        .then((snapshot) => {
            const diasRegistrados = new Set();
            snapshot.forEach((childSnapshot) => {
                const asistencia = childSnapshot.val();
                diasRegistrados.add(asistencia.fecha);
            });
            
            // Filtrar solo los días que NO están registrados
            return fechasArray.filter(fecha => !diasRegistrados.has(fecha));
        });
}

// Obtener días registrados de la semana actual
function obtenerDiasRegistradosEstaSemana(userId) {
    const diasSemana = obtenerDiasLaboralesSemana();
    
    if (!userId) {
        return Promise.resolve([]);
    }
    
    return database.ref('asistencias')
        .orderByChild('userId')
        .equalTo(userId)
        .once('value')
        .then((snapshot) => {
            const diasRegistrados = [];
            snapshot.forEach((childSnapshot) => {
                const asistencia = childSnapshot.val();
                // Solo agregar si está en el rango de la semana actual
                if (diasSemana.includes(asistencia.fecha)) {
                    diasRegistrados.push(asistencia.fecha);
                }
            });
            return diasRegistrados;
        })
        .catch((error) => {
            console.error('Error al obtener días registrados:', error);
            return [];
        });
}

// =====================
// FUNCIONES DE PREFERENCIAS
// =====================

// Guardar preferencia de registro del usuario
function guardarPreferenciaRegistro(userId, tipoRegistro, diasSeleccionados = []) {
    return database.ref('preferencias/' + userId).set({
        tipo: tipoRegistro, // 'diario', 'semanal', 'mensual', 'personalizado'
        diasSeleccionados: diasSeleccionados, // Array de días de la semana (1=Lunes, 5=Viernes)
        fechaActualizacion: new Date().toISOString()
    });
}

// Obtener preferencia de registro del usuario
function obtenerPreferenciaRegistro(userId) {
    return database.ref('preferencias/' + userId)
        .once('value')
        .then((snapshot) => snapshot.val())
        .catch((error) => {
            console.error('Error al obtener preferencia:', error);
            return null;
        });
}

// Función para obtener descripción legible de la preferencia
function obtenerDescripcionPreferencia(preferencia) {
    if (!preferencia) return 'Sin configurar';
    
    switch(preferencia.tipo) {
        case 'diario':
            return 'Registro manual diario';
        case 'semanal':
            return 'Registro automático toda la semana (Lun-Vie)';
        case 'mensual':
            return 'Registro automático todo el mes (Lun-Vie)';
        case 'personalizado':
            const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
            const dias = preferencia.diasSeleccionados
                .map(d => diasNombres[d - 1])
                .filter(Boolean);
            return `Días personalizados: ${dias.join(', ')}`;
        default:
            return 'Configuración desconocida';
    }
}

// =====================
// REGISTRO AUTOMÁTICO
// =====================

// Verificar si es un día feriado en República Dominicana
function esUnDiaFeriado(fecha) {
    // Lista oficial de días feriados en República Dominicana 2025-2026
    const feriados = [
        // 2025
        '2025-01-01', '2025-01-06', '2025-01-21', '2025-01-26',
        '2025-02-27', '2025-04-18', '2025-05-01', '2025-06-19',
        '2025-08-16', '2025-09-24', '2025-11-06', '2025-12-25',
        // 2026
        '2026-01-01', '2026-01-06', '2026-01-21', '2026-01-26',
        '2026-02-27', '2026-04-03', '2026-05-01', '2026-06-04',
        '2026-08-16', '2026-09-24', '2026-11-06', '2026-12-25'
    ];
    
    return Promise.resolve(feriados.includes(fecha));
}

// Filtrar días feriados de un array de fechas
async function filtrarDiasFeriados(fechasArray) {
    const fechasValidas = [];
    
    for (const fecha of fechasArray) {
        const esFeriado = await esUnDiaFeriado(fecha);
        if (!esFeriado) {
            fechasValidas.push(fecha);
        }
    }
    
    return fechasValidas;
}

// Función para registrar asistencia automática según preferencia
function registrarAsistenciaAutomatica(userId, nombre, email) {
    return obtenerPreferenciaRegistro(userId)
        .then((preferencia) => {
            if (!preferencia || preferencia.tipo === 'diario') {
                return { exito: false, mensaje: 'El usuario usa registro manual' };
            }
            
            const hoy = new Date().toISOString().split('T')[0];
            const diaHoy = new Date().getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
            
            return esUnDiaFeriado(hoy)
                .then((esFeriado) => {
                    if (esFeriado) {
                        return { exito: false, mensaje: 'Hoy es un día feriado' };
                    }
                    
                    // Domingo y Sábado siempre están cerrados
                    if (diaHoy === 0 || diaHoy === 6) {
                        return { exito: false, mensaje: 'Hoy es fin de semana (cerrado)' };
                    }
                    
                    return verificarAsistenciaHoy(userId)
                        .then((yaRegistrado) => {
                            if (yaRegistrado) {
                                return { exito: false, mensaje: 'Ya está registrado para hoy' };
                            }
                            
                            let debeRegistrar = false;
                            
                            if (preferencia.tipo === 'semanal' || preferencia.tipo === 'mensual') {
                                // Semanal/Mensual: registrar solo Lunes a Viernes
                                debeRegistrar = true;
                            } else if (preferencia.tipo === 'personalizado') {
                                // Verificar si hoy está en los días seleccionados
                                // Los días se guardan como números: 1=Lunes, 2=Martes, ..., 5=Viernes
                                debeRegistrar = preferencia.diasSeleccionados.includes(diaHoy);
                            }
                            
                            if (debeRegistrar) {
                                return registrarAsistencia(userId, nombre, email)
                                    .then(() => ({ 
                                        exito: true, 
                                        mensaje: 'Asistencia registrada automáticamente' 
                                    }));
                            } else {
                                return { 
                                    exito: false, 
                                    mensaje: 'No debe registrarse hoy según su configuración' 
                                };
                            }
                        });
                });
        })
        .catch((error) => {
            console.error('Error en registro automático:', error);
            return { exito: false, mensaje: 'Error en registro automático' };
        });
}

// =====================
// FUNCIONES ORIGINALES
// =====================

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
function guardarMenuSemanal(menuSemanal) {
    return database.ref('menuSemanal').set(menuSemanal);
}

// Obtener menú semanal completo
function obtenerMenuSemanal() {
    return database.ref('menuSemanal')
        .once('value')
        .then((snapshot) => snapshot.val() || {});
}

// Obtener menú del día actual en español
function obtenerMenuDeHoy() {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const hoyIndex = new Date().getDay();
    const hoyNombre = dias[hoyIndex];
    return obtenerMenuSemanal().then((menu) => ({
        dia: hoyNombre,
        descripcion: (menu && menu[hoyNombre]) ? menu[hoyNombre] : ''
    }));
}
