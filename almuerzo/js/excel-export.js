// excel-export.js - Funcionalidad de exportación a Excel

// Función para exportar asistencias a Excel
function exportarAExcel(asistencias, nombreArchivo = 'asistencias_almuerzo.xlsx') {
    // Preparar datos para la exportación
    const datosExcel = asistencias.map((asistencia, index) => {
        return {
            'No.': index + 1,
            'Nombre': asistencia.nombre,
            'Email': asistencia.email,
            'Fecha': asistencia.fecha,
            'Hora': asistencia.hora
        };
    });

    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    
    // Ajustar ancho de columnas
    const wscols = [
        { wch: 6 },  // No.
        { wch: 30 }, // Nombre
        { wch: 35 }, // Email
        { wch: 12 }, // Fecha
        { wch: 10 }  // Hora
    ];
    ws['!cols'] = wscols;
    
    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Asistencias");
    
    // Generar archivo y descargar
    XLSX.writeFile(wb, nombreArchivo);
}

// Función para exportar con filtro de fecha
function exportarPorFecha(fechaInicio, fechaFin) {
    filtrarAsistenciasPorFecha(fechaInicio, fechaFin)
        .then((asistencias) => {
            const nombreArchivo = `asistencias_${fechaInicio}_${fechaFin}.xlsx`;
            exportarAExcel(asistencias, nombreArchivo);
        })
        .catch((error) => {
            console.error('Error al exportar:', error);
            alert('Error al exportar los datos');
        });
}

// Función para exportar todas las asistencias
function exportarTodas() {
    obtenerTodasAsistencias()
        .then((asistencias) => {
            const fecha = new Date().toISOString().split('T')[0];
            const nombreArchivo = `asistencias_todas_${fecha}.xlsx`;
            exportarAExcel(asistencias, nombreArchivo);
        })
        .catch((error) => {
            console.error('Error al exportar:', error);
            alert('Error al exportar los datos');
        });
}
