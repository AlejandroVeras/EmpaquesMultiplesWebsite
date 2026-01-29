// usuario-main.js - Lógica principal de la página de usuario

let currentUser = null;
let nombreModal;
let preferenciaActual = null;
let diasSeleccionadosMes = new Set();

// =====================
// INICIALIZACIÓN
// =====================

// Verificar autenticación al cargar
checkAuth(false)
    .then((user) => {
        currentUser = user;
        document.getElementById('userEmail').textContent = user.email;
        
        if (!user.displayName) {
            nombreModal = new bootstrap.Modal(document.getElementById('nombreModal'));
            nombreModal.show();
            document.getElementById('guardarNombreBtn').addEventListener('click', guardarNombreUsuario);
        } else {
            document.getElementById('userName').textContent = user.displayName;
            inicializarPagina();
        }
    })
    .catch((error) => console.error('Error de autenticación:', error));

// Función para guardar nombre de usuario
function guardarNombreUsuario() {
    const nuevoNombre = document.getElementById('modalNombreUsuario').value.trim();
    const guardarBtn = document.getElementById('guardarNombreBtn');
    
    if (!nuevoNombre) {
        document.getElementById('modalNombreUsuario').classList.add('is-invalid');
        return;
    }
    
    guardarBtn.disabled = true;
    guardarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    actualizarNombreUsuario(nuevoNombre)
        .then((nombre) => {
            document.getElementById('userName').textContent = nombre;
            nombreModal.hide();
            mostrarAlerta('¡Bienvenido(a), ' + nombre + '! Tu perfil ha sido configurado.', 'success');
            inicializarPagina();
        })
        .catch((error) => {
            console.error('Error al actualizar perfil:', error);
            mostrarAlerta('Error al guardar el nombre. Por favor intenta nuevamente.', 'danger');
            guardarBtn.disabled = false;
            guardarBtn.innerHTML = '<i class="fas fa-save"></i> Guardar y continuar';
        });
}

// Configurar validación de formulario modal
document.getElementById('nombreForm').addEventListener('submit', function(e) {
    e.preventDefault();
    guardarNombreUsuario();
});

function inicializarPagina() {
    cargarPreferenciaRegistro();
    cargarHistorial();
    cargarMenuDeHoy();
    configurarOpcionesRegistro();
    configurarSelectoresDias();
}

// =====================
// CONFIGURACIÓN DE OPCIONES
// =====================

function configurarOpcionesRegistro() {
    const radios = document.querySelectorAll('input[name="tipoRegistro"]');
    const opcionDiario = document.getElementById('opcionDiario');
    const opcionSemanal = document.getElementById('opcionSemanal');
    const opcionMensual = document.getElementById('opcionMensual');
    const opcionPersonalizado = document.getElementById('opcionPersonalizado');
    
    // Evento de cambio en radios
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            actualizarVisibilidadTarjetas(this.value);
            actualizarSeleccionVisual();
        });
    });
    
    // Click en las tarjetas de opción
    opcionDiario.addEventListener('click', () => {
        document.getElementById('radioDiario').checked = true;
        actualizarVisibilidadTarjetas('diario');
        actualizarSeleccionVisual();
    });
    
    opcionSemanal.addEventListener('click', () => {
        document.getElementById('radioSemanal').checked = true;
        actualizarVisibilidadTarjetas('semanal');
        actualizarSeleccionVisual();
        renderizarDiasSemana();
    });
    
    opcionMensual.addEventListener('click', () => {
        document.getElementById('radioMensual').checked = true;
        actualizarVisibilidadTarjetas('mensual');
        actualizarSeleccionVisual();
        renderizarCalendarioMes();
    });
    
    opcionPersonalizado.addEventListener('click', () => {
        document.getElementById('radioPersonalizado').checked = true;
        actualizarVisibilidadTarjetas('personalizado');
        actualizarSeleccionVisual();
    });
}

function actualizarSeleccionVisual() {
    document.querySelectorAll('.opcion-registro').forEach(card => card.classList.remove('active'));
    const seleccionado = document.querySelector('input[name="tipoRegistro"]:checked');
    if (seleccionado) {
        seleccionado.closest('.opcion-registro').classList.add('active');
    }
}

