const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('nav a');

window.addEventListener('scroll', () => {
  let current = '';

  sections.forEach(section => {
    const sectionTop = section.offsetTop - 120;
    if (scrollY >= sectionTop) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});

const cards = document.querySelectorAll('.kanban-card');
const columns = document.querySelectorAll('.kanban-col');

let draggedCard = null;

// Cards
cards.forEach(card => {
  card.addEventListener('dragstart', () => {
    draggedCard = card;
    card.classList.add('dragging');
  });

  card.addEventListener('dragend', () => {
    draggedCard = null;
    card.classList.remove('dragging');
  });
});

// Colunas
columns.forEach(col => {
  col.addEventListener('dragover', e => {
    e.preventDefault();
    col.classList.add('drag-over');
  });

  col.addEventListener('dragleave', () => {
    col.classList.remove('drag-over');
  });

  col.addEventListener('drop', () => {
    col.classList.remove('drag-over');
    if (draggedCard) {
      col.appendChild(draggedCard);

      // Aqui futuramente entra backend:
      // const status = col.dataset.status;
      // updateProcessStatus(id, status);
    }
  });
});


// ====== RESTAURAR ESTADO ======
function loadKanbanState() {
  const state = JSON.parse(localStorage.getItem('kanbanState')) || {};
  Object.keys(state).forEach(cardId => {
    const card = document.querySelector(`[data-id="${cardId}"]`);
    const column = document.querySelector(`[data-status="${state[cardId]}"]`);
    if (card && column) column.appendChild(card);
  });
}

// ====== SALVAR ESTADO ======
function saveKanbanState() {
  const state = {};
  columns.forEach(col => {
    const status = col.dataset.status;
    col.querySelectorAll('.kanban-card').forEach(card => {
      state[card.dataset.id] = status;
    });
  });
  localStorage.setItem('kanbanState', JSON.stringify(state));
}

// ====== DRAG CARDS ======
cards.forEach(card => {
  card.addEventListener('dragstart', () => {
    draggedCard = card;
    card.classList.add('dragging');
  });

  card.addEventListener('dragend', () => {
    draggedCard = null;
    card.classList.remove('dragging');
  });
});

// ====== DROP NAS COLUNAS ======
columns.forEach(col => {
  col.addEventListener('dragover', e => {
    e.preventDefault();
    col.classList.add('drag-over');
  });

  col.addEventListener('dragleave', () => {
    col.classList.remove('drag-over');
  });

  col.addEventListener('drop', () => {
    col.classList.remove('drag-over');
    if (draggedCard) {
      col.appendChild(draggedCard);
      saveKanbanState(); // 👈 salva automaticamente
    }
  });
});

// Inicializa
loadKanbanState();