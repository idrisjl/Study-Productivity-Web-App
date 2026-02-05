// ============================================
// THEME MANAGEMENT
// ============================================
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Load theme from localStorage
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'dark') {
    body.classList.add('dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
} else {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
}

// Toggle theme
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// ============================================
// NAVIGATION
// ============================================
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const viewId = item.dataset.view;
        
        // Update active nav item
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Update active view
        views.forEach(view => view.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        
        // Update dashboard when switching to it
        if (viewId === 'dashboard') {
            updateDashboard();
        }
    });
});

// ============================================
// POMODORO TIMER
// ============================================
const timerModes = {
    study: { duration: 25 * 60, label: 'Study Time', color: '#3b82f6' },
    short: { duration: 5 * 60, label: 'Short Break', color: '#10b981' },
    long: { duration: 15 * 60, label: 'Long Break', color: '#8b5cf6' }
};

let currentMode = 'study';
let timeLeft = timerModes[currentMode].duration;
let isRunning = false;
let timerInterval = null;
let sessionCount = 0;

// Load daily study time
let dailyStudyTime = (() => {
    const saved = localStorage.getItem('dailyStudyTime');
    if (saved) {
        const data = JSON.parse(saved);
        const today = new Date().toDateString();
        return data.date === today ? data.time : 0;
    }
    return 0;
})();

const timerDisplay = document.getElementById('timerDisplay');
const sessionDisplay = document.getElementById('sessionDisplay');
const timerProgress = document.getElementById('timerProgress');
const playPauseBtn = document.getElementById('playPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const modeButtons = document.querySelectorAll('.mode-btn');
const totalStudyTimeDisplay = document.getElementById('totalStudyTime');
const notificationSound = document.getElementById('notificationSound');

// Update timer display
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Update progress circle
    const progress = ((timerModes[currentMode].duration - timeLeft) / timerModes[currentMode].duration) * 704;
    timerProgress.style.strokeDashoffset = 704 - progress;
    
    // Update session
    sessionDisplay.textContent = `Session ${sessionCount + 1}`;
    
    // Update total study time display
    const hours = Math.floor(dailyStudyTime / 3600);
    const mins = Math.floor((dailyStudyTime % 3600) / 60);
    totalStudyTimeDisplay.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// Start/Pause timer
playPauseBtn.addEventListener('click', () => {
    isRunning = !isRunning;
    
    if (isRunning) {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playPauseBtn.classList.add('playing');
        
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                
                // Track study time
                if (currentMode === 'study') {
                    dailyStudyTime++;
                    localStorage.setItem('dailyStudyTime', JSON.stringify({
                        time: dailyStudyTime,
                        date: new Date().toDateString()
                    }));
                }
                
                updateTimerDisplay();
            } else {
                // Timer completed
                clearInterval(timerInterval);
                isRunning = false;
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                playPauseBtn.classList.remove('playing');
                
                // Play notification sound
                notificationSound.play();
                
                // Auto-switch to next session
                if (currentMode === 'study') {
                    sessionCount++;
                    currentMode = sessionCount % 4 === 0 ? 'long' : 'short';
                } else {
                    currentMode = 'study';
                }
                
                changeMode(currentMode);
            }
        }, 1000);
    } else {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        playPauseBtn.classList.remove('playing');
        clearInterval(timerInterval);
    }
});

// Reset timer
resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    isRunning = false;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    playPauseBtn.classList.remove('playing');
    timeLeft = timerModes[currentMode].duration;
    updateTimerDisplay();
});

// Change mode
function changeMode(mode) {
    currentMode = mode;
    timeLeft = timerModes[mode].duration;
    clearInterval(timerInterval);
    isRunning = false;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    playPauseBtn.classList.remove('playing');
    
    // Update mode buttons
    modeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    // Update progress color
    timerProgress.style.stroke = timerModes[mode].color;
    
    updateTimerDisplay();
}

modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        changeMode(btn.dataset.mode);
    });
});

// Initialize timer
updateTimerDisplay();

// ============================================
// NOTES MANAGEMENT
// ============================================
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let editingNoteId = null;

const addNoteBtn = document.getElementById('addNoteBtn');
const noteForm = document.getElementById('noteForm');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const cancelNoteBtn = document.getElementById('cancelNoteBtn');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const noteTags = document.getElementById('noteTags');
const notesGrid = document.getElementById('notesGrid');
const notesSearch = document.getElementById('notesSearch');
const notesEmpty = document.getElementById('notesEmpty');

// Show/hide note form
addNoteBtn.addEventListener('click', () => {
    noteForm.classList.toggle('hidden');
    if (!noteForm.classList.contains('hidden')) {
        noteTitle.focus();
    }
});

