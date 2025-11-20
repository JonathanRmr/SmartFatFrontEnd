// Configuración de la API
const API_URL = 'http://localhost:3000/api';

// Variables globales
let allExercises = [];
let selectedExercises = [];

// Verificar autenticación al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    // Mostrar nombre del usuario
    document.getElementById('userName').textContent = usuario.nombre || 'Usuario';
    
    // Cargar ejercicios disponibles
    loadExercises();
});

// Cerrar sesión
function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    }
}

// Cargar todos los ejercicios
async function loadExercises() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('exercisesGrid');
    
    try {
        const response = await fetch(`${API_URL}/ejercicios`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }
        
        allExercises = await response.json();
        displayExercises(allExercises);
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `
            <div class="empty-state">
                <p>Error al cargar ejercicios. Verifica tu conexión.</p>
            </div>
        `;
    }
}

// Mostrar ejercicios en el grid
function displayExercises(exercises) {
    const container = document.getElementById('exercisesGrid');
    
    if (exercises.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No se encontraron ejercicios.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = exercises.map(exercise => {
        const isSelected = selectedExercises.some(e => e.id_ejercicio === exercise.id_ejercicio);
        return `
            <div class="exercise-item">
                <div class="exercise-info">
                    <h4>${exercise.nombre}</h4>
                    <p class="exercise-muscle">${exercise.grupo_muscular || 'Sin grupo'}</p>
                </div>
                <button 
                    class="btn-add-exercise" 
                    onclick="addExercise(${exercise.id_ejercicio})"
                    ${isSelected ? 'disabled' : ''}>
                    ${isSelected ? '✓ Agregado' : '+ Agregar'}
                </button>
            </div>
        `;
    }).join('');
}

// Filtrar ejercicios
function filterExercises() {
    const searchTerm = document.getElementById('searchExercise').value.toLowerCase();
    const muscleFilter = document.getElementById('muscleFilter').value;
    
    let filtered = allExercises;
    
    // Filtrar por texto de búsqueda
    if (searchTerm) {
        filtered = filtered.filter(exercise => 
            exercise.nombre.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtrar por grupo muscular
    if (muscleFilter) {
        filtered = filtered.filter(exercise => 
            exercise.grupo_muscular === muscleFilter
        );
    }
    
    displayExercises(filtered);
}

// Agregar ejercicio a la rutina
function addExercise(id_ejercicio) {
    const exercise = allExercises.find(e => e.id_ejercicio === id_ejercicio);
    if (!exercise) return;
    
    // Agregar con una serie por defecto
    selectedExercises.push({
        ...exercise,
        series: [
            { numero_serie: 1, repeticiones: 10, peso_usado: 0, descanso_segundos: 60 }
        ]
    });
    
    displaySelectedExercises();
    filterExercises(); // Actualizar el grid para mostrar el botón como agregado
}

// Mostrar ejercicios seleccionados
function displaySelectedExercises() {
    const container = document.getElementById('selectedExercises');
    
    if (selectedExercises.length === 0) {
        container.innerHTML = `
            <div class="empty-exercises">
                <p>No has agregado ejercicios aún. Selecciona ejercicios de la lista superior.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = selectedExercises.map((exercise, exerciseIndex) => `
        <div class="selected-exercise-card">
            <div class="exercise-card-header">
                <h4>${exercise.nombre}</h4>
                <button class="btn-remove-exercise" onclick="removeExercise(${exerciseIndex})">
                    🗑️ Eliminar
                </button>
            </div>
            <p class="exercise-muscle">${exercise.grupo_muscular || 'Sin grupo'}</p>
            
            <div class="series-container">
                <h5 style="margin-bottom: 10px;">Series:</h5>
                ${exercise.series.map((serie, serieIndex) => `
                    <div class="serie-item">
                        <span class="serie-number">Serie ${serie.numero_serie}</span>
                        <input 
                            type="number" 
                            class="serie-input" 
                            placeholder="Reps" 
                            value="${serie.repeticiones}"
                            min="1"
                            onchange="updateSerie(${exerciseIndex}, ${serieIndex}, 'repeticiones', this.value)">
                        <input 
                            type="number" 
                            class="serie-input" 
                            placeholder="Peso (kg)" 
                            value="${serie.peso_usado}"
                            step="0.5"
                            min="0"
                            onchange="updateSerie(${exerciseIndex}, ${serieIndex}, 'peso_usado', this.value)">
                        <input 
                            type="number" 
                            class="serie-input" 
                            placeholder="Descanso (seg)" 
                            value="${serie.descanso_segundos}"
                            min="0"
                            onchange="updateSerie(${exerciseIndex}, ${serieIndex}, 'descanso_segundos', this.value)">
                        ${exercise.series.length > 1 ? `
                            <button class="btn-remove-serie" onclick="removeSerie(${exerciseIndex}, ${serieIndex})">✕</button>
                        ` : ''}
                    </div>
                `).join('')}
                <button class="btn-add-serie" onclick="addSerie(${exerciseIndex})">+ Agregar Serie</button>
            </div>
        </div>
    `).join('');
}

// Eliminar ejercicio de la selección
function removeExercise(exerciseIndex) {
    selectedExercises.splice(exerciseIndex, 1);
    displaySelectedExercises();
    filterExercises(); // Actualizar el grid
}

// Agregar serie a un ejercicio
function addSerie(exerciseIndex) {
    const exercise = selectedExercises[exerciseIndex];
    const newSerieNumber = exercise.series.length + 1;
    
    exercise.series.push({
        numero_serie: newSerieNumber,
        repeticiones: 10,
        peso_usado: 0,
        descanso_segundos: 60
    });
    
    displaySelectedExercises();
}

// Eliminar serie de un ejercicio
function removeSerie(exerciseIndex, serieIndex) {
    selectedExercises[exerciseIndex].series.splice(serieIndex, 1);
    
    // Renumerar las series
    selectedExercises[exerciseIndex].series.forEach((serie, index) => {
        serie.numero_serie = index + 1;
    });
    
    displaySelectedExercises();
}

// Actualizar datos de una serie
function updateSerie(exerciseIndex, serieIndex, field, value) {
    selectedExercises[exerciseIndex].series[serieIndex][field] = parseFloat(value) || 0;
}

// Cancelar y volver al dashboard
function cancelRoutine() {
    if (selectedExercises.length > 0) {
        if (!confirm('¿Estás seguro? Se perderán todos los cambios.')) {
            return;
        }
    }
    window.location.href = 'dashboard.html';
}

// Guardar rutina
async function saveRoutine() {
    const nombre = document.getElementById('routineName').value.trim();
    const fecha = document.getElementById('routineDate').value || null;
    
    // Validaciones
    if (!nombre) {
        showMessage('Por favor ingresa un nombre para la rutina', 'error');
        return;
    }
    
    if (selectedExercises.length === 0) {
        showMessage('Debes agregar al menos un ejercicio a la rutina', 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        // 1. Crear la rutina
        const rutinaResponse = await fetch(`${API_URL}/rutinas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre, fecha })
        });
        
        if (!rutinaResponse.ok) {
            const data = await rutinaResponse.json();
            throw new Error(data.error || 'Error al crear la rutina');
        }
        
        const rutinaData = await rutinaResponse.json();
        const id_rutina = rutinaData.id_rutina;
        
        // 2. Agregar las series de cada ejercicio
        for (const exercise of selectedExercises) {
            for (const serie of exercise.series) {
                const serieResponse = await fetch(`${API_URL}/series`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        id_rutina: id_rutina,
                        id_ejercicio: exercise.id_ejercicio,
                        numero_serie: serie.numero_serie,
                        repeticiones: serie.repeticiones,
                        peso_usado: serie.peso_usado,
                        descanso_segundos: serie.descanso_segundos
                    })
                });
                
                if (!serieResponse.ok) {
                    console.error('Error al agregar serie:', await serieResponse.json());
                }
            }
        }
        
        showMessage('¡Rutina creada exitosamente!', 'success');
        
        // Redirigir al dashboard después de 1.5 segundos
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al guardar la rutina', 'error');
    }
}

// Mostrar mensaje
function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type} show`;
    
    setTimeout(() => {
        messageDiv.className = 'message';
    }, 5000);
}