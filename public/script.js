// ⚠️ Substitua pela URL real do seu back-end no Render
const API = 'https://back-tarefas-lhy0.onrender.com';

let tasks = [];
let filter = 'all';

// Chama a rota /v1 e exibe a mensagem no topo
async function chamarAPI() {
  try {
    const resposta = await fetch(`${API}/v1`);
    const dados = await resposta.json();
    const el = document.getElementById('api-status');
    if (el) el.textContent = `${dados.message} — ${dados.chamada_em}`;
  } catch (e) {
    const el = document.getElementById('api-status');
    if (el) el.textContent = 'Não foi possível conectar à API.';
  }
}

async function fetchTasks() {
  try {
    const res = await fetch(`${API}/tasks`);
    tasks = await res.json();
    render();
  } catch (e) {
    document.getElementById('task-list').innerHTML =
      `<div class="empty"><div class="icon">⚠️</div><p>Não foi possível conectar à API.<br>Verifique a URL do back-end.</p></div>`;
  }
}

async function addTask() {
  const input = document.getElementById('new-task');
  const title = input.value.trim();
  if (!title) return;
  try {
    const res = await fetch(`${API}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    const task = await res.json();
    tasks.unshift(task);
    input.value = '';
    render();
    toast('Tarefa criada!', 'success');
  } catch { toast('Erro ao criar tarefa.', 'error'); }
}

async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  try {
    const res = await fetch(`${API}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    });
    const updated = await res.json();
    Object.assign(task, updated);
    render();
  } catch { toast('Erro ao atualizar.', 'error'); }
}

async function deleteTask(id) {
  try {
    await fetch(`${API}/tasks/${id}`, { method: 'DELETE' });
    tasks = tasks.filter(t => t.id !== id);
    render();
    toast('Tarefa removida.', 'success');
  } catch { toast('Erro ao remover.', 'error'); }
}

function setFilter(f, btn) {
  filter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function render() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.completed).length;
  const pending = total - done;

  document.getElementById('stat-total').textContent   = total;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-done').textContent    = done;

  const filtered = tasks.filter(t =>
    filter === 'all' ? true :
    filter === 'done' ? t.completed : !t.completed
  );

  const list = document.getElementById('task-list');
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty"><div class="icon">✨</div><p>Nenhuma tarefa aqui.</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(t => `
    <div class="task-item ${t.completed ? 'done' : ''}">
      <div class="check" onclick="toggleTask(${t.id})"></div>
      <span class="task-title">${escHtml(t.title)}</span>
      <span class="task-date">${fmtDate(t.createdAt)}</span>
      <button class="btn-del" onclick="deleteTask(${t.id})" title="Remover">✕</button>
    </div>
  `).join('');
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

let toastTimer;
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('new-task').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });
  chamarAPI();
  fetchTasks();
});