cancelNoteBtn.addEventListener('click', () => {
    noteForm.classList.add('hidden');
    clearNoteForm();
});

// Clear note form
function clearNoteForm() {
    noteTitle.value = '';
    noteContent.value = '';
    noteTags.value = '';
    editingNoteId = null;
    saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> Save';
}

// Save note
saveNoteBtn.addEventListener('click', () => {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    const tags = noteTags.value.split(',').map(t => t.trim()).filter(Boolean);
    
    if (!title) {
        alert('Please enter a note title');
        return;
    }
    
    if (editingNoteId) {
        // Update existing note
        const index = notes.findIndex(n => n.id === editingNoteId);
        notes[index] = {
            ...notes[index],
            title,
            content,
            tags,
            updatedAt: new Date().toISOString()
        };
    } else {
        // Create new note
        const newNote = {
            id: Date.now(),
            title,
            content,
            tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        notes.unshift(newNote);
    }
    
    localStorage.setItem('notes', JSON.stringify(notes));
    renderNotes();
    noteForm.classList.add('hidden');
    clearNoteForm();
});

// Render notes
function renderNotes(filter = '') {
    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(filter.toLowerCase()) ||
        note.content.toLowerCase().includes(filter.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
    );
    
    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = '';
        notesEmpty.classList.remove('hidden');
        notesEmpty.querySelector('p').textContent = filter 
            ? 'No notes found matching your search' 
            : 'No notes yet. Create your first note!';
    } else {
        notesEmpty.classList.add('hidden');
        notesGrid.innerHTML = filteredNotes.map(note => `
            <div class="note-card" data-id="${note.id}">
                <h3>${escapeHtml(note.title)}</h3>
                <p>${escapeHtml(note.content)}</p>
                <div class="note-tags">
                    ${note.tags.map(tag => `
                        <span class="tag">
                            <i class="fas fa-tag"></i>
                            ${escapeHtml(tag)}
                        </span>
                    `).join('')}
                </div>
                <div class="note-footer">
                    <span class="note-date">${new Date(note.updatedAt).toLocaleDateString()}</span>
                    <div class="note-actions">
                        <button class="icon-btn edit-note" data-id="${note.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn delete delete-note" data-id="${note.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        document.querySelectorAll('.edit-note').forEach(btn => {
            btn.addEventListener('click', () => editNote(parseInt(btn.dataset.id)));
        });
        
        document.querySelectorAll('.delete-note').forEach(btn => {
            btn.addEventListener('click', () => deleteNote(parseInt(btn.dataset.id)));
        });
    }
}

// Edit note
function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        editingNoteId = id;
        noteTitle.value = note.title;
        noteContent.value = note.content;
        noteTags.value = note.tags.join(', ');
        noteForm.classList.remove('hidden');
        saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> Update';
        noteTitle.focus();
    }
}

// Delete note
function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes(notesSearch.value);
    }
}

// Search notes
notesSearch.addEventListener('input', (e) => {
    renderNotes(e.target.value);
});

// Initialize notes
renderNotes();

// ============================================
// TASKS MANAGEMENT
// ============================================
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let draggedTaskIndex = null;

const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const tasksList = document.getElementById('tasksList');
const tasksSearch = document.getElementById('tasksSearch');
const tasksEmpty = document.getElementById('tasksEmpty');
const filterButtons = document.querySelectorAll('.filter-btn');
const activeTasksBadge = document.getElementById('activeTasksBadge');
const doneTasksBadge = document.getElementById('doneTasksBadge');

// Add task
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;
    
    const newTask = {
        id: Date.now(),
        text,
        completed: false,
        priority: 'medium',
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    taskInput.value = '';
    renderTasks();
}

// Render tasks
function renderTasks(searchFilter = '') {
    const filteredTasks = tasks.filter(task => {
        const matchesFilter = currentFilter === 'all' ||
            (currentFilter === 'active' && !task.completed) ||
            (currentFilter === 'completed' && task.completed);
        
        const matchesSearch = task.text.toLowerCase().includes(searchFilter.toLowerCase());
        
        return matchesFilter && matchesSearch;
    });
    
    // Update badges
    const activeTasks = tasks.filter(t => !t.completed).length;
    const doneTasks = tasks.filter(t => t.completed).length;
    activeTasksBadge.textContent = `${activeTasks} Active`;
    doneTasksBadge.textContent = `${doneTasks} Done`;
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '';
        tasksEmpty.classList.remove('hidden');
        tasksEmpty.querySelector('p').textContent = searchFilter 
            ? 'No tasks found matching your search' 
            : 'No tasks yet. Add your first task!';
    } else {
        tasksEmpty.classList.add('hidden');
        tasksList.innerHTML = filteredTasks.map((task, index) => `
            <div class="task-item priority-${task.priority} ${task.completed ? 'completed' : ''}" 
                 draggable="true" 
                 data-id="${task.id}"
                 data-index="${index}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <p class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</p>
                    <div class="priority-buttons">
                        <button class="priority-btn ${task.priority === 'low' ? 'active' : ''}" 
                                data-id="${task.id}" data-priority="low">Low</button>
                        <button class="priority-btn ${task.priority === 'medium' ? 'active' : ''}" 
                                data-id="${task.id}" data-priority="medium">Medium</button>
                        <button class="priority-btn ${task.priority === 'high' ? 'active' : ''}" 
                                data-id="${task.id}" data-priority="high">High</button>
                    </div>
                </div>
                <div class="task-actions">
                    <i class="fas fa-grip-vertical drag-handle"></i>
                    <button class="icon-btn delete delete-task" data-id="${task.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', () => toggleTask(parseInt(checkbox.dataset.id)));
        });
        
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setPriority(parseInt(btn.dataset.id), btn.dataset.priority);
            });
        });
        
        document.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', () => deleteTask(parseInt(btn.dataset.id)));
        });
        
        // Add drag and drop listeners
        document.querySelectorAll('.task-item').forEach((item, index) => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
        });
    }
}

