let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let editingId = null;

const taskInput    = document.getElementById('taskInput');
const dateInput    = document.getElementById('dateInput');
const addBtn       = document.getElementById('add');
const deleteBtn    = document.getElementById('delete');
const taskBody     = document.getElementById('taskBody');
const emptyState   = document.getElementById('emptyState');
const statsText    = document.getElementById('statsText');
const filterBtns   = document.querySelectorAll('.filter-btn');
const filterToggle = document.getElementById('filterToggle');
const filterPanel  = document.getElementById('filterPanel');

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr + 'T00:00:00') < today;
}

filterToggle.addEventListener('click', () => {
    const isOpen = filterPanel.classList.toggle('open');
    filterToggle.setAttribute('aria-expanded', isOpen);
});

function addTask() {
    const text = taskInput.value.trim();
    if (!text) {
        taskInput.classList.add('shake');
        taskInput.focus();
        setTimeout(() => taskInput.classList.remove('shake'), 400);
        return;
    }

    tasks.unshift({
        id: generateId(),
        text,
        date: dateInput.value,
        done: false,
        createdAt: new Date().toISOString()
    });

    saveTasks();
    taskInput.value = '';
    dateInput.value = '';
    taskInput.focus();
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.done = !task.done;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) {
        row.classList.add('removing');
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
        }, 300);
    }
}

function deleteAllTasks() {
    if (!tasks.length) return;
    if (confirm('Hapus semua task? Aksi ini tidak bisa dibatalkan.')) {
        tasks = [];
        saveTasks();
        renderTasks();
    }
}

function startEdit(id) {
    editingId = id;
    renderTasks();
    const input = document.querySelector(`.edit-input[data-id="${id}"]`);
    if (input) { input.focus(); input.select(); }
}

function saveEdit(id) {
    const input  = document.querySelector(`.edit-input[data-id="${id}"]`);
    const dateEl = document.querySelector(`.edit-date[data-id="${id}"]`);
    const task   = tasks.find(t => t.id === id);
    if (task && input) {
        const newText = input.value.trim();
        if (newText) {
            task.text = newText;
            task.date = dateEl ? dateEl.value : task.date;
        }
    }
    editingId = null;
    saveTasks();
    renderTasks();
}

function cancelEdit() {
    editingId = null;
    renderTasks();
}

function getFilteredTasks() {
    if (currentFilter === 'pending') return tasks.filter(t => !t.done);
    if (currentFilter === 'done')    return tasks.filter(t => t.done);
    return tasks;
}

function updateStats() {
    const done = tasks.filter(t => t.done).length;
    statsText.textContent = `${done} / ${tasks.length} completed`;
}

function renderTasks() {
    const filtered = getFilteredTasks();
    taskBody.innerHTML = '';
    emptyState.style.display = filtered.length === 0 ? 'flex' : 'none';

    filtered.forEach((task, index) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', task.id);
        tr.style.animationDelay = `${index * 40}ms`;
        tr.classList.add('task-row');

        const overdue = !task.done && isOverdue(task.date);

        if (editingId === task.id) {
            tr.innerHTML = `
                <td>
                    <input class="edit-input" data-id="${task.id}" value="${task.text.replace(/"/g, '&quot;')}">
                </td>
                <td>
                    <input type="date" class="edit-date" data-id="${task.id}" value="${task.date || ''}">
                </td>
                <td>
                    <span class="badge ${task.done ? 'badge-done' : 'badge-pending'}">
                        ${task.done ? 'Done' : 'Pending'}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn-save"   onclick="saveEdit('${task.id}')">Save</button>
                    <button class="btn-cancel" onclick="cancelEdit()">Cancel</button>
                </td>
            `;
        } else {
            tr.innerHTML = `
                <td class="${task.done ? 'task-done' : ''}">${task.text}</td>
                <td class="${overdue ? 'overdue' : ''}">${overdue ? '⚠ ' : ''}${formatDate(task.date)}</td>
                <td>
                    <span class="badge ${task.done ? 'badge-done' : 'badge-pending'}">
                        ${task.done ? 'Done' : 'Pending'}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn-toggle" onclick="toggleTask('${task.id}')"
                        title="${task.done ? 'Mark pending' : 'Mark done'}">
                        ${task.done ? '↩' : '✓'}
                    </button>
                    <button class="btn-edit"   onclick="startEdit('${task.id}')"  title="Edit">✎</button>
                    <button class="btn-delete" onclick="deleteTask('${task.id}')"  title="Delete">✕</button>
                </td>
            `;
        }

        taskBody.appendChild(tr);
    });

    updateStats();
}

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
deleteBtn.addEventListener('click', deleteAllTasks);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

dateInput.min = new Date().toISOString().split('T')[0];
renderTasks();