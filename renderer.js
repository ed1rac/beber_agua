// Constante do objetivo
const TOTAL_BOTTLES = 9;
const ML_PER_BOTTLE = 709; // 24oz = ~709ml

// Seleção de elementos do DOM
const waterLevel = document.getElementById('water-level');
const bottleCountEl = document.getElementById('bottle-count');
const litersCountEl = document.getElementById('liters-count');
const addBtn = document.getElementById('add-btn');
const undoBtn = document.getElementById('undo-btn');
const stayTopToggle = document.getElementById('stay-top-toggle');
const closeBtn = document.getElementById('close-btn');
const bottleContainer = document.querySelector('.bottle-container');

// Period elements
const countMorning = document.getElementById('count-morning');
const countAfternoon = document.getElementById('count-afternoon');
const countNight = document.getElementById('count-night');

let hydrationHistory = [];

/**
 * Persistência de Dados (Local Storage)
 * Mantemos o array completo de timestamps (hydrationHistory)
 * para calcular com precisão os períodos do dia das garrafas tomadas
 */
function loadData() {
  const data = JSON.parse(localStorage.getItem('hydrationDataV2'));
  const today = new Date().toLocaleDateString();

  if (data) {
    if (data.stayOnTop !== undefined) {
      stayTopToggle.checked = data.stayOnTop;
      window.electronAPI.toggleAlwaysOnTop(data.stayOnTop);
    }
    if (data.date === today && Array.isArray(data.history)) {
      hydrationHistory = data.history;
    } else {
      hydrationHistory = [];
      saveData();
    }
  } else {
    // Migração de dados do V1
    const oldData = JSON.parse(localStorage.getItem('hydrationData'));
    if (oldData) {
      if (oldData.stayOnTop !== undefined) {
        stayTopToggle.checked = oldData.stayOnTop;
        window.electronAPI.toggleAlwaysOnTop(oldData.stayOnTop);
      }
      if (oldData.date === today && oldData.count > 0) {
         const now = Date.now();
         hydrationHistory = Array(oldData.count).fill(now);
      } else {
         hydrationHistory = [];
      }
    } else {
      hydrationHistory = [];
    }
    saveData();
  }
  
  updateUI();
}

function saveData() {
  const today = new Date().toLocaleDateString();
  const data = {
    date: today,
    history: hydrationHistory,
    stayOnTop: stayTopToggle.checked
  };
  localStorage.setItem('hydrationDataV2', JSON.stringify(data));
}

/**
 * Atualização Visual da Interface
 */
function updateUI() {
  const currentBottles = hydrationHistory.length;
  
  // Ajusta a altura da água com base na proporção lograda, com limite visual de 100%
  const percentage = Math.min((currentBottles / TOTAL_BOTTLES) * 100, 100);
  waterLevel.style.height = `${percentage}%`;
  
  // Atualiza campo de Garrafas e Litros
  bottleCountEl.innerText = currentBottles;
  const totalLiters = (currentBottles * ML_PER_BOTTLE) / 1000;
  litersCountEl.innerText = totalLiters.toFixed(2);

  // Excedeu 9 Garrafas = Golden Effect!
  if (currentBottles > TOTAL_BOTTLES) {
    bottleContainer.classList.add('over-goal');
  } else {
    bottleContainer.classList.remove('over-goal');
  }

  // Brilho dos Segmentos da Garrafa
  for (let i = 1; i <= TOTAL_BOTTLES; i++) {
    const segment = document.getElementById(`seg-${i}`);
    if (i <= currentBottles) {
      segment.classList.add('filled');
    } else {
      segment.classList.remove('filled');
    }
  }

  // Estatísticas de Períodos
  let morning = 0;   // 00h - 11h59
  let afternoon = 0; // 12h - 17h59
  let night = 0;     // 18h - 23h59

  hydrationHistory.forEach(timestamp => {
    const hour = new Date(timestamp).getHours();
    if (hour < 12) morning++;
    else if (hour < 18) afternoon++;
    else night++;
  });

  countMorning.innerHTML = `${morning}<small>/3</small>`;
  countAfternoon.innerHTML = `${afternoon}<small>/3</small>`;
  countNight.innerHTML = `${night}<small>/3</small>`;

  // Destaque para bater a meta do período
  countMorning.classList.toggle('success', morning >= 3);
  countAfternoon.classList.toggle('success', afternoon >= 3);
  countNight.classList.toggle('success', night >= 3);
}

// Lida com Adicionar Garrafas
addBtn.addEventListener('click', () => {
  hydrationHistory.push(Date.now()); // Salva o horário milimétrico pra contabilizar o turno
  saveData();
  updateUI();
});

// Lida com a funcionalidade de Desfazer Erro
undoBtn.addEventListener('click', () => {
  if (hydrationHistory.length > 0) {
    hydrationHistory.pop(); // Remove o último registro exatamente de onde o usuário adicionou
    saveData();
    updateUI();
  }
});

// Switch de Stay on Top
stayTopToggle.addEventListener('change', (e) => {
  const isChecked = e.target.checked;
  window.electronAPI.toggleAlwaysOnTop(isChecked);
  saveData();
});

// Fecha a aplicação
closeBtn.addEventListener('click', () => {
  window.electronAPI.closeApp();
});

// Inicia
loadData();

// Verificação periódica para 'Reset Diário' enquanto aberto de forma ininterrupta
setInterval(() => {
  const data = JSON.parse(localStorage.getItem('hydrationDataV2'));
  const today = new Date().toLocaleDateString();
  if (data && data.date !== today) {
    hydrationHistory = [];
    saveData();
    updateUI();
  }
}, 60000);
