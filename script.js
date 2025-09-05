const STORAGE_KEY = "todo_list_v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse storage", e);
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function priorityRank(p) {
  return p === "high" ? 3 : p === "medium" ? 2 : p === "low" ? 1 : 0;
}

let tasks = loadTasks();

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const dueInput = document.getElementById("due-input");
const prioritySelect = document.getElementById("priority-select");
const errorEl = document.getElementById("form-error");

const taskList = document.getElementById("task-list");
const taskTemplate = document.getElementById("task-item-template");

const showCompleted = document.getElementById("show-completed");
const sortSelect = document.getElementById("sort-select");

const editDialog = document.getElementById("edit-dialog");
const editTitle = document.getElementById("edit-title");
const editDue = document.getElementById("edit-due");
const editPriority = document.getElementById("edit-priority");
const editError = document.getElementById("edit-error");
let editingId = null;

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function render() {
  taskList.innerHTML = "";
  let view = tasks.slice();
  if (!showCompleted.checked) {
    view = view.filter((t) => !t.completed);
  }

  switch (sortSelect.value) {
    case "created_asc":
      view.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case "created_desc":
      view.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case "due_asc":
      view.sort((a, b) => ((a.due || "") > (b.due || "") ? 1 : -1));
      break;
    case "due_desc":
      view.sort((a, b) => ((a.due || "") < (b.due || "") ? 1 : -1));
      break;
    case "priority_desc":
      view.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority));
      break;
    case "priority_asc":
      view.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
      break;
  }

  for (const t of view) {
    const node = taskTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = t.id;
    if (t.completed) node.classList.add("completed");

    const checkbox = node.querySelector(".task-completed");
    checkbox.checked = !!t.completed;
    checkbox.addEventListener("change", () =>
      toggleComplete(t.id, checkbox.checked)
    );

    const titleEl = node.querySelector('[data-field="title"]');
    titleEl.textContent = t.title;

    const dueEl = node.querySelector('[data-field="due"]');
    if (t.due) {
      dueEl.textContent = `Due: ${formatDate(t.due)}`;
      dueEl.style.display = "inline-flex";
    } else {
      dueEl.style.display = "none";
    }

    const priorityEl = node.querySelector('[data-field="priority"]');
    if (t.priority) {
      priorityEl.textContent = `Priority: ${t.priority}`;
      priorityEl.dataset.value = t.priority;
      priorityEl.classList.add("priority");
      priorityEl.style.display = "inline-flex";
    } else {
      priorityEl.style.display = "none";
    }

    node
      .querySelector('[data-action="edit"]')
      .addEventListener("click", () => openEdit(t.id));
    node
      .querySelector('[data-action="delete"]')
      .addEventListener("click", () => deleteTask(t.id));

    taskList.appendChild(node);
  }
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  const due = dueInput.value || "";
  const priority = prioritySelect.value || "";

  if (!title) {
    errorEl.textContent = "Task cannot be empty.";
    taskInput.focus();
    return;
  }
  errorEl.textContent = "";

  const newTask = {
    id: uid(),
    title,
    completed: false,
    due,
    priority,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  tasks.push(newTask);
  saveTasks(tasks);
  taskForm.reset();
  render();
});

function toggleComplete(id, completed) {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  t.completed = completed;
  t.updatedAt = Date.now();
  saveTasks(tasks);
  render();
}

function deleteTask(id) {
  const idx = tasks.findIndex((x) => x.id === id);
  if (idx === -1) return;
  tasks.splice(idx, 1);
  saveTasks(tasks);
  render();
}

function openEdit(id) {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  editingId = id;
  editTitle.value = t.title;
  editDue.value = t.due || "";
  editPriority.value = t.priority || "";
  editError.textContent = "";
  editDialog.showModal();
}

document.getElementById("edit-form").addEventListener("submit", (e) => {
  e.preventDefault();
});

document.getElementById("edit-save").addEventListener("click", () => {
  const title = editTitle.value.trim();
  if (!title) {
    editError.textContent = "Title cannot be empty.";
    return;
  }
  const t = tasks.find((x) => x.id === editingId);
  if (!t) return;
  t.title = title;
  t.due = editDue.value || "";
  t.priority = editPriority.value || "";
  t.updatedAt = Date.now();
  saveTasks(tasks);
  editDialog.close();
  render();
});

showCompleted.addEventListener("change", render);
sortSelect.addEventListener("change", render);
render();