function actualizarVisibilidadTarjetas(tipo) {
    const diasContainer = document.getElementById('diasContainer');
    const tarjetaDiario = document.getElementById('tarjetaRegistroDiario');
    const tarjetaSemanal = document.getElementById('tarjetaSemanal');
    const tarjetaMensual = document.getElementById('tarjetaMensual');
    
    // Ocultar todas primero
    diasContainer.style.display = 'none';
    tarjetaDiario.style.display = 'none';
    tarjetaSemanal.style.display = 'none';
    tarjetaMensual.style.display = 'none';
    
    // Mostrar según tipo
    switch(tipo) {
        case 'diario':
            tarjetaDiario.style.display = 'block';
            verificarRegistroHoy();
            break;
        case 'semanal':
            tarjetaSemanal.style.display = 'block';
            renderizarDiasSemana();
            break;
        case 'mensual':
            tarjetaMensual.style.display = 'block';
            renderizarCalendarioMes();
            break;
        case 'personalizado':
            diasContainer.style.display = 'block';
            break;
    }
}

// =====================
// SELECTORES DE DÍAS
// =====================

function configurarSelectoresDias() {
    const selectores = document.querySelectorAll('.dia-selector');
    
    selectores.forEach(selector => {
        selector.addEventListener('click', function() {
            if (!this.classList.contains('disabled')) {
                const checkbox = this.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                this.classList.toggle('selected', checkbox.checked);
            }
        });
    });
}

// =====================
// RENDERIZADO DE SEMANA
// =====================

function renderizarDiasSemana() {
    const contenedor = document.getElementById('selectorDiasSemana');
    const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    
    obtenerDiasLaboralesSemana()
        .then(diasSemana => {
            return obtenerDiasRegistradosEstaSemana(currentUser.uid)
                .then(registrados => ({ diasSemana, registrados }));
        })
        .then(({ diasSemana, registrados }) => {
            contenedor.innerHTML = '';
            
            diasSemana.forEach((fecha, index) => {
                const yaRegistrado = registrados.includes(fecha);
                const fechaObj = new Date(fecha + 'T00:00:00');
                const esPasado = fechaObj < new Date().setHours(0, 0, 0, 0);
                
                // Verificar si es feriado
                esUnDiaFeriado(fecha).then(esFeriado => {
                    const card = document.createElement('div');
                    card.className = 'card h-100';
                    
                    if (esFeriado) {
                        card.classList.add('bg-warning', 'text-dark');
                    } else if (yaRegistrado) {
                        card.classList.add('bg-success', 'text-white');
                    }
                    
                    card.innerHTML = `
                        <div class="card-body text-center p-3">
                            <div class="fw-bold mb-2">${nombresDias[index]}</div>
                            <div class="small mb-2">${formatearFechaCorta(fecha)}</div>
                            ${esFeriado ? 
                                '<div class="badge bg-danger w-100"><i class="fas fa-calendar-times"></i> Feriado</div>' :
                                yaRegistrado ? 
                                '<div class="badge bg-light text-success w-100"><i class="fas fa-check"></i> Registrado</div>' :
                                esPasado ?
                                '<div class="badge bg-secondary w-100">Pasado</div>' :
                                `<input type="checkbox" class="form-check-input dia-semana-checkbox" 
                                        value="${fecha}" style="width: 20px; height: 20px;">`
                            }
                        </div>
                    `;
                    
                    contenedor.appendChild(card);
                });
            });
        })
        .catch(err => console.error("Error al cargar días de la semana:", err));
}

// =====================
// RENDERIZADO DE MES
// =====================

