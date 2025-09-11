// Registro de Almuerzo - Empaques Múltiples
// JavaScript Module

class AlmuerzoApp {
  constructor() {
    this.initializeSupabase();
    this.initializeVariables();
    this.initializeEventListeners();
    this.loadFromLocalStorage();
    this.initializeDepartments();
  }

  initializeSupabase() {
    this.SUPABASE_URL = 'https://hvhroguawvsztdhvkxpv.supabase.co';
    this.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aHJvZ3Vhd3ZzenRkaHZreHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyNTcsImV4cCI6MjA3MzE3NDI1N30.D_UdP-7b43JUweoYuzfT2OOKy2g2VvigKuJeeeUgVgg';
    this.client = supabase.createClient(this.SUPABASE_URL, this.SUPABASE_KEY);
  }

  initializeVariables() {
    // Estado de sesión
    this.empleadoActual = null;
    this.localRecords = [];

    // Elementos DOM
    this.authDiv = document.getElementById('auth');
    this.mainDiv = document.getElementById('main');
    this.loginBtn = document.getElementById('login');
    this.registerBtn = document.getElementById('register');
    this.logoutBtn = document.querySelector('.logout');
    this.usuarioInput = document.getElementById('usuario');
    this.passInput = document.getElementById('password');
    this.authError = document.getElementById('auth-error');
    this.bienvenidaDiv = document.getElementById('bienvenida');
    this.form = document.getElementById('almuerzo-form');
    this.nombreInput = document.getElementById('nombre');
    this.horaInput = document.getElementById('hora');
    this.departamentoSelect = document.getElementById('departamento');
    this.comentariosTextarea = document.getElementById('comentarios');
    this.formError = document.getElementById('form-error');
    this.formSuccess = document.getElementById('form-success');
    this.recordsTableBody = document.getElementById('records-table-body');
    this.searchInput = document.getElementById('search');
    this.filterDate = document.getElementById('filter-date');
    this.filterDepartment = document.getElementById('filter-department');
    this.exportBtn = document.getElementById('export-csv');
    this.clearFiltersBtn = document.getElementById('clear-filters');
    this.loadingOverlay = document.getElementById('loading-overlay');

    // Stats elements
    this.totalRecordsSpan = document.getElementById('total-records');
    this.thisMonthSpan = document.getElementById('this-month');
    this.thisWeekSpan = document.getElementById('this-week');

    // Departamentos predefinidos
    this.departamentos = [
      'Administración',
      'Producción',
      'Calidad',
      'Ventas',
      'Recursos Humanos',
      'Mantenimiento',
      'Logística',
      'Contabilidad'
    ];

    // Lista de empleados validados (se puede expandir)
    this.empleadosValidados = [];
  }

