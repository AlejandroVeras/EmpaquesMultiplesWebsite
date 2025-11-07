// excel-export.js - Exportación mejorada con logo y diseño moderno usando ExcelJS

// Función para agrupar asistencias por empleado
function agruparPorEmpleado(asistencias) {
    const empleados = {};
    
    asistencias.forEach((asistencia) => {
        const key = asistencia.email;
        
        if (!empleados[key]) {
            empleados[key] = {
                nombre: asistencia.nombre,
                email: asistencia.email,
                fechas: []
            };
        }
        
        empleados[key].fechas.push({
            fecha: asistencia.fecha,
            hora: asistencia.hora
        });
    });
    
    // Convertir a array y ordenar por nombre
    return Object.values(empleados).sort((a, b) => 
        a.nombre.localeCompare(b.nombre)
    );
}

// Función para convertir imagen a base64
async function imagenABase64(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error al cargar imagen:', error);
        return null;
    }
}

// Función para exportar todas las asistencias
async function exportarTodas() {
    if (todasAsistencias.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }
    
    await generarExcel(todasAsistencias, 'Todas_las_Asistencias');
}

// Función para exportar por rango de fechas
async function exportarPorFecha(fechaInicio, fechaFin) {
    if (asistenciasFiltradas.length === 0) {
        alert('No hay datos para exportar en el rango seleccionado.');
        return;
    }
    
    const nombreArchivo = `Asistencias_${fechaInicio}_a_${fechaFin}`;
    await generarExcel(asistenciasFiltradas, nombreArchivo);
}