// Toggle task completion
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks(tasksSearch.value);
    }
}

// Set task priority
function setPriority(id, priority) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.priority = priority;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks(tasksSearch.value);
    }
}

// Delete task
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks(tasksSearch.value);
    }
}

// Drag and drop functions
function handleDragStart(e) {
    draggedTaskIndex = parseInt(e.target.dataset.index);
    e.target.style.opacity = '0.4';
}

function handleDragOver(e) {
    e.preventDefault();
    const targetIndex = parseInt(e.currentTarget.dataset.index);
    
    if (draggedTaskIndex !== null && draggedTaskIndex !== targetIndex) {
        const draggedTask = tasks[draggedTaskIndex];
        tasks.splice(draggedTaskIndex, 1);
        tasks.splice(targetIndex, 0, draggedTask);
        draggedTaskIndex = targetIndex;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks(tasksSearch.value);
    }
}

function handleDrop(e) {
    e.preventDefault();
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
    draggedTaskIndex = null;
}

// Filter tasks
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTasks(tasksSearch.value);
    });
});

// Search tasks
tasksSearch.addEventListener('input', (e) => {
    renderTasks(e.target.value);
});

// Initialize tasks
renderTasks();

// ============================================
// DASHBOARD
// ============================================
function updateDashboard() {
    // Study time
    const hours = Math.floor(dailyStudyTime / 3600);
    const mins = Math.floor((dailyStudyTime % 3600) / 60);
    document.getElementById('dashStudyTime').textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    
    // Tasks
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    document.getElementById('dashTasksCompleted').textContent = `${completedTasks}/${totalTasks}`;
    
    // Completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    document.getElementById('dashCompletionRate').textContent = `${completionRate}%`;
    
    // Productivity score
    const productivityScore = Math.min(100, Math.round(
        (completionRate * 0.5) + (Math.min(dailyStudyTime / 3600, 4) * 12.5)
    ));
    document.getElementById('dashProductivityScore').textContent = productivityScore;
    
    // Update insights
    const insights = [];
    
    if (dailyStudyTime >= 3600) {
        insights.push({
            color: 'blue',
            text: '🎉 Great job! You\'ve studied for over an hour today!'
        });
    } else {
        insights.push({
            color: 'blue',
            text: '💪 Keep going! Try to reach at least 1 hour of focused study time.'
        });
    }
    
    if (completionRate >= 70) {
        insights.push({
            color: 'green',
            text: '⭐ Excellent task completion rate! You\'re on fire!'
        });
    } else {
        insights.push({
            color: 'green',
            text: '📝 Complete more tasks to boost your productivity score.'
        });
    }
    
    if (productivityScore >= 80) {
        insights.push({
            color: 'purple',
            text: '🏆 Outstanding productivity! Keep up the amazing work!'
        });
    } else {
        insights.push({
            color: 'purple',
            text: '🎯 You\'re making progress! Stay consistent to improve your score.'
        });
    }
    
    document.getElementById('insightsList').innerHTML = insights.map(insight => `
        <div class="insight-item">
            <div class="insight-dot ${insight.color}"></div>
            <p>${insight.text}</p>
        </div>
    `).join('');
}

// Update dashboard on load
updateDashboard();

// Update dashboard every minute for study time
setInterval(() => {
    if (document.getElementById('dashboard').classList.contains('active')) {
        updateDashboard();
    }
}, 60000);

// ============================================
// UTILITY FUNCTIONS
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
