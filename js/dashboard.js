/**
 * Dashboard JavaScript for Lunch Registration System
 * Empaques Múltiples SRL
 */

class LunchDashboard {
    constructor() {
        this.apiBase = 'api/';
        this.token = localStorage.getItem('lunch_token');
        this.currentPage = 1;
        this.currentFilters = {};
        this.user = null;
        
        if (!this.token) {
            window.location.href = 'login.html';
            return;
        }
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadUserInfo();
            await this.loadDashboardData();
            await this.loadDepartments();
            await this.loadEmployees();
            this.setupEventListeners();
            this.setDefaultDates();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showError('Error al cargar el dashboard');
        }
    }
    
    async makeRequest(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };
        
        const response = await fetch(this.apiBase + endpoint, {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('lunch_token');
            window.location.href = 'login.html';
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error en la petición');
        }
        
        return data;
    }
    
    async loadUserInfo() {
        // For now, we'll decode the JWT token client-side to get user info
        // In production, this should be validated server-side
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            this.user = payload;
            document.getElementById('user-name').textContent = payload.username;
        } catch (error) {
            localStorage.removeItem('lunch_token');
            window.location.href = 'login.html';
        }
    }
    
    async loadDashboardData() {
        try {
            // Load statistics
            await this.loadStatistics();
            
            // Load records
            await this.loadRecords();
            
            // Load charts
            await this.loadCharts();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
    
    async loadStatistics() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const monthStart = new Date();
            monthStart.setDate(1);
            
            // Today's count
            const todayData = await this.makeRequest(`lunch/records?date=${today}&limit=1000`);
            document.getElementById('today-count').textContent = todayData.pagination.total_items;
            
            // Week count
            const weekData = await this.makeRequest(`lunch/records?date_from=${weekStart.toISOString().split('T')[0]}&limit=1000`);
            document.getElementById('week-count').textContent = weekData.pagination.total_items;
            
            // Month count
            const monthData = await this.makeRequest(`lunch/records?date_from=${monthStart.toISOString().split('T')[0]}&limit=1000`);
            document.getElementById('month-count').textContent = monthData.pagination.total_items;
            
            // Active users (this would need a separate endpoint)
            document.getElementById('active-users').textContent = '0'; // Placeholder
            
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }
    
    async loadRecords(page = 1) {
        try {
            const params = new URLSearchParams({
                page: page,
                limit: 20,
                ...this.currentFilters
            });
            
            const data = await this.makeRequest(`lunch/records?${params}`);
            
            this.renderRecordsTable(data.data);
            this.updatePagination(data.pagination);
            
            document.getElementById('records-count').textContent = 
                `${data.pagination.total_items} registro${data.pagination.total_items !== 1 ? 's' : ''}`;
                
        } catch (error) {
            console.error('Error loading records:', error);
            this.showError('Error al cargar los registros');
        }
    }
    
    renderRecordsTable(records) {
        const tbody = document.getElementById('records-tbody');
        
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">No hay registros para mostrar</td></tr>';
            return;
        }
        
        tbody.innerHTML = records.map(record => `
            <tr>
                <td>${this.formatDate(record.date)}</td>
                <td>${record.user_name}</td>
                <td>${record.department_name || 'N/A'}</td>
                <td>${record.time || 'N/A'}</td>
                <td>${record.created_by_name}</td>
                <td>
                    ${this.canEditRecord() ? `<button class="btn btn-secondary" onclick="dashboard.editRecord(${record.id})"><i class="fas fa-edit"></i></button>` : ''}
                    ${this.canDeleteRecord() ? `<button class="btn btn-danger" onclick="dashboard.deleteRecord(${record.id})"><i class="fas fa-trash"></i></button>` : ''}
                </td>
            </tr>
        `).join('');
    }
    
    updatePagination(pagination) {
        const info = document.getElementById('pagination-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        info.textContent = `Página ${pagination.current_page} de ${pagination.total_pages}`;
        
        prevBtn.disabled = !pagination.has_prev;
        nextBtn.disabled = !pagination.has_next;
        
        this.currentPage = pagination.current_page;
    }
    
    async loadDepartments() {
        try {
            const data = await this.makeRequest('departments/departments.php');
            const departments = data.data || [];
            
            const select = document.getElementById('department-filter');
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading departments:', error);
            // Fallback to mock data
            const departments = [
                { id: 1, name: 'Administración' },
                { id: 2, name: 'Recursos Humanos' },
                { id: 3, name: 'Recepción' },
                { id: 4, name: 'Producción' },
                { id: 5, name: 'Ventas' }
            ];
            
            const select = document.getElementById('department-filter');
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.name;
                select.appendChild(option);
            });
        }
    }
    
    async loadEmployees() {
        try {
            const data = await this.makeRequest('users/users.php');
            const employees = data.data || [];
            
            const select = document.getElementById('employee-select');
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = emp.full_name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading employees:', error);
            // Fallback to mock data
            const employees = [
                { id: 1, full_name: 'Juan Pérez' },
                { id: 2, full_name: 'María García' },
                { id: 3, full_name: 'Carlos López' }
            ];
            
            const select = document.getElementById('employee-select');
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = emp.full_name;
                select.appendChild(option);
            });
        }
    }
    
    async loadCharts() {
        try {
            await this.loadDailyChart();
            await this.loadDepartmentChart();
        } catch (error) {
            console.error('Error loading charts:', error);
        }
    }
    
    async loadDailyChart() {
        // Mock data for daily chart
        const ctx = document.getElementById('daily-chart').getContext('2d');
        
        const days = [];
        const counts = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('es-ES', { weekday: 'short' }));
            counts.push(Math.floor(Math.random() * 50) + 10); // Mock data
        }
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Almuerzos',
                    data: counts,
                    borderColor: '#116835',
                    backgroundColor: 'rgba(17, 104, 53, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    async loadDepartmentChart() {
        // Mock data for department chart
        const ctx = document.getElementById('department-chart').getContext('2d');
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Administración', 'RRHH', 'Producción', 'Ventas', 'Otros'],
                datasets: [{
                    data: [15, 8, 25, 12, 7],
                    backgroundColor: [
                        '#116835',
                        '#159e53',
                        '#20b765',
                        '#2dd077',
                        '#3ae989'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    setupEventListeners() {
        // Set today as default date for lunch registration
        document.getElementById('lunch-date').value = new Date().toISOString().split('T')[0];
        
        // Close modal when clicking outside
        document.getElementById('register-modal').addEventListener('click', (e) => {
            if (e.target.id === 'register-modal') {
                this.hideRegisterModal();
            }
        });
    }
    
    setDefaultDates() {
        const today = new Date();
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        
        document.getElementById('date-from').value = weekStart.toISOString().split('T')[0];
        document.getElementById('date-to').value = today.toISOString().split('T')[0];
    }
    
    applyFilters() {
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;
        const department = document.getElementById('department-filter').value;
        
        this.currentFilters = {};
        
        if (dateFrom) this.currentFilters.date_from = dateFrom;
        if (dateTo) this.currentFilters.date_to = dateTo;
        if (department) this.currentFilters.department_id = department;
        
        this.currentPage = 1;
        this.loadRecords(1);
    }
    
    changePage(direction) {
        const newPage = this.currentPage + direction;
        if (newPage >= 1) {
            this.loadRecords(newPage);
        }
    }
    
    showRegisterModal() {
        document.getElementById('register-modal').classList.remove('hidden');
        document.getElementById('modal-error').classList.add('hidden');
    }
    
    hideRegisterModal() {
        document.getElementById('register-modal').classList.add('hidden');
        // Clear form
        document.getElementById('employee-select').value = '';
        document.getElementById('lunch-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('lunch-time').value = '';
        document.getElementById('lunch-comments').value = '';
    }
    
    async registerLunch() {
        const employeeId = document.getElementById('employee-select').value;
        const date = document.getElementById('lunch-date').value;
        const time = document.getElementById('lunch-time').value;
        const comments = document.getElementById('lunch-comments').value;
        
        if (!employeeId || !date) {
            this.showModalError('Empleado y fecha son requeridos');
            return;
        }
        
        try {
            const data = {
                user_id: parseInt(employeeId),
                date: date,
                time: time || null,
                comments: comments || null
            };
            
            await this.makeRequest('lunch/records', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.hideRegisterModal();
            this.showSuccess('Almuerzo registrado exitosamente');
            this.loadRecords(this.currentPage);
            this.loadStatistics();
            
        } catch (error) {
            this.showModalError(error.message);
        }
    }
    
    async exportData() {
        try {
            const params = new URLSearchParams(this.currentFilters);
            params.append('format', 'csv');
            
            // Create a temporary link to download the file
            const link = document.createElement('a');
            link.href = `${this.apiBase}export/export.php?${params}`;
            link.download = `registros_almuerzo_${new Date().toISOString().split('T')[0]}.csv`;
            
            // Add authorization header by creating a form and submitting it
            const form = document.createElement('form');
            form.method = 'GET';
            form.action = link.href;
            form.style.display = 'none';
            
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
            
            this.showSuccess('Descarga iniciada. El archivo se guardará en tu carpeta de descargas.');
        } catch (error) {
            this.showError('Error al iniciar la exportación: ' + error.message);
        }
    }
    
    async editRecord(id) {
        // This would open an edit modal
        console.log('Edit record', id);
    }
    
    async deleteRecord(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) {
            return;
        }
        
        try {
            await this.makeRequest(`lunch/records?id=${id}`, { method: 'DELETE' });
            this.showSuccess('Registro eliminado exitosamente');
            this.loadRecords(this.currentPage);
            this.loadStatistics();
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    logout() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            this.makeRequest('auth/logout', { method: 'POST' }).catch(() => {});
            localStorage.removeItem('lunch_token');
            window.location.href = 'login.html';
        }
    }
    
    // Utility methods
    canEditRecord() {
        return this.user && this.user.permissions && this.user.permissions.edit_all_records;
    }
    
    canDeleteRecord() {
        return this.user && this.user.permissions && this.user.permissions.delete_records;
    }
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES');
    }
    
    showError(message) {
        // Create a temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.zIndex = '9999';
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    
    showSuccess(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        successDiv.style.position = 'fixed';
        successDiv.style.top = '20px';
        successDiv.style.right = '20px';
        successDiv.style.zIndex = '9999';
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }
    
    showModalError(message) {
        const errorDiv = document.getElementById('modal-error');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

// Global functions for HTML onclick handlers
let dashboard;

function showRegisterModal() {
    dashboard.showRegisterModal();
}

function hideRegisterModal() {
    dashboard.hideRegisterModal();
}

function registerLunch() {
    dashboard.registerLunch();
}

function applyFilters() {
    dashboard.applyFilters();
}

function changePage(direction) {
    dashboard.changePage(direction);
}

function exportData() {
    dashboard.exportData();
}

function logout() {
    dashboard.logout();
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new LunchDashboard();
});