// =====================
// ELEMENTOS BASE
// =====================
const cardsSelector = '.kanban-card';
const columnSelector = '.kanban-col';

let draggedCard = null;
let currentCard = null;

// =====================
// DRAG & DROP
// =====================
function enableDrag(card) {
  card.addEventListener('dragstart', () => {
    draggedCard = card;
    card.classList.add('dragging');
  });

  card.addEventListener('dragend', () => {
    draggedCard = null;
    card.classList.remove('dragging');
  });
}

document.querySelectorAll(columnSelector).forEach(col => {
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
      saveKanbanState();
      checkDeadlines();
      updateKPIs();
      updateColumnCounts();
    }
  });
});

// =====================
// LOCAL STORAGE
// =====================
function saveKanbanState() {
  const state = {};
  document.querySelectorAll(columnSelector).forEach(col => {
    const status = col.dataset.status;
    col.querySelectorAll(cardsSelector).forEach(card => {
      state[card.dataset.id] = status;
    });
  });
  localStorage.setItem('kanbanState', JSON.stringify(state));
}

function loadKanbanState() {
  const state = JSON.parse(localStorage.getItem('kanbanState')) || {};
  Object.keys(state).forEach(id => {
    const card = document.querySelector(`[data-id="${id}"]`);
    const col = document.querySelector(
      `.kanban-col[data-status="${state[id]}"]`
    );
    if (card && col) col.appendChild(card);
  });
}

// =====================
// MODAL
// =====================
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');

function openModal(card) {
  currentCard = card;

  modalTitle.innerText = card.dataset.title || 'Processo';

  modalBody.innerHTML = `
    <p><strong>Protocolo:</strong> ${card.dataset.protocolo || '-'}</p>
    <p><strong>Tipo:</strong> ${card.dataset.tipo || '-'}</p>
    <p><strong>Status:</strong> ${card.closest(columnSelector).dataset.status}</p>
    <p><strong>Prazo:</strong> ${card.dataset.prazo || '-'}</p>
    <p><strong>Responsável:</strong> ${card.dataset.responsavel || '-'}</p>
    <p><strong>Prioridade:</strong> ${card.dataset.prioridade || '-'}</p>
  `;

  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

modalClose?.addEventListener('click', closeModal);
modalCancel?.addEventListener('click', closeModal);
modal.querySelector('.modal-overlay')
  ?.addEventListener('click', closeModal);

// =====================
// CLICK NOS CARDS
// =====================
function bindCardClicks() {
  document.querySelectorAll(cardsSelector).forEach(card => {
    card.addEventListener('click', e => {
      if (card.classList.contains('dragging')) return;
      openModal(card);
    });
    enableDrag(card);
  });
}

// =====================
// PRAZO CRÍTICO
// =====================
function checkDeadlines() {
  const today = new Date();
  document.querySelectorAll(cardsSelector).forEach(card => {
    const prazo = card.dataset.prazo;
    if (!prazo) return;

    const [d,m,y] = prazo.split('/');
    const date = new Date(y, m-1, d);
    const diff = (date - today) / 86400000;

    card.classList.toggle('critical', diff <= 3);
  });
}

// =====================
// KPIs
// =====================
function updateKPIs() {
  document.getElementById('kpi-ativos').innerText =
    document.querySelectorAll(cardsSelector).length;

  document.getElementById('kpi-criticos').innerText =
    document.querySelectorAll(`${cardsSelector}.critical`).length;

  document.getElementById('kpi-finalizados').innerText =
    document.querySelectorAll(
      '.kanban-col[data-status="finalizado"] .kanban-card'
    ).length;
}

function updateColumnCounts() {
  ['recebido','analise','andamento','finalizado'].forEach(status => {
    const el = document.getElementById(`count-${status}`);
    if (el) {
      el.innerText = document.querySelectorAll(
        `.kanban-col[data-status="${status}"] .kanban-card`
      ).length;
    }
  });
}

// =====================
// INIT
// =====================
loadKanbanState();
bindCardClicks();
checkDeadlines();
updateKPIs();
updateColumnCounts();

function importarDenuncias() {
  const pendentes =
    JSON.parse(localStorage.getItem('denunciasPendentes')) || [];

  if (!pendentes.length) return;

  const colunaRecebido =
    document.querySelector('.kanban-col[data-status="recebido"]');

  pendentes.forEach(d => {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;

    card.dataset.id = d.id;
    card.dataset.title = d.title;
    card.dataset.tipo = d.tipo;
    card.dataset.prazo = d.prazo;
    card.dataset.responsavel = d.responsavel;
    card.dataset.prioridade = d.prioridade;

    card.innerHTML = `
      <strong>${d.title}</strong>
      <div class="kanban-meta">
        <span>📍 ${d.localizacao}</span>
        <span>🆕</span>
      </div>
    `;

    enableDrag(card);
    card.addEventListener('click', () => openModal(card));

    colunaRecebido.appendChild(card);
  });

  localStorage.removeItem('denunciasPendentes');

  saveKanbanState();
  checkDeadlines();
  updateKPIs();
  updateColumnCounts();
}

let chartStatus = null;
let chartPrazo = null;

function updateCharts() {
  // ===== CONTAGEM POR STATUS =====
  const statusCounts = {
    recebido: 0,
    analise: 0,
    andamento: 0,
    finalizado: 0
  };

  document.querySelectorAll('.kanban-col').forEach(col => {
    const status = col.dataset.status;
    statusCounts[status] =
      col.querySelectorAll('.kanban-card').length;
  });

  // ===== PRAZOS =====
  const criticos = document.querySelectorAll('.kanban-card.critical').length;
  const total = document.querySelectorAll('.kanban-card').length;
  const ok = total - criticos;

  // ===== STATUS CHART =====
  const ctxStatus = document.getElementById('chart-status');
  if (chartStatus) chartStatus.destroy();

  chartStatus = new Chart(ctxStatus, {
    type: 'bar',
    data: {
      labels: ['Recebido', 'Em análise', 'Em andamento', 'Finalizado'],
      datasets: [{
        data: [
          statusCounts.recebido,
          statusCounts.analise,
          statusCounts.andamento,
          statusCounts.finalizado
        ],
        backgroundColor: [
          '#9BAA9B',
          '#F5A623',
          '#4A90D9',
          '#3ECBA5'
        ]
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      responsive: true
    }
  });

  // ===== PRAZO CHART =====
  const ctxPrazo = document.getElementById('chart-prazo');
  if (chartPrazo) chartPrazo.destroy();

  chartPrazo = new Chart(ctxPrazo, {
    type: 'doughnut',
    data: {
      labels: ['Crítico', 'No prazo'],
      datasets: [{
        data: [criticos, ok],
        backgroundColor: ['#E95B5B', '#3ECBA5']
      }]
    },
    options: {
      responsive: true
    }
  });
}

