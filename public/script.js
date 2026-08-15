/* ============================================================
   BACKEND WIRING
   Targeting: http://localhost:5000

   Auth:
   - POST /auth/register  → { username, email, password } → { token }
   - POST /auth/login     → { email, password }          → { token }

   Todos:
   - GET    /todos/       → { tasks: [{ id, title, status, user_id }] }
   - POST   /todos/       → { title: "..." }
   - PUT    /todos/:id    → { status: 1 } or { title: "...", status: 1 }
   - DELETE /todos/:id
   ============================================================ */

const BASE_URL = 'http://localhost:5000';
const SESSION_KEY = 'pl.session';

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const esc = s => s.replace(/[&<>"']/g, c => ({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#39;'
}[c]));

const DB = {
  get(k, f){
    try{
      return JSON.parse(localStorage.getItem(k)) ?? f;
    }catch{
      return f;
    }
  },
  set(k, v){
    localStorage.setItem(k, JSON.stringify(v));
  }
};

/* ---------- Session ---------- */
function getSession(){
  return DB.get(SESSION_KEY, null); // { token, user }
}

function setSession(token, user){
  DB.set(SESSION_KEY, { token, user });
}

function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}

function decodeJwt(token){
  try{
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g,'+').replace(/_/g,'/'));
    return JSON.parse(decodeURIComponent(json));
  }catch{
    return null;
  }
}

