let currentUser = null;
let nombreModal;
let preferenciaActual = null;

// Guardar la preferencia de registro
function guardarMiPreferenciaRegistro() {
    const tipoSeleccionado = document.querySelector('input[name="tipoRegistro"]:checked').value;
    const diasSeleccionados = [];
    
    if (tipoSeleccionado === 'personalizado') {
        // Obtener días seleccionados
        document.querySelectorAll('.form-check-input[id^="dia-"]:checked').forEach(checkbox => {
            diasSeleccionados.push(checkbox.value);
        });
        
        // Validar que hay al menos un día seleccionado
        if (diasSeleccionados.length === 0) {
            mostrarAlerta('Por favor selecciona al menos un día de la semana', 'warning');
            return;
        }
    }
    
    const btnGuardar = document.getElementById('btnGuardarPreferencia');
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    guardarPreferenciaRegistro(currentUser.uid, tipoSeleccionado, diasSeleccionados)
        .then(() => {
            mostrarAlerta('¡Preferencia de registro guardada exitosamente!', 'success');
            
            // Recargar preferencia para actualizar UI
            cargarPreferenciaRegistro();
            
            // Si seleccionó diario, mostrar la tarjeta de registro
            if (tipoSeleccionado === 'diario') {
                document.getElementById('tarjetaRegistroDiario').style.display = 'block';
                verificarRegistroHoy();
            } else {
                document.getElementById('tarjetaRegistroDiario').style.display = 'none';
            }
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
.catch((error) => console.error('Error de auth:', error));

function inicializarPagina() {
    cargarPreferenciaRegistro()
        .then((preferencia) => {
            renderizarDias(); 
            cargarHistorial();
            cargarMenuDeHoy();
            verificarRegistroHoy();

            if (preferencia && (preferencia.tipo === 'semanal' || preferencia.tipo === 'personalizado')) {
                esUnDiaFeriado(new Date().toISOString().split('T')[0])
                    .then(esFeriado => {
                        if (esFeriado) {
                            mostrarAlerta('Hoy es un día feriado, el registro automático está deshabilitado.', 'info');
                        } else {
                            registrarAsistenciaAutomatica(
                                currentUser.uid,
                                currentUser.displayName,
                                currentUser.email
                            ).then(resultado => {
                                if (resultado.exito) {
                                    mostrarAlerta(resultado.mensaje, 'success');
                                    cargarHistorial();
                                } else if (resultado.mensaje !== 'Ya está registrado para hoy' && resultado.mensaje !== 'No debe registrarse hoy según su configuración') {
                                    mostrarAlerta(resultado.mensaje, 'warning');
                                }
                            }).catch(error => {
                                console.error('Error en registro automático:', error);
                                mostrarAlerta('Error en el registro automático.', 'danger');
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error al verificar día feriado:', error);
                        mostrarAlerta('Error al verificar días feriados para registro automático.', 'danger');
                    });
            }
            configurarOpcionesRegistro();
        })
        .catch(error => {
            console.error('Error al inicializar la página:', error);
            mostrarAlerta('Error al cargar la configuración inicial.', 'danger');
        });
}

// PROTECCIÓN: Solo agrega el listener si el formulario existe
const perfilForm = document.getElementById('actualizarPerfilForm');
if (perfilForm) {
    perfilForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // ... tu lógica de actualizar nombre ...
    });
}



function renderizarDias() {
    const contenedor = document.getElementById('selectorDiasSemana');
    if (!contenedor) return; // Evita el error si el elemento no existe

    const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
    // Obtener el lunes de la semana actual
    const lunesActual = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1)));

    obtenerDiasRegistradosEstaSemana(currentUser.uid).then(registrados => {
        contenedor.innerHTML = '';
        
        for (let i = 0; i < 6; i++) {
            const fechaDia = new Date(lunesActual);
            fechaDia.setDate(lunesActual.getDate() + i);
            const fechaISO = fechaDia.toISOString().split('T')[0];
            const yaRegistrado = registrados.includes(fechaISO);

            contenedor.innerHTML += `
                <div class="col-6 col-md-4 col-lg-2 mb-3">
                    <div class="card h-100 ${yaRegistrado ? 'bg-light' : ''}">
                        <div class="card-body text-center p-2">
                            <label class="fw-bold d-block">${nombresDias[i]}</label>
                            <small class="text-muted d-block mb-2">${fechaISO.split('-').reverse().slice(0,2).join('/')}</small>
                            <input type="checkbox" class="form-check-input dia-checkbox" 
                                   value="${fechaISO}" 
                                   ${yaRegistrado ? 'checked disabled' : ''} 
                                   style="width: 20px; height: 20px;">
                            ${yaRegistrado ? '<div class="badge bg-success d-block mt-2">Registrado</div>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }
    }).catch(err => console.error("Error al cargar días:", err));
}

async function registrarSeleccionSemanal() {
    const checkboxes = document.querySelectorAll('.dia-checkbox:checked:not(:disabled)');
    const diasParaRegistrar = Array.from(checkboxes).map(cb => cb.value);

    if (diasParaRegistrar.length === 0) {
        mostrarAlerta("Selecciona al menos un día nuevo.", "warning");
        return;
    }

    try {
        await registrarAsistenciaMultiple(currentUser.uid, currentUser.displayName, currentUser.email, diasParaRegistrar);
        mostrarAlerta("¡Semana actualizada correctamente!", "success");
        renderizarDias();
        cargarHistorial();
    } catch (error) {
        console.error("Error:", error);
        mostrarAlerta("Hubo un error al guardar.", "danger");
    }
}
        // Función para guardar nombre de usuario
        function guardarNombreUsuario() {
            const nuevoNombre = document.getElementById('modalNombreUsuario').value.trim();
            const guardarBtn = document.getElementById('guardarNombreBtn');
            
            // Validar entrada
            if (!nuevoNombre) {
                // Mostrar mensaje de error en el modal
                const formControl = document.getElementById('modalNombreUsuario');
                formControl.classList.add('is-invalid');
                return;
            }
            
            // Cambiar estado del botón
            guardarBtn.disabled = true;
            guardarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            
            // Actualizar perfil
            actualizarNombreUsuario(nuevoNombre)
                .then((nombre) => {
                    // Actualizar nombre en la UI
                    document.getElementById('userName').textContent = nombre;
                    
                    // Cerrar modal
                    nombreModal.hide();
                    
                    // Mostrar mensaje de éxito
                    mostrarAlerta('¡Bienvenido(a), ' + nombre + '! Tu perfil ha sido configurado.', 'success');
                    
                    // Inicializar la página
                    inicializarPagina();
                })
                .catch((error) => {
                    console.error('Error al actualizar perfil:', error);
                    mostrarAlerta('Error al guardar el nombre. Por favor intenta nuevamente.', 'danger');
                    
                    // Restaurar botón
                    guardarBtn.disabled = false;
                    guardarBtn.innerHTML = '<i class="fas fa-save"></i> Guardar y continuar';
                });
        }
        
        // Configurar validación de formulario modal
        const nombreFormElement = document.getElementById('nombreForm');
        if (nombreFormElement) {
            nombreFormElement.addEventListener('submit', function(e) {
                e.preventDefault();
                guardarNombreUsuario();
            });
        }


        // Configurar los listeners para las opciones de registro
        function configurarOpcionesRegistro() {
            const radios = document.querySelectorAll('input[name="tipoRegistro"]');
            const diasContainer = document.getElementById('diasContainer');
            const opcionDiario = document.getElementById('opcionDiario');
            const opcionSemanal = document.getElementById('opcionSemanal');
            const opcionPersonalizado = document.getElementById('opcionPersonalizado');
            
            // Cambio de opción
            radios.forEach(radio => {
                radio.addEventListener('change', function() {
                    if (this.value === 'personalizado') {
                        diasContainer.style.display = 'block';
                    } else {
                        diasContainer.style.display = 'none';
                    }
                });
            });
            
            // Click en las tarjetas de opción
            opcionDiario.addEventListener('click', () => {
                document.getElementById('radioDiario').checked = true;
                diasContainer.style.display = 'none';
            });
            
            opcionSemanal.addEventListener('click', () => {
                document.getElementById('radioSemanal').checked = true;
                diasContainer.style.display = 'none';
            });
            
            opcionPersonalizado.addEventListener('click', () => {
                document.getElementById('radioPersonalizado').checked = true;
                diasContainer.style.display = 'block';
            });
        }

        // Cargar la preferencia actual del usuario
        function cargarPreferenciaRegistro() {
            return obtenerPreferenciaRegistro(currentUser.uid)
                .then((preferencia) => {
                    preferenciaActual = preferencia;
                    
                    // Actualizar UI con preferencia actual
                    if (preferencia) {
                        document.getElementById('preferenciaActual').textContent = 
                            obtenerDescripcionPreferencia(preferencia);
                        
                        // Seleccionar la opción actual
                        const radioActual = document.querySelector(
                            `input[name="tipoRegistro"][value="${preferencia.tipo}"]`
                        );
                        if (radioActual) {
                            radioActual.checked = true;
                            
                            // Si es personalizado, marcar los días seleccionados
                            if (preferencia.tipo === 'personalizado') {
                                document.getElementById('diasContainer').style.display = 'block';
                                document.querySelectorAll('.form-check-input[id^="dia-"]').forEach(checkbox => {
                                    checkbox.checked = preferencia.diasSeleccionados.includes(checkbox.value);
                                });
                            }
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


        // Verificar si ya registró asistencia hoy
        function verificarRegistroHoy() {
            verificarAsistenciaHoy(currentUser.uid)
                .then((yaRegistrado) => {
                    const btnRegistrar = document.getElementById('btnRegistrar');
                    const tipoSeleccionado = document.querySelector('input[name="tipoRegistro']:checked');
                    
                    // Solo mostrar si está en modo diario
                    if (tipoSeleccionado && tipoSeleccionado.value === 'diario') {
                        if (yaRegistrado) {
                            btnRegistrar.disabled = true;
                            btnRegistrar.innerHTML = '<i class="fas fa-check-double"></i> Ya registraste tu asistencia hoy';
                            btnRegistrar.classList.remove('btn-primary');
                            btnRegistrar.classList.add('btn-success');
                            
                            mostrarAlerta('Ya has registrado tu asistencia para hoy.', 'info');
                        }
                    }
                });
        }

        // Registrar asistencia
        function registrarMiAsistencia() {
            const btnRegistrar = document.getElementById('btnRegistrar');
            
            // Deshabilitar botón
            btnRegistrar.disabled = true;
            btnRegistrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
            
            // Registrar en la base de datos
            registrarAsistencia(
                currentUser.uid,
                currentUser.displayName,
                currentUser.email
            )
            .then(() => {
                // Éxito
                btnRegistrar.innerHTML = '<i class="fas fa-check-double"></i> Ya registraste tu asistencia hoy';
                btnRegistrar.classList.remove('btn-primary');
                btnRegistrar.classList.add('btn-success');
                
                mostrarAlerta('¡Asistencia registrada exitosamente!', 'success');
                
                // Recargar historial
                cargarHistorial();
            })
            .catch((error) => {
                console.error('Error al registrar:', error);
                mostrarAlerta('Error al registrar la asistencia. Por favor, intenta nuevamente.', 'danger');
                
                // Rehabilitar botón
                btnRegistrar.disabled = false;
                btnRegistrar.innerHTML = '<i class="fas fa-check-circle"></i> Registrar Asistencia';
            });
        }
        // Cargar historial de asistencias
        function cargarHistorial() {
            const loadingHistorial = document.getElementById('loadingHistorial');
            const historialContainer = document.getElementById('historialContainer');
            const emptyHistorial = document.getElementById('emptyHistorial');
            const historialBody = document.getElementById('historialBody');
            
            // Mostrar loader
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
                        
                        // Llenar tabla
                        historialBody.innerHTML = '';
                        asistencias.forEach((asistencia, index) => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${index + 1}</td>
                                <td>${formatearFecha(asistencia.fecha)}</td>
                                <td>${asistencia.hora}</td>
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

        // Función para formatear fecha
        function formatearFecha(fechaString) {
            const fecha = new Date(fechaString + 'T00:00:00');
            const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
            return fecha.toLocaleDateString('es-ES', opciones);
        }

        // Mostrar menú de hoy
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

        // Función para mostrar alertas
        function mostrarAlerta(mensaje, tipo) {
            const alertContainer = document.getElementById('alertContainer');
            const icono = tipo === 'success' ? 'check-circle' : tipo === 'danger' ? 'exclamation-circle' : 'info-circle';
            
            alertContainer.innerHTML = `
                <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                    <i class="fas fa-${icono}"></i> ${mensaje}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            
            // Auto-cerrar después de 5 segundos
            setTimeout(() => {
                alertContainer.innerHTML = '';
            }, 5000);
        }
        // Manejar actualización del perfil
document.getElementById('actualizarPerfilForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nuevoNombre = document.getElementById('modalNombreUsuario').value.trim();
    const btnSubmit = this.querySelector('button[type="submit"]');
    const btnTextOriginal = btnSubmit.innerHTML;
    
    // Validar entrada
    if (!nuevoNombre) {
        mostrarAlerta('Por favor ingresa tu nombre completo', 'warning');
        return;
    }
    
    // Cambiar estado del botón
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    
    // Actualizar perfil
    actualizarNombreUsuario(nuevoNombre)
        .then((nombre) => {
            // Actualizar nombre en la UI
            document.getElementById('userName').textContent = nombre;
            mostrarAlerta('¡Perfil actualizado correctamente!', 'success');
        })
        .catch((error) => {
            console.error('Error al actualizar perfil:', error);
            mostrarAlerta('Error al actualizar el perfil. Intenta nuevamente.', 'danger');
        })
        .finally(() => {
            // Restaurar botón
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = btnTextOriginal;
        });
});
// Función para inicializar la página una vez configurado el nombre


// Función para renderizar los días (basada en la actualización semanal)