function renderizarCalendarioMes() {
    const contenedor = document.getElementById('calendarioMes');
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();
    
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasMes = ultimoDia.getDate();
    
    // Obtener días ya registrados
    obtenerAsistenciasUsuario(currentUser.uid)
        .then(asistencias => {
            const registrados = new Set(asistencias.map(a => a.fecha));
            
            contenedor.innerHTML = '';
            
            // Cabecera con días de la semana
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            diasSemana.forEach(dia => {
                const header = document.createElement('div');
                header.className = 'text-center fw-bold small p-2';
                header.textContent = dia;
                contenedor.appendChild(header);
            });
            
            // Espacios en blanco antes del primer día
            const primerDiaSemana = primerDia.getDay();
            for (let i = 0; i < primerDiaSemana; i++) {
                const vacio = document.createElement('div');
                contenedor.appendChild(vacio);
            }
            
            // Días del mes
            for (let dia = 1; dia <= diasMes; dia++) {
                const fecha = new Date(año, mes, dia);
                const fechaString = fecha.toISOString().split('T')[0];
                const diaSemana = fecha.getDay();
                const esDomingo = diaSemana === 0;
                const esSabado = diaSemana === 6;
                const esPasado = fecha < new Date().setHours(0, 0, 0, 0);
                const yaRegistrado = registrados.has(fechaString);
                
                const diaDiv = document.createElement('div');
                diaDiv.className = 'dia-mes';
                diaDiv.textContent = dia;
                
                // Verificar si es feriado
                esUnDiaFeriado(fechaString).then(esFeriado => {
                    if (esFeriado && !yaRegistrado) {
                        diaDiv.classList.add('disabled');
                        diaDiv.style.backgroundColor = '#ffc107';
                        diaDiv.style.color = '#000';
                        diaDiv.title = 'Día feriado';
                    }
                });
                
                if (esDomingo || esSabado) {
                    if (esDomingo) {
                        diaDiv.classList.add('domingo', 'disabled');
                    } else {
                        diaDiv.classList.add('sabado', 'disabled');
                    }
                } else if (esPasado && !yaRegistrado) {
                    diaDiv.classList.add('disabled');
                } else if (yaRegistrado) {
                    diaDiv.classList.add('registrado');
                } else {
                    diaDiv.dataset.fecha = fechaString;
                    diaDiv.addEventListener('click', function() {
                        esUnDiaFeriado(fechaString).then(esFeriado => {
                            if (!esFeriado) {
                                if (diasSeleccionadosMes.has(fechaString)) {
                                    diasSeleccionadosMes.delete(fechaString);
                                    this.classList.remove('selected');
                                } else {
                                    diasSeleccionadosMes.add(fechaString);
                                    this.classList.add('selected');
                                }
                            }
                        });
                    });
                }
                
                contenedor.appendChild(diaDiv);
            }
        });
}

// =====================
// GUARDAR PREFERENCIA
// =====================

function guardarMiPreferenciaRegistro() {
    const tipoSeleccionado = document.querySelector('input[name="tipoRegistro"]:checked');
    
    if (!tipoSeleccionado) {
        mostrarAlerta('Por favor selecciona un tipo de registro', 'warning');
        return;
    }
    
    const tipo = tipoSeleccionado.value;
    let diasSeleccionados = [];
    
    if (tipo === 'personalizado') {
        const checkboxes = document.querySelectorAll('.dia-selector input[type="checkbox"]:checked');
        diasSeleccionados = Array.from(checkboxes).map(cb => cb.value);
        
        if (diasSeleccionados.length === 0) {
            mostrarAlerta('Por favor selecciona al menos un día de la semana', 'warning');
            return;
        }
    }
    
    const btnGuardar = document.getElementById('btnGuardarPreferencia');
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    guardarPreferenciaRegistro(currentUser.uid, tipo, diasSeleccionados)
        .then(() => {
            mostrarAlerta('¡Preferencia de registro guardada exitosamente!', 'success');
            cargarPreferenciaRegistro();
            actualizarVisibilidadTarjetas(tipo);
        })
        .catch((error) => {
            console.error('Error al guardar preferencia:', error);
            mostrarAlerta('Error al guardar la preferencia. Por favor intenta nuevamente.', 'danger');
        })
        .finally(() => {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Preferencia';
        });
}

// =====================
// CARGAR PREFERENCIA
// =====================

function cargarPreferenciaRegistro() {
    return obtenerPreferenciaRegistro(currentUser.uid)
        .then((preferencia) => {
            preferenciaActual = preferencia;
            
            if (preferencia) {
                document.getElementById('preferenciaActual').textContent = 
                    obtenerDescripcionPreferencia(preferencia);
                
                const radioActual = document.querySelector(
                    `input[name="tipoRegistro"][value="${preferencia.tipo}"]`
                );
                
                if (radioActual) {
                    radioActual.checked = true;
                    actualizarSeleccionVisual();
                    actualizarVisibilidadTarjetas(preferencia.tipo);
                    
                    if (preferencia.tipo === 'personalizado') {
                        preferencia.diasSeleccionados.forEach(dia => {
                            const checkbox = document.getElementById(`dia-${dia}`);
                            if (checkbox) {
                                checkbox.checked = true;
                                checkbox.closest('.dia-selector').classList.add('selected');
                            }
                        });
                    }
                }
                
                // Si tiene preferencia automática, ejecutar registro automático
                if (preferencia.tipo === 'semanal' || preferencia.tipo === 'mensual') {
                    ejecutarRegistroAutomatico();
                }
            } else {
                document.getElementById('preferenciaActual').textContent = 'Sin configurar';
            }
        })
        .catch((error) => {
            console.error('Error al cargar preferencia:', error);
            document.getElementById('preferenciaActual').textContent = 'Error al cargar';
        });
}