/* ---------- Fetch wrapper ---------- */
async function apiFetch(url, options = {}){
  const session = getSession();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Your .http file uses raw token:
  // Authorization: eyJhbGci...
  if (session?.token){
    const cleanToken = session.token.replace(/^Bearer\s+/i, '');
    headers['Authorization'] = cleanToken;
  }

  let res;

  try{
    res = await fetch(BASE_URL + url, { ...options, headers });
  }catch(err){
    throw new Error('Network error — is the backend running at ' + BASE_URL + ' ?');
  }

  if (res.status === 401 || res.status === 403){
    clearSession();
    show('authScreen');
    throw new Error(
      res.status === 401
        ? 'Session expired. Please sign in again.'
        : 'Access denied.'
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok){
    const msg = data.error || data.message || `Server error (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

/* ---------- Auth API ---------- */
const api = {
  async register(username, email, password){
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });

    setSession(data.token, { username, email });

    return {
      name: username,
      email
    };
  },

  async login(email, password){
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    const payload = decodeJwt(data.token);

    const username =
      payload?.username ||
      payload?.name ||
      email.split('@')[0];

    setSession(data.token, { username, email });

    return {
      name: username,
      email
    };
  }
};

let mode = 'login';
let session = null;
let todos = [];
let filter = 'all';

/* ---------- Helpers ---------- */
function findTodo(id){
  return todos.find(t => String(t.id) === String(id));
}

async function fetchTodos(){
  const data = await apiFetch('/todos/');

  const tasks = Array.isArray(data)
    ? data
    : data.tasks || [];

  return tasks.map(t => ({
    id: String(t.id),
    text: t.title ?? t.text ?? '',
    done: Number(t.status ?? t.done ?? 0) === 1,
    prio: t.prio || 'med',
    at: t.created_at
      ? new Date(t.created_at).getTime()
      : Date.now()
  }));
}

async function loadTodos(){
  try{
    todos = await fetchTodos();
  }catch(err){
    toast('Failed to load tasks: ' + err.message, { type: 'err' });
    todos = [];
  }
}

/* ---------- Screens ---------- */
function show(id){
  $$('.screen').forEach(s => s.hidden = s.id !== id);

  const el = document.getElementById(id);
  el.classList.remove('enter');
  void el.offsetWidth;
  el.classList.add('enter');
}

function showApp(user){
  session = user;

  $('#userName').textContent = user.name;
  $('#helloName').textContent = user.name.split(' ')[0];
  $('#avatar').textContent = user.name[0].toUpperCase();

  $('#today').textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  loadTodos().then(() => {
    render();
    show('appScreen');
  });
}

/* ---------- Auth form ---------- */
function setMode(m){
  mode = m;

  $('#tabLogin').classList.toggle('active', m === 'login');
  $('#tabRegister').classList.toggle('active', m === 'register');

  $('#nameField').hidden = m === 'login';

  $('#authSubmit').textContent =
    m === 'login'
      ? 'Sign in →'
      : 'Create account →';

  $('#authSubmit').disabled = false;

  $('#switchHint').innerHTML =
    m === 'login'
      ? 'New here? <a id="switchLink">Create an account</a>'
      : 'Already registered? <a id="switchLink">Sign in</a>';

  $('#switchLink').onclick = () =>
    setMode(m === 'login' ? 'register' : 'login');

  $('#authErr').textContent = '';
}

$('#tabLogin').onclick = () => setMode('login');
$('#tabRegister').onclick = () => setMode('register');

setMode('login');

$('#authForm').addEventListener('submit', async e => {
  e.preventDefault();

  const name  = $('#name').value.trim();
  const email = $('#email').value.trim().toLowerCase();
  const pass  = $('#pass').value;

  const btn = $('#authSubmit');
  const err = $('#authErr');

  err.textContent = '';
  btn.disabled = true;

  try{
    if (mode === 'register' && !name){
      throw Error('Please enter your name.');
    }

    if (!/^\S+@\S+\.\S+$/.test(email)){
      throw Error('That email doesn\u2019t look right.');
    }

    if (pass.length < 6){
      throw Error('Password needs at least 6 characters.');
    }

    const user =
      mode === 'register'
        ? await api.register(name, email, pass)
        : await api.login(email, pass);

    toast(
      mode === 'register'
        ? `Welcome aboard, ${user.name}! 🎉`
        : `Good to see you, ${user.name} 👋`
    );

    showApp(user);

  }catch(ex){
    err.textContent = ex.message;
    btn.disabled = false;

    const c = $('#authCard');
    c.classList.remove('shake');
    void c.offsetWidth;
    c.classList.add('shake');
  }
});

$('#logoutBtn').onclick = () => {
  clearSession();
  $('#authForm').reset();
  setMode('login');
  show('authScreen');
  toast('Logged out. The list will wait for you.');
};

/* ---------- CREATE ---------- */
$('#composer').addEventListener('submit', async e => {
  e.preventDefault();

  const inp = $('#todoInput');
  const text = inp.value.trim();

  if (!text){
    inp.classList.remove('err-empty');
    void inp.offsetWidth;
    inp.classList.add('err-empty');
    return;
  }

  const tempId = 'tmp-' + Date.now();

  const newTodo = {
    id: tempId,
    text,
    done: false,
    prio: 'med',
    at: Date.now()
  };

  todos.unshift(newTodo);

  if (filter === 'done'){
    filter = 'all';
  }

  render();

  inp.value = '';
  inp.focus();

  try{
    const data = await apiFetch('/todos/', {
      method: 'POST',
      body: JSON.stringify({ title: text })
    });

    const created =
      data?.task ||
      data?.todo ||
      (data && data.id != null ? data : null);

    // If backend returns the created task, use its real ID.
    if (created && created.id != null){
      const t = findTodo(tempId);

      if (t){
        t.id = String(created.id);
        t.text = created.title ?? created.text ?? t.text;
        t.done = Number(created.status ?? created.done ?? 0) === 1;
      }
    }else{
      // If backend does not return the created ID,
      // fetch the list again to get real IDs.
      try{
        todos = await fetchTodos();
      }catch(refreshErr){
        toast('Task saved, but could not refresh the list.', {
          type: 'err'
        });
      }
    }

    render();

  }catch(err){
    todos = todos.filter(t => t.id !== tempId);
    render();

    toast('Task could not be saved: ' + err.message, {
      type: 'err',
      dur: 5000
    });
  }
});

/* ---------- UPDATE / DELETE ---------- */
$('#list').addEventListener('click', async e => {
  const li = e.target.closest('li');
  if (!li) return;

  const t = findTodo(li.dataset.id);
  if (!t) return;

  /* Toggle done */
  if (e.target.closest('.check')){
    const prevDone = t.done;

    t.done = !t.done;
    render();

    try{
      await apiFetch(`/todos/${encodeURIComponent(t.id)}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: t.done ? 1 : 0
        })
      });

    }catch(err){
      t.done = prevDone;
      render();

      toast('Update failed: ' + err.message, {
        type: 'err',
        dur: 4000
      });
    }

    return;
  }

  /* Delete */
  if (e.target.closest('.del')){
    const i = todos.findIndex(x => String(x.id) === String(t.id));
    const deletedTodo = { ...t };

    todos.splice(i, 1);
    render();

    toast('Task deleted.', {
      action: 'Undo',
      dur: 5000,
      onAction(){
        const exists = findTodo(deletedTodo.id);
        if (!exists){
          todos.splice(Math.min(i, todos.length), 0, deletedTodo);
          render();
        }
      }
    });

    try{
      await apiFetch(`/todos/${encodeURIComponent(t.id)}`, {
        method: 'DELETE'
      });

    }catch(err){
      const exists = findTodo(deletedTodo.id);

      if (!exists){
        todos.splice(Math.min(i, todos.length), 0, deletedTodo);
        render();
      }

      toast('Delete failed on server: ' + err.message, {
        type: 'err',
        dur: 5000
      });
    }
  }
});