  initializeDepartments() {
    this.departamentos.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept;
      option.textContent = dept;
      this.departamentoSelect.appendChild(option);
      
      // También agregar al filtro
      const filterOption = document.createElement('option');
      filterOption.value = dept;
      filterOption.textContent = dept;
      this.filterDepartment.appendChild(filterOption);
    });
  }

  initializeEventListeners() {
    this.loginBtn.onclick = () => this.handleLogin();
    this.registerBtn.onclick = () => this.handleRegister();
    this.logoutBtn.onclick = () => this.handleLogout();
    this.form.onsubmit = (e) => this.handleSubmitLunch(e);
    this.exportBtn.onclick = () => this.exportToCSV();
    this.clearFiltersBtn.onclick = () => this.clearFilters();
    
    // Filtros en tiempo real
    this.searchInput.oninput = () => this.applyFilters();
    this.filterDate.onchange = () => this.applyFilters();
    this.filterDepartment.onchange = () => this.applyFilters();

    // Validación en tiempo real
    this.nombreInput.oninput = () => this.validateName();
    this.horaInput.onchange = () => this.validateTime();

    // Auto-save en local storage
    this.nombreInput.oninput = () => this.saveToLocalStorage();
    this.horaInput.onchange = () => this.saveToLocalStorage();
    this.departamentoSelect.onchange = () => this.saveToLocalStorage();
    this.comentariosTextarea.oninput = () => this.saveToLocalStorage();
  }

  // Utilidades de fecha
  hoyISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  fechaNDiasAtras(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  formatearFecha(fecha) {
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getCurrentTime() {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  }

  // Manejo de loading
  showLoading() {
    this.loadingOverlay.classList.remove('hidden');
  }

  hideLoading() {
    this.loadingOverlay.classList.add('hidden');
  }

  // Sistema de notificaciones
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Local Storage
  saveToLocalStorage() {
    const formData = {
      nombre: this.nombreInput.value,
      hora: this.horaInput.value,
      departamento: this.departamentoSelect.value,
      comentarios: this.comentariosTextarea.value,
      timestamp: Date.now()
    };
    localStorage.setItem('almuerzo_draft', JSON.stringify(formData));
  }

  loadFromLocalStorage() {
    const draft = localStorage.getItem('almuerzo_draft');
    if (draft) {
      const data = JSON.parse(draft);
      // Solo cargar si es del mismo día
      const today = new Date().toDateString();
      const draftDate = new Date(data.timestamp).toDateString();
      
      if (today === draftDate && this.nombreInput) {
        this.nombreInput.value = data.nombre || '';
        this.horaInput.value = data.hora || '';
        this.departamentoSelect.value = data.departamento || '';
        this.comentariosTextarea.value = data.comentarios || '';
      }
    }

    // Cargar registros locales
    const localRecords = localStorage.getItem('almuerzo_records');
    if (localRecords) {
      this.localRecords = JSON.parse(localRecords);
    }
  }

  saveRecordToLocalStorage(record) {
    this.localRecords.unshift(record);
    // Mantener solo los últimos 100 registros
    if (this.localRecords.length > 100) {
      this.localRecords = this.localRecords.slice(0, 100);
    }
    localStorage.setItem('almuerzo_records', JSON.stringify(this.localRecords));
  }

  clearDraft() {
    localStorage.removeItem('almuerzo_draft');
  }

  // Validaciones
  validateName() {
    const name = this.nombreInput.value.trim();
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,50}$/;
    
    if (name && !nameRegex.test(name)) {
      this.nombreInput.setCustomValidity('El nombre debe contener solo letras y espacios (2-50 caracteres)');
      return false;
    } else {
      this.nombreInput.setCustomValidity('');
      return true;
    }
  }

  validateTime() {
    const time = this.horaInput.value;
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      if (hours < 11 || hours > 15) {
        this.horaInput.setCustomValidity('La hora del almuerzo debe estar entre 11:00 AM y 3:00 PM');
        return false;
      }
    }
    this.horaInput.setCustomValidity('');
    return true;
  }

  validateEmployee(nombre) {
    // Si hay lista de empleados validados, verificar
    if (this.empleadosValidados.length > 0) {
      return this.empleadosValidados.some(emp => 
        emp.toLowerCase().includes(nombre.toLowerCase()) ||
        nombre.toLowerCase().includes(emp.toLowerCase())
      );
    }
    return true; // Si no hay lista, permitir cualquier nombre
  }

  // Autenticación
  async handleLogin() {
    this.authError.textContent = '';
    this.showLoading();
    
    try {
      const usuario = this.usuarioInput.value.trim();
      const password = this.passInput.value;
      
      if (!usuario || !password) {
        this.authError.textContent = "Ingresa usuario y contraseña.";
        return;
      }
      
      const { data, error } = await this.client
        .from('empleados')
        .select('*')
        .eq('usuario', usuario);
        
      if (error || data.length === 0) {
        this.authError.textContent = "Usuario o contraseña incorrectos.";
        return;
      }
      
      const empleado = data[0];
      const match = bcrypt.compareSync(password, empleado.password_hash);
      
      if (!match) {
        this.authError.textContent = "Usuario o contraseña incorrectos.";
        return;
      }
      
      this.empleadoActual = empleado;
      await this.mostrarPrincipal(empleado);
      this.showNotification(`¡Bienvenido, ${empleado.nombre}!`, 'success');
      
    } catch (error) {
      this.authError.textContent = "Error de conexión. Intenta nuevamente.";
      console.error('Login error:', error);
    } finally {
      this.hideLoading();
    }
  }

  async handleRegister() {
    this.authError.textContent = '';
    this.showLoading();
    
    try {
      const usuario = this.usuarioInput.value.trim();
      const password = this.passInput.value;
      
      if (!usuario || !password) {
        this.authError.textContent = "Completa usuario y contraseña.";
        return;
      }
      
      if (password.length < 6) {
        this.authError.textContent = "La contraseña debe tener al menos 6 caracteres.";
        return;
      }
      
      // Verificar si existe usuario
      const { data: existe } = await this.client
        .from('empleados')
        .select('*')
        .eq('usuario', usuario);
        
      if (existe.length > 0) {
        this.authError.textContent = "Usuario ya existe.";
        return;
      }
      
      // Generar hash
      const hash = bcrypt.hashSync(password, 10);
      const { error } = await this.client
        .from('empleados')
        .insert([{ usuario, password_hash: hash, nombre: usuario }]);
        
      if (error) {
        this.authError.textContent = error.message;
      } else {
        this.authError.textContent = "¡Registro exitoso! Ingresa tu usuario y contraseña.";
        this.showNotification("Registro exitoso", 'success');
      }
      
    } catch (error) {
      this.authError.textContent = "Error de conexión. Intenta nuevamente.";
      console.error('Register error:', error);
    } finally {
      this.hideLoading();
    }
  }

  handleLogout() {
    this.empleadoActual = null;
    this.clearDraft();
    location.reload();
  }

  async mostrarPrincipal(empleado) {
    this.authDiv.classList.add('hidden');
    this.mainDiv.classList.remove('hidden');
    this.logoutBtn.classList.remove('hidden');
    this.bienvenidaDiv.textContent = `¡Bienvenido, ${empleado.nombre}!`;
    
    // Establecer hora actual por defecto
    this.horaInput.value = this.getCurrentTime();
    
    await this.cargarRegistros();
    this.updateStats();
  }

  // Envío de formulario
  async handleSubmitLunch(e) {
    e.preventDefault();
    this.formError.textContent = '';
    this.formSuccess.classList.add('hidden');
    
    if (!this.empleadoActual) {
      this.formError.textContent = "Debes iniciar sesión.";
      return;
    }

    const nombre = this.nombreInput.value.trim();
    const hora = this.horaInput.value;
    const departamento = this.departamentoSelect.value;
    const comentarios = this.comentariosTextarea.value.trim();

    // Validaciones
    if (!nombre) {
      this.formError.textContent = "Ingresa tu nombre.";
      return;
    }

    if (!this.validateName()) {
      this.formError.textContent = "Formato de nombre inválido.";
      return;
    }

    if (!hora) {
      this.formError.textContent = "Selecciona la hora del almuerzo.";
      return;
    }

    if (!this.validateTime()) {
      this.formError.textContent = "La hora debe estar entre 11:00 AM y 3:00 PM.";
      return;
    }

    if (!departamento) {
      this.formError.textContent = "Selecciona tu departamento.";
      return;
    }

    if (!this.validateEmployee(nombre)) {
      this.formError.textContent = "Empleado no encontrado en la lista validada.";
      return;
    }

    this.showLoading();

    try {
      // Verificar duplicados
      const { data: yaAnotado, error: errorDup } = await this.client
        .from('almuerzos')
        .select('*')
        .eq('empleado_id', this.empleadoActual.id)
        .eq('fecha', this.hoyISO());

      if (errorDup) {
        this.formError.textContent = errorDup.message;
        return;
      }

      if (yaAnotado.length > 0) {
        this.formError.textContent = "Ya registraste el almuerzo hoy.";
        return;
      }

      // Insertar registro
      const registro = {
        empleado_id: this.empleadoActual.id,
        nombre,
        fecha: this.hoyISO(),
        hora,
        departamento,
        comentarios
      };

      const { error } = await this.client
        .from('almuerzos')
        .insert([registro]);

      if (error) {
        this.formError.textContent = error.message;
      } else {
        // Limpiar formulario
        this.nombreInput.value = "";
        this.horaInput.value = this.getCurrentTime();
        this.departamentoSelect.value = "";
        this.comentariosTextarea.value = "";
        
        this.formSuccess.textContent = "¡Registro exitoso!";
        this.formSuccess.classList.remove('hidden');
        
        // Guardar en local storage
        this.saveRecordToLocalStorage({
          ...registro,
          id: Date.now(),
          fecha_formateada: this.formatearFecha(registro.fecha)
        });
        
        this.clearDraft();
        await this.cargarRegistros();
        this.updateStats();
        this.showNotification("¡Almuerzo registrado exitosamente!", 'success');
      }
    } catch (error) {
      this.formError.textContent = "Error de conexión. El registro se guardó localmente.";
      
      // Guardar en local storage como respaldo
      this.saveRecordToLocalStorage({
        empleado_id: this.empleadoActual.id,
        nombre,
        fecha: this.hoyISO(),
        fecha_formateada: this.formatearFecha(this.hoyISO()),
        hora,
        departamento,
        comentarios,
        id: Date.now(),
        local_only: true
      });
      
      this.showNotification("Guardado localmente - sincronizará cuando haya conexión", 'warning');
      console.error('Submit error:', error);
    } finally {
      this.hideLoading();
    }
  }

  // Carga de registros
  async cargarRegistros() {
    try {
      const { data: hist, error } = await this.client
        .from('almuerzos')
        .select('*')
        .eq('empleado_id', this.empleadoActual.id)
        .gte('fecha', this.fechaNDiasAtras(90))
        .order('fecha', { ascending: false });

      if (!error && hist) {
        // Combinar con registros locales
        const allRecords = [...hist, ...this.localRecords.filter(r => r.local_only)]
          .map(record => ({
            ...record,
            fecha_formateada: this.formatearFecha(record.fecha)
          }))
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        this.renderRecords(allRecords);
      } else {
        // Solo mostrar registros locales
        this.renderRecords(this.localRecords);
      }
    } catch (error) {
      console.error('Error loading records:', error);
      this.renderRecords(this.localRecords);
    }
  }

  renderRecords(records) {
    if (!this.recordsTableBody) return;

    if (records.length === 0) {
      this.recordsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="no-records">No hay registros para mostrar</td>
        </tr>
      `;
      return;
    }

    this.recordsTableBody.innerHTML = records.map(record => `
      <tr ${record.local_only ? 'style="background-color: var(--warning-bg);" title="Registro local - pendiente de sincronización"' : ''}>
        <td>${record.fecha_formateada}</td>
        <td>${record.hora || 'N/A'}</td>
        <td>${record.departamento || 'N/A'}</td>
        <td>${record.nombre}</td>
        <td>${record.comentarios || ''}</td>
        <td>
          ${record.local_only ? '<span style="color: var(--warning-color); font-size: 0.8em;">📱 Local</span>' : '<span style="color: var(--verde); font-size: 0.8em;">☁️ Sincronizado</span>'}
        </td>
      </tr>
    `).join('');

    this.allRecords = records;
    this.applyFilters();
  }

  // Filtros y búsqueda
  applyFilters() {
    if (!this.allRecords) return;

    const searchTerm = this.searchInput.value.toLowerCase();
    const dateFilter = this.filterDate.value;
    const departmentFilter = this.filterDepartment.value;

    const filtered = this.allRecords.filter(record => {
      const matchesSearch = !searchTerm || 
        record.nombre.toLowerCase().includes(searchTerm) ||
        (record.comentarios && record.comentarios.toLowerCase().includes(searchTerm));
      
      const matchesDate = !dateFilter || record.fecha === dateFilter;
      
      const matchesDepartment = !departmentFilter || record.departamento === departmentFilter;

      return matchesSearch && matchesDate && matchesDepartment;
    });

    this.renderFilteredRecords(filtered);
  }

  renderFilteredRecords(records) {
    if (!this.recordsTableBody) return;

    if (records.length === 0) {
      this.recordsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="no-records">No se encontraron registros con los filtros aplicados</td>
        </tr>
      `;
      return;
    }

    this.recordsTableBody.innerHTML = records.map(record => `
      <tr ${record.local_only ? 'style="background-color: var(--warning-bg);" title="Registro local - pendiente de sincronización"' : ''}>
        <td>${record.fecha_formateada}</td>
        <td>${record.hora || 'N/A'}</td>
        <td>${record.departamento || 'N/A'}</td>
        <td>${record.nombre}</td>
        <td>${record.comentarios || ''}</td>
        <td>
          ${record.local_only ? '<span style="color: var(--warning-color); font-size: 0.8em;">📱 Local</span>' : '<span style="color: var(--verde); font-size: 0.8em;">☁️ Sincronizado</span>'}
        </td>
      </tr>
    `).join('');
  }

  clearFilters() {
    this.searchInput.value = '';
    this.filterDate.value = '';
    this.filterDepartment.value = '';
    this.applyFilters();
  }

  // Estadísticas
  updateStats() {
    if (!this.allRecords) return;

    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const total = this.allRecords.length;
    
    const monthRecords = this.allRecords.filter(record => {
      const recordDate = new Date(record.fecha);
      return recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear;
    }).length;

    const weekRecords = this.allRecords.filter(record => {
      const recordDate = new Date(record.fecha);
      return recordDate >= startOfWeek;
    }).length;

    if (this.totalRecordsSpan) this.totalRecordsSpan.textContent = total;
    if (this.thisMonthSpan) this.thisMonthSpan.textContent = monthRecords;
    if (this.thisWeekSpan) this.thisWeekSpan.textContent = weekRecords;
  }

  // Exportar a CSV
  exportToCSV() {
    if (!this.allRecords || this.allRecords.length === 0) {
      this.showNotification("No hay registros para exportar", 'warning');
      return;
    }

    const headers = ['Fecha', 'Hora', 'Departamento', 'Nombre', 'Comentarios', 'Estado'];
    const csvContent = [
      headers.join(','),
      ...this.allRecords.map(record => [
        record.fecha,
        record.hora || '',
        record.departamento || '',
        `"${record.nombre}"`,
        `"${record.comentarios || ''}"`,
        record.local_only ? 'Local' : 'Sincronizado'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `almuerzos_${this.empleadoActual.nombre}_${this.hoyISO()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showNotification("Archivo CSV descargado exitosamente", 'success');
    } else {
      this.showNotification("Tu navegador no soporta la descarga de archivos", 'error');
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.almuerzoApp = new AlmuerzoApp();
});