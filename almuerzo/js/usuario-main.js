// usuario-main.js - Lógica principal de la página de usuario (VERSIÓN FINAL - LUNES A VIERNES)

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
        // BORRAR ESTA LÍNEA: renderizarDiasSemana();  <-- ¡Esta es la culpable!
    });
    
    opcionMensual.addEventListener('click', () => {
        document.getElementById('radioMensual').checked = true;
        actualizarVisibilidadTarjetas('mensual');
        actualizarSeleccionVisual();
        // BORRAR ESTA LÍNEA: renderizarCalendarioMes(); <-- ¡Esta también duplica el mes!
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
// SELECTORES DE DÍAS (SOLO LUNES A VIERNES)
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
// RENDERIZADO DE SEMANA (SOLO LUNES A VIERNES)
// =====================

function renderizarDiasSemana() {
    const contenedor = document.getElementById('selectorDiasSemana');
    const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    
    // Mostrar indicador de carga
    contenedor.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div></div>';
    
    const diasSemana = obtenerDiasLaboralesSemana(); // Devuelve 5 días: Lun-Vie
    
    // Obtener días ya registrados y procesar todo
    obtenerDiasRegistradosEstaSemana(currentUser.uid)
        .then(registrados => {
            contenedor.innerHTML = '';
            
            // Procesar cada día de forma asíncrona
            const promesas = diasSemana.map((fecha, index) => {
                return esUnDiaFeriado(fecha).then(esFeriado => {
                    const yaRegistrado = registrados.includes(fecha);
                    const fechaObj = new Date(fecha + 'T00:00:00');
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                    const esPasado = fechaObj < hoy;
                    
                    return { fecha, index, esFeriado, yaRegistrado, esPasado };
                });
            });
            
            // Esperar todas las promesas y renderizar
            return Promise.all(promesas);
        })
        .then(dias => {
            dias.forEach(({ fecha, index, esFeriado, yaRegistrado, esPasado }) => {
                // --- NUEVO LÓGICA DE HORA ---
                const hoyStr = new Date().toISOString().split('T')[0];
                const esHoy = fecha === hoyStr;
                const horaActual = new Date().getHours();
                const esTarde = esHoy && horaActual >= 10;
                // ---------------------------

                const col = document.createElement('div');
                col.className = 'col-12 col-sm-6 col-md-4 col-lg-2 mb-3';
                
                const card = document.createElement('div');
                card.className = 'card h-100';
                
                let colorClass = '';
                let contenido = '';
                
                if (esFeriado) {
                    // ... (código existente de feriado) ...
                    colorClass = 'bg-warning text-dark';
                    contenido = `
                        <div class="fw-bold mb-2">${nombresDias[index]}</div>
                        <div class="small mb-2">${formatearFechaCorta(fecha)}</div>
                        <div class="badge bg-danger w-100"><i class="fas fa-calendar-times"></i> Feriado</div>
                    `;
                } else if (yaRegistrado) {
                    // ... (código existente de registrado) ...
                    colorClass = 'bg-success text-white';
                    contenido = `
                        <div class="fw-bold mb-2">${nombresDias[index]}</div>
                        <div class="small mb-2">${formatearFechaCorta(fecha)}</div>
                        <div class="badge bg-light text-success w-100"><i class="fas fa-check"></i> Registrado</div>
                    `;
                } else if (esPasado || esTarde) { // <-- CAMBIO AQUÍ: Agregamos "|| esTarde"
                    colorClass = 'bg-light text-muted';
                    let textoBadge = esPasado ? 'Pasado' : 'Cerrado (10am)'; // Mensaje diferente si es por hora
                    contenido = `
                        <div class="fw-bold mb-2">${nombresDias[index]}</div>
                        <div class="small mb-2">${formatearFechaCorta(fecha)}</div>
                        <div class="badge bg-secondary w-100">${textoBadge}</div>
                    `;
                } else {
                    // ... (código existente para días disponibles, ej. MAÑANA) ...
                    contenido = `
                        <div class="fw-bold mb-2">${nombresDias[index]}</div>
                        <div class="small mb-2">${formatearFechaCorta(fecha)}</div>
                        <div class="form-check d-flex justify-content-center">
                            <input type="checkbox" class="form-check-input dia-semana-checkbox" 
                                   value="${fecha}" style="width: 24px; height: 24px; cursor: pointer;">
                        </div>
                    `;
                }
                
                card.className += ' ' + colorClass;
                card.innerHTML = `<div class="card-body text-center p-3">${contenido}</div>`;
                col.appendChild(card);
                contenedor.appendChild(col);
            });
        })
        .catch(err => {
            console.error("Error al cargar días de la semana:", err);
            contenedor.innerHTML = '<div class="alert alert-danger">Error al cargar días de la semana</div>';
        });
}

// =====================
// RENDERIZADO DE MES (SOLO LUNES A VIERNES)
// =====================

function renderizarCalendarioMes() {
    const contenedor = document.getElementById('calendarioMes');
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();
    
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasMes = ultimoDia.getDate();
    
    // Mostrar indicador de carga
    contenedor.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Cargando calendario...</p></div>';
    
    // Limpiar selección previa
    diasSeleccionadosMes.clear();
    
    // Obtener días ya registrados
    obtenerAsistenciasUsuario(currentUser.uid)
        .then(asistencias => {
            const registrados = new Set(asistencias.map(a => a.fecha));
            
            // Limpiar y preparar contenedor
            contenedor.innerHTML = '';
            contenedor.className = 'calendario-mes';
            
            // Cabecera con días de la semana
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            diasSemana.forEach(dia => {
                const header = document.createElement('div');
                header.className = 'text-center fw-bold small p-2 bg-light border';
                header.textContent = dia;
                contenedor.appendChild(header);
            });
            
            // Espacios en blanco antes del primer día
            const primerDiaSemana = primerDia.getDay();
            for (let i = 0; i < primerDiaSemana; i++) {
                const vacio = document.createElement('div');
                vacio.className = 'border';
                contenedor.appendChild(vacio);
            }
            
            // Array de promesas para verificar feriados
            const promesasDias = [];
            
            // Días del mes
            for (let dia = 1; dia <= diasMes; dia++) {
                const fecha = new Date(año, mes, dia);
                const fechaString = fecha.toISOString().split('T')[0];
                const diaSemana = fecha.getDay();
                const esDomingo = diaSemana === 0;
                const esSabado = diaSemana === 6;
                const fechaActual = new Date();
                fechaActual.setHours(0, 0, 0, 0);
                const esPasado = fecha < fechaActual;
                const yaRegistrado = registrados.has(fechaString);
                
                // --- NUEVO LÓGICA DE HORA ---
                const hoyStr = new Date().toISOString().split('T')[0];
                const esHoy = fechaString === hoyStr;
                const horaActual = new Date().getHours();
                const esTarde = esHoy && horaActual >= 10;
                // ---------------------------------------------------------------------

                const diaDiv = document.createElement('div');
                diaDiv.className = 'dia-mes';
                diaDiv.textContent = dia;
                
                // --- ESTRUCTURA DE BLOQUEO CORREGIDA ---
                if (esDomingo) {
                    diaDiv.classList.add('domingo', 'disabled');
                    diaDiv.title = 'Domingo - Cerrado';
                } else if (esSabado) {
                    diaDiv.classList.add('sabado', 'disabled');
                    diaDiv.title = 'Sábado - Cerrado';
                } else if (esTarde) { // <--- AQUÍ ESTÁ EL CAMBIO CLAVE
                    diaDiv.classList.add('disabled');
                    diaDiv.title = 'Registro cerrado por hoy (10:00 AM)';
                    diaDiv.style.backgroundColor = '#e9ecef';
                    diaDiv.style.pointerEvents = 'none'; // <--- ESTO BLOQUEA EL CLIC FÍSICAMENTE
                } else if (yaRegistrado) {
                    diaDiv.classList.add('registrado');
                    diaDiv.title = 'Ya registrado';
                } else if (esPasado) {
                    diaDiv.classList.add('disabled');
                    diaDiv.title = 'Fecha pasada';
                } else {
                    // AQUÍ SOLO ENTRA SI NO SE CUMPLIÓ NINGUNA DE LAS ANTERIORES
                    // (Es decir, solo entra si NO es tarde, NO es feriado, NO es domingo, etc.)
                    
                    // Verificar si es feriado de forma asíncrona
                    const promesa = esUnDiaFeriado(fechaString).then(esFeriado => {
                        if (esFeriado) {
                            diaDiv.classList.add('disabled');
                            diaDiv.style.backgroundColor = '#ffc107';
                            diaDiv.style.color = '#000';
                            diaDiv.title = 'Día feriado';
                        } else {
                            // Día disponible para selección
                            diaDiv.dataset.fecha = fechaString;
                            diaDiv.style.cursor = 'pointer';
                            diaDiv.addEventListener('click', function() {
                                // ... lógica de selección ...
                                if (diasSeleccionadosMes.has(fechaString)) {
                                    diasSeleccionadosMes.delete(fechaString);
                                    this.classList.remove('selected');
                                } else {
                                    diasSeleccionadosMes.add(fechaString);
                                    this.classList.add('selected');
                                }
                            });
                        }
                    });
                    promesasDias.push(promesa);
                }
                
                contenedor.appendChild(diaDiv);

            }
            
            // Esperar a que todas las verificaciones de feriados terminen
            return Promise.all(promesasDias);
        })
        .catch(error => {
            console.error('Error al renderizar calendario:', error);
            contenedor.innerHTML = '<div class="alert alert-danger">Error al cargar el calendario</div>';
        });
}

// =====================
// GUARDAR PREFERENCIA (SOLO LUNES A VIERNES)
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
        // Guardar como números de día de semana (1=Lunes, 5=Viernes)
        const mapaDias = {
            'lunes': 1,
            'martes': 2,
            'miercoles': 3,
            'jueves': 4,
            'viernes': 5
        };
        
        diasSeleccionados = Array.from(checkboxes)
            .map(cb => mapaDias[cb.value])
            .filter(Boolean);
        
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
                        // Mapeo inverso de números a nombres de días
                        const mapaInverso = {
                            1: 'lunes',
                            2: 'martes',
                            3: 'miercoles',
                            4: 'jueves',
                            5: 'viernes'
                        };
                        
                        preferencia.diasSeleccionados.forEach(numeroDia => {
                            const nombreDia = mapaInverso[numeroDia];
                            if (nombreDia) {
                                const checkbox = document.getElementById(`dia-${nombreDia}`);
                                if (checkbox) {
                                    checkbox.checked = true;
                                    checkbox.closest('.dia-selector').classList.add('selected');
                                }
                            }
                        });
                    }
                }
                
                // Si tiene preferencia automática, ejecutar registro automático
                if (preferencia.tipo !== 'diario') {
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
    // --- NUEVO: VALIDACIÓN ---
    if (new Date().getHours() >= 10) {
        console.log("Registro automático omitido: pasaron las 10:00 AM");
        return; 
    }
    // -------------------------

    const hoy = new Date().toISOString().split('T')[0];
    
    esUnDiaFeriado(hoy)
        .then(esFeriado => {
            if (esFeriado) {
                mostrarAlerta('Hoy es un día feriado, el registro automático está deshabilitado.', 'info');
                return Promise.resolve(null);
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
            const mensajeAyuda = document.getElementById('mensajeAyudaRegistro');
            const horaActual = new Date().getHours();
            
            // CASO 1: Ya registrado
            if (yaRegistrado) {
                btnRegistrar.disabled = true;
                btnRegistrar.innerHTML = '<i class="fas fa-check-double"></i> Ya registraste tu asistencia hoy';
                btnRegistrar.className = 'btn btn-success btn-lg btn-registrar'; // Resetea clases y pone verde
                mostrarAlerta('Ya has registrado tu asistencia para hoy.', 'info');
                
                if(mensajeAyuda) {
                    mensajeAyuda.innerHTML = '<i class="fas fa-check"></i> Asistencia confirmada para hoy.';
                    mensajeAyuda.className = 'text-success small mt-3';
                }
            } 
            // CASO 2: DEMASIADO TEMPRANO (Antes de las 7:00 AM)
            else if (horaActual < 7) {
                btnRegistrar.disabled = true;
                btnRegistrar.innerHTML = '<i class="fas fa-coffee"></i> Aún no abre (7:00 AM)';
                btnRegistrar.className = 'btn btn-secondary btn-lg btn-registrar'; // Gris
                
                if(mensajeAyuda) {
                    mensajeAyuda.innerHTML = '<i class="fas fa-clock"></i> El registro abre a las 7:00 AM.';
                    mensajeAyuda.className = 'text-warning small mt-3'; // Amarillo advertencia
                }
            }
            // CASO 3: DEMASIADO TARDE (Después de las 10:00 AM)
            else if (horaActual >= 10) {
                btnRegistrar.disabled = true;
                btnRegistrar.innerHTML = '<i class="fas fa-store-slash"></i> Registro cerrado (10:00 AM)';
                btnRegistrar.className = 'btn btn-secondary btn-lg btn-registrar'; // Gris
                mostrarAlerta('El registro diario cierra a las 10:00 AM.', 'warning');
                
                if(mensajeAyuda) {
                    mensajeAyuda.innerHTML = '<i class="fas fa-exclamation-circle"></i> El registro estuvo abierto de 7:00 AM a 10:00 AM.';
                    mensajeAyuda.className = 'text-danger small mt-3'; // Rojo error
                }
            }
            // CASO 4: ABIERTO (Entre 7:00 AM y 9:59 AM)
            else {
                btnRegistrar.disabled = false;
                btnRegistrar.innerHTML = '<i class="fas fa-check-circle"></i> Registrar Asistencia';
                btnRegistrar.className = 'btn btn-primary btn-lg btn-registrar'; // Verde principal
                
                if(mensajeAyuda) {
                    mensajeAyuda.innerHTML = '<i class="fas fa-info-circle"></i> Solo puedes registrarte una vez por día';
                    mensajeAyuda.className = 'text-muted small mt-3';
                }
            }
        });
}

function registrarMiAsistencia() {

  // --- VALIDACIÓN DE HORARIO REAL (7-10) ---
    const hora = new Date().getHours();
    
    if (hora < 7) {
        mostrarAlerta('¡Es muy temprano! El registro comienza a las 7:00 AM.', 'warning');
        return; // Detiene el proceso
    }
    
    if (hora >= 10) {
        mostrarAlerta('El registro para el día de hoy cerró a las 10:00 AM.', 'warning');
        // Actualizamos visualmente por si acaso
        const btn = document.getElementById('btnRegistrar');
        if(btn) {
            btn.innerHTML = '<i class="fas fa-store-slash"></i> Registro cerrado';
            btn.disabled = true;
            btn.classList.add('btn-secondary');
        }
        return; // Detiene el proceso
    }
    // -----------------------------------------

    const btnRegistrar = document.getElementById('btnRegistrar');
    
    btnRegistrar.disabled = true;
    btnRegistrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    
    // ... (El resto de la función sigue igual: registrarAsistencia(...) .then(...) etc.)
    registrarAsistencia(currentUser.uid, currentUser.displayName, currentUser.email)
        .then(() => {
            // ... código de éxito ...
            verificarRegistroHoy(); // Recargamos para actualizar estado
        })
        .catch((error) => {
             // ... código de error ...
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
    const originalHTML = btn.innerHTML;
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
                mostrarAlerta("Hubo un error al guardar: " + error.message, "danger");
            }
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
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
    const originalHTML = btn.innerHTML;
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
                mostrarAlerta("Hubo un error al guardar: " + error.message, "danger");
            }
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
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