/* ---------- UPDATE TEXT ---------- */
$('#list').addEventListener('dblclick', e => {
  const span = e.target.closest('.txt');
  if (!span) return;

  const li = span.closest('li');
  const t = findTodo(li.dataset.id);

  if (!t || li.querySelector('.edit')) return;

  const inp = document.createElement('input');

  inp.className = 'edit';
  inp.value = t.text;
  inp.maxLength = 140;

  span.replaceWith(inp);

  inp.focus();
  inp.select();

  let cancelled = false;

  inp.addEventListener('keydown', ev => {
    if (ev.key === 'Enter'){
      inp.blur();
    }

    if (ev.key === 'Escape'){
      cancelled = true;
      inp.blur();
    }
  });

  inp.addEventListener('blur', async () => {
    if (cancelled){
      render();
      return;
    }

    const v = inp.value.trim();

    if (!v || v === t.text){
      render();
      return;
    }

    const prevText = t.text;

    t.text = v;
    render();

    try{
      await apiFetch(`/todos/${encodeURIComponent(t.id)}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: v,
          status: t.done ? 1 : 0
        })
      });

    }catch(err){
      t.text = prevText;
      render();

      toast('Edit failed: ' + err.message, {
        type: 'err',
        dur: 4000
      });
    }
  });
});

/* ---------- Filters ---------- */
$$('.fbtn').forEach(b => {
  b.onclick = () => {
    filter = b.dataset.f;

    $$('.fbtn').forEach(x =>
      x.classList.toggle('active', x === b)
    );

    render();
  };
});

/* ---------- Render ---------- */
function render(){
  const doneC = todos.filter(t => t.done).length;

  $('#totalNum').textContent = String(todos.length).padStart(2, '0');
  $('#doneNum').textContent = String(doneC).padStart(2, '0');

  $('#cAll').textContent = todos.length;
  $('#cActive').textContent = todos.length - doneC;
  $('#cDone').textContent = doneC;

  $('#progFill').style.width =
    todos.length
      ? (doneC / todos.length * 100) + '%'
      : '0%';

  const view = todos.filter(t =>
    filter === 'all'
      ? true
      : filter === 'done'
        ? t.done
        : !t.done
  );

  $('#list').innerHTML = view.map(t => `
    <li
      class="todo card ${t.done ? 'done' : ''}"
      data-id="${esc(String(t.id))}"
      style="border-radius:12px; box-shadow:4px 4px 0 rgba(0,0,0,.3)"
    >
      <button class="check" aria-label="toggle">
        <svg viewBox="0 0 24 24">
          <path d="M4 12.5l5 5L20 6.5"/>
        </svg>
      </button>

      <span class="txt">${esc(t.text)}</span>

      <span class="tag tag-${t.prio}">
        ${t.prio.toUpperCase()}
      </span>

      <span class="time">
        ${new Date(t.at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </span>

      <button class="del" aria-label="delete">✕</button>
    </li>
  `).join('');

  const empty = $('#empty');
  empty.hidden = view.length > 0;

  if (!view.length){
    const msgs = {
      all: todos.length
        ? ['FILTER GLITCH?', 'Odd — nothing to show.']
        : ['ALL CLEAR.', 'Add your first task above ↑'],

      active: [
        'NOTHING PENDING.',
        'Everything is ticked off. Legend.'
      ],

      done: [
        'NOTHING DONE YET.',
        'Go tick something off ✓'
      ]
    };

    $('#emptyTitle').textContent = msgs[filter][0];
    $('#emptySub').textContent = msgs[filter][1];
  }
}

/* ---------- Toast ---------- */
function toast(msg, { type = '', action, onAction, dur = 3200 } = {}){
  const t = document.createElement('div');

  t.className = 'toast ' + type;
  t.innerHTML = `<span>${esc(msg)}</span>`;

  if (action){
    const b = document.createElement('button');
    b.textContent = action;

    b.onclick = () => {
      clearTimeout(kill);
      onAction?.();
      dismiss();
    };

    t.appendChild(b);
  }

  $('#toasts').appendChild(t);

  const kill = setTimeout(dismiss, dur);

  function dismiss(){
    t.classList.add('out');
    setTimeout(() => t.remove(), 260);
  }
}

/* ---------- Rotating headline ---------- */
const words = ['DONE.', 'SORTED.', 'HANDLED.', 'TICKED.'];
let wi = 0;

setInterval(() => {
  const el = $('#rotWord');
  const next = words[++wi % words.length];

  el.animate(
    [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-14px)' }
    ],
    {
      duration: 200,
      fill: 'forwards'
    }
  ).onfinish = () => {
    el.textContent = next;

    el.animate(
      [
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      {
        duration: 280,
        easing: 'cubic-bezier(.2,.8,.2,1)'
      }
    );
  };
}, 2400);

/* ---------- Boot ---------- */
(async function boot(){
  const saved = getSession();

  if (saved?.token){
    try{
      const user = saved.user || {
        name: 'User',
        email: ''
      };

      await loadTodos();

      session = user;

      $('#userName').textContent = user.name;
      $('#helloName').textContent = user.name.split(' ')[0];
      $('#avatar').textContent = user.name[0].toUpperCase();

      $('#today').textContent = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });

      render();
      show('appScreen');

      return;

    }catch(err){
      clearSession();
    }
  }

  show('authScreen');
})();