function ejecutarRegistroAutomatico() {
    esUnDiaFeriado(new Date().toISOString().split('T')[0])
        .then(esFeriado => {
            if (esFeriado) {
                mostrarAlerta('Hoy es un día feriado, el registro automático está deshabilitado.', 'info');
                return;
            }
            
            return registrarAsistenciaAutomatica(
                currentUser.uid,
                currentUser.displayName,
                currentUser.email
            );
        })
        .then(resultado => {
            if (resultado && resultado.exito) {
                mostrarAlerta(resultado.mensaje, 'success');
                cargarHistorial();
            }
        })
        .catch(error => {
            console.error('Error en registro automático:', error);
        });
}

// =====================
// REGISTRO MANUAL (DÍA)
// =====================

function verificarRegistroHoy() {
    verificarAsistenciaHoy(currentUser.uid)
        .then((yaRegistrado) => {
            const btnRegistrar = document.getElementById('btnRegistrar');
            
            if (yaRegistrado) {
                btnRegistrar.disabled = true;
                btnRegistrar.innerHTML = '<i class="fas fa-check-double"></i> Ya registraste tu asistencia hoy';
                btnRegistrar.classList.remove('btn-primary');
                btnRegistrar.classList.add('btn-success');
                mostrarAlerta('Ya has registrado tu asistencia para hoy.', 'info');
            }
        });
}

function registrarMiAsistencia() {
    const btnRegistrar = document.getElementById('btnRegistrar');
    
    btnRegistrar.disabled = true;
    btnRegistrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    
    registrarAsistencia(currentUser.uid, currentUser.displayName, currentUser.email)
        .then(() => {
            btnRegistrar.innerHTML = '<i class="fas fa-check-double"></i> Ya registraste tu asistencia hoy';
            btnRegistrar.classList.remove('btn-primary');
            btnRegistrar.classList.add('btn-success');
            mostrarAlerta('¡Asistencia registrada exitosamente!', 'success');
            cargarHistorial();
        })
        .catch((error) => {
            console.error('Error al registrar:', error);
            mostrarAlerta('Error al registrar la asistencia. Por favor, intenta nuevamente.', 'danger');
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = '<i class="fas fa-check-circle"></i> Registrar Asistencia';
        });
}

// =====================
// REGISTRO SEMANAL
// =====================

function registrarSeleccionSemanal() {
    const checkboxes = document.querySelectorAll('.dia-semana-checkbox:checked');
    const diasParaRegistrar = Array.from(checkboxes).map(cb => cb.value);
    
    if (diasParaRegistrar.length === 0) {
        mostrarAlerta("Selecciona al menos un día para registrar.", "warning");
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    
    registrarAsistenciaMultiple(
        currentUser.uid, 
        currentUser.displayName, 
        currentUser.email, 
        diasParaRegistrar
    )
        .then((resultado) => {
            let mensaje = `¡${resultado.registrados} día(s) registrado(s) correctamente!`;
            if (resultado.excluidos > 0) {
                mensaje += ` (${resultado.excluidos} día(s) feriado(s) excluido(s) automáticamente)`;
            }
            mostrarAlerta(mensaje, "success");
            renderizarDiasSemana();
            cargarHistorial();
        })
        .catch(error => {
            console.error("Error:", error);
            if (error.message === 'Todos los días seleccionados son feriados') {
                mostrarAlerta("Todos los días seleccionados son feriados. No se registró ninguna asistencia.", "warning");
            } else {
                mostrarAlerta("Hubo un error al guardar.", "danger");
            }
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-calendar-check"></i> Registrar Semana';
        });
}

// =====================
// REGISTRO MENSUAL
// =====================

function registrarSeleccionMensual() {
    const diasArray = Array.from(diasSeleccionadosMes);
    
    if (diasArray.length === 0) {
        mostrarAlerta("Selecciona al menos un día para registrar.", "warning");
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    
    registrarAsistenciaMultiple(
        currentUser.uid,
        currentUser.displayName,
        currentUser.email,
        diasArray
    )
        .then((resultado) => {
            let mensaje = `¡${resultado.registrados} día(s) registrado(s) correctamente!`;
            if (resultado.excluidos > 0) {
                mensaje += ` (${resultado.excluidos} día(s) feriado(s) excluido(s) automáticamente)`;
            }
            mostrarAlerta(mensaje, "success");
            diasSeleccionadosMes.clear();
            renderizarCalendarioMes();
            cargarHistorial();
        })
        .catch(error => {
            console.error("Error:", error);
            if (error.message === 'Todos los días seleccionados son feriados') {
                mostrarAlerta("Todos los días seleccionados son feriados. No se registró ninguna asistencia.", "warning");
            } else {
                mostrarAlerta("Hubo un error al guardar.", "danger");
            }
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-calendar-check"></i> Registrar Días Seleccionados';
        });
}

// =====================
// HISTORIAL
// =====================

function cargarHistorial() {
    const loadingHistorial = document.getElementById('loadingHistorial');
    const historialContainer = document.getElementById('historialContainer');
    const emptyHistorial = document.getElementById('emptyHistorial');
    const historialBody = document.getElementById('historialBody');
    
    loadingHistorial.style.display = 'block';
    historialContainer.style.display = 'none';
    emptyHistorial.style.display = 'none';
    
    obtenerAsistenciasUsuario(currentUser.uid)
        .then((asistencias) => {
            loadingHistorial.style.display = 'none';
            
            if (asistencias.length === 0) {
                emptyHistorial.style.display = 'block';
            } else {
                historialContainer.style.display = 'block';
                
                historialBody.innerHTML = '';
                asistencias.forEach((asistencia, index) => {
                    const row = document.createElement('tr');
                    const tipoRegistro = asistencia.tipoRegistro === 'multiple' ? 
                        '<span class="badge bg-info">Auto</span>' : 
                        '<span class="badge bg-primary">Manual</span>';
                    
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${formatearFecha(asistencia.fecha)}</td>
                        <td>${asistencia.hora}</td>
                        <td>${tipoRegistro}</td>
                        <td><span class="badge bg-success">Registrada</span></td>
                    `;
                    historialBody.appendChild(row);
                });
            }
        })
        .catch((error) => {
            console.error('Error al cargar historial:', error);
            loadingHistorial.style.display = 'none';
            mostrarAlerta('Error al cargar el historial.', 'danger');
        });
}

// =====================
// MENÚ DEL DÍA
// =====================

function cargarMenuDeHoy() {
    const card = document.getElementById('menuHoyCard');
    const contenido = document.getElementById('menuHoyContenido');
    contenido.innerHTML = '<span class="text-muted"><i class="fas fa-spinner fa-spin"></i> Cargando menú...</span>';
    card.style.display = 'block';
    
    obtenerMenuDeHoy()
        .then(({ dia, descripcion }) => {
            if (descripcion && descripcion.trim().length > 0) {
                contenido.innerHTML = `<strong>${dia.charAt(0).toUpperCase() + dia.slice(1)}:</strong> ${descripcion}`;
            } else {
                contenido.innerHTML = '<span class="text-muted">No hay menú publicado para hoy.</span>';
            }
        })
        .catch(() => {
            contenido.innerHTML = '<span class="text-danger">No se pudo cargar el menú de hoy.</span>';
        });
}

// =====================
// UTILIDADES
// =====================

function formatearFecha(fechaString) {
    const fecha = new Date(fechaString + 'T00:00:00');
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
}

function formatearFechaCorta(fechaString) {
    const fecha = new Date(fechaString + 'T00:00:00');
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
    return `${dia} ${mes}`;
}

function mostrarAlerta(mensaje, tipo) {
    const alertContainer = document.getElementById('alertContainer');
    const icono = tipo === 'success' ? 'check-circle' : 
                  tipo === 'danger' ? 'exclamation-circle' : 
                  tipo === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    alertContainer.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            <i class="fas fa-${icono}"></i> ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}