// Función principal para generar el archivo Excel con ExcelJS
async function generarExcel(asistencias, nombreArchivo) {
    // Mostrar indicador de carga
    mostrarNotificacion('Generando Excel...', 'info');
    
    // Agrupar asistencias por empleado
    const empleadosAgrupados = agruparPorEmpleado(asistencias);
    
    // Crear nuevo libro de trabajo
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Almuerzo - Empaques Múltiples';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Asistencias', {
        pageSetup: { 
            paperSize: 9, 
            orientation: 'landscape',
            fitToPage: true
        }
    });
    
    // Cargar y agregar logo
    const logoBase64 = await imagenABase64('../images/logo.png');
    if (logoBase64) {
        const imageId = workbook.addImage({
            base64: logoBase64,
            extension: 'png',
        });
        
        worksheet.addImage(imageId, {
            tl: { col: 0, row: 0 },
            ext: { width: 150, height: 60 }
        });
    }
    
    // Agregar título principal (al lado del logo)
    worksheet.mergeCells('C1:H2');
    const titleCell = worksheet.getCell('C1');
    titleCell.value = 'REPORTE DE ALMUERZO DE EMPLEADOS';
    titleCell.font = { 
        name: 'Poppins', 
        size: 18, 
        bold: true, 
        color: { argb: 'FF116835' } 
    };
    titleCell.alignment = { 
        vertical: 'middle', 
        horizontal: 'center' 
    };
    
    // Agregar subtítulo
    worksheet.mergeCells('C3:H3');
    const subtitleCell = worksheet.getCell('C3');
    subtitleCell.value = 'Empaques Múltiples';
    subtitleCell.font = { 
        name: 'Poppins', 
        size: 14, 
        bold: true,
        color: { argb: 'FF333333' }
    };
    subtitleCell.alignment = { 
        vertical: 'middle', 
        horizontal: 'center' 
    };
    
    // Fecha de generación
    worksheet.mergeCells('C4:H4');
    const dateCell = worksheet.getCell('C4');
    dateCell.value = `Generado: ${new Date().toLocaleString('es-ES', { 
        dateStyle: 'full', 
        timeStyle: 'short' 
    })}`;
    dateCell.font = { 
        name: 'Poppins', 
        size: 10, 
        italic: true,
        color: { argb: 'FF666666' }
    };
    dateCell.alignment = { 
        vertical: 'middle', 
        horizontal: 'center' 
    };
    
    // Línea separadora con color corporativo
    worksheet.getRow(5).height = 5;
    worksheet.mergeCells('A5:Z5');
    worksheet.getCell('A5').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF116835' }
    };
    
    // Obtener el número máximo de fechas
    const maxFechas = Math.max(...empleadosAgrupados.map(emp => emp.fechas.length));
    
    // Configurar encabezados
    const headerRow = worksheet.getRow(7);
    headerRow.height = 30;
    
    const headers = ['#', 'NOMBRE', 'TOTAL'];
    let colIndex = 1;
    
    headers.forEach(header => {
        const cell = headerRow.getCell(colIndex);
        cell.value = header;
        cell.font = { 
            name: 'Poppins', 
            bold: true, 
            size: 11, 
            color: { argb: 'FFFFFFFF' } 
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF116835' }
        };
        cell.alignment = { 
            vertical: 'middle', 
            horizontal: 'center' 
        };
        cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };
        colIndex++;
    });
    
    // Agregar columnas de fechas dinámicamente
    for (let i = 1; i <= maxFechas; i++) {
        // Columna de fecha
        let cell = headerRow.getCell(colIndex);
        cell.value = `FECHA ${i}`;
        cell.font = { 
            name: 'Poppins', 
            bold: true, 
            size: 11, 
            color: { argb: 'FFFFFFFF' } 
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1b954d' }
        };
        cell.alignment = { 
            vertical: 'middle', 
            horizontal: 'center' 
        };
        cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };
        colIndex++;
        
        // Columna de hora
        cell = headerRow.getCell(colIndex);
        cell.value = `HORA ${i}`;
        cell.font = { 
            name: 'Poppins', 
            bold: true, 
            size: 11, 
            color: { argb: 'FFFFFFFF' } 
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1b954d' }
        };
        cell.alignment = { 
            vertical: 'middle', 
            horizontal: 'center' 
        };
        cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };
        colIndex++;
    }
    
    // Agregar datos de empleados
    let rowIndex = 8;
    empleadosAgrupados.forEach((empleado, index) => {
        const row = worksheet.getRow(rowIndex);
        row.height = 25;
        
        // Ordenar fechas cronológicamente
        empleado.fechas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        
        // Color alternado para filas
        const bgColor = index % 2 === 0 ? 'FFF8F9FA' : 'FFFFFFFF';
        
        // Número
        let cell = row.getCell(1);
        cell.value = index + 1;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
        };
        
        // Nombre
        cell = row.getCell(2);
        cell.value = empleado.nombre;
        cell.font = { name: 'Poppins', size: 10, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
        };
        
        // Total asistencias
        cell = row.getCell(4);
        cell.value = empleado.fechas.length;
        cell.font = { name: 'Poppins', size: 11, bold: true, color: { argb: 'FF116835' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
        };
        
        // Fechas y horas
        let fechaColIndex = 5;
        empleado.fechas.forEach((asistencia) => {
            // Fecha
            cell = row.getCell(fechaColIndex);
            cell.value = formatearFechaExcel(asistencia.fecha);
            cell.font = { name: 'Poppins', size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
            };
            fechaColIndex++;
            
            // Hora
            cell = row.getCell(fechaColIndex);
            cell.value = asistencia.hora;
            cell.font = { name: 'Poppins', size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
            };
            fechaColIndex++;
        });
        
        rowIndex++;
    });
    
    // Agregar resumen
    rowIndex += 2;
    
    // Línea separadora
    worksheet.getRow(rowIndex).height = 5;
    worksheet.mergeCells(`A${rowIndex}:Z${rowIndex}`);
    worksheet.getCell(`A${rowIndex}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF116835' }
    };
    rowIndex++;
    
    // Título del resumen
    worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
    let resumenCell = worksheet.getCell(`A${rowIndex}`);
    resumenCell.value = 'RESUMEN GENERAL';
    resumenCell.font = { 
        name: 'Poppins', 
        size: 12, 
        bold: true, 
        color: { argb: 'FF116835' } 
    };
    resumenCell.alignment = { vertical: 'middle', horizontal: 'left' };
    rowIndex++;
    
    // Total empleados
    worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
    resumenCell = worksheet.getCell(`A${rowIndex}`);
    resumenCell.value = `Total de empleados: ${empleadosAgrupados.length}`;
    resumenCell.font = { name: 'Poppins', size: 10, bold: true };
    resumenCell.alignment = { vertical: 'middle', horizontal: 'left' };
    rowIndex++;
    
    // Total asistencias
    worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
    resumenCell = worksheet.getCell(`A${rowIndex}`);
    resumenCell.value = `Total de asistencias registradas: ${asistencias.length}`;
    resumenCell.font = { name: 'Poppins', size: 10, bold: true };
    resumenCell.alignment = { vertical: 'middle', horizontal: 'left' };
    
    // Ajustar ancho de columnas
    worksheet.getColumn(1).width = 6;   // #
    worksheet.getColumn(2).width = 30;  // NOMBRE
    worksheet.getColumn(4).width = 12;  // TOTAL
    
    // Columnas de fechas y horas
    for (let i = 5; i <= 4 + (maxFechas * 2); i++) {
        worksheet.getColumn(i).width = i % 2 === 1 ? 12 : 10;
    }
    
    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Descargar archivo
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreArchivo}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    // Mostrar mensaje de éxito
    mostrarNotificacion('✅ Excel exportado exitosamente con logo y diseño corporativo', 'success');
}

// Función auxiliar para formatear fecha en Excel
function formatearFechaExcel(fechaString) {
    const fecha = new Date(fechaString + 'T00:00:00');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notif = document.createElement('div');
    notif.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    notif.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
    notif.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.remove();
    }, 3000);
}