const board = document.getElementById('board');
const rollBtn = document.getElementById('roll-btn');
const resetBtn = document.getElementById('reset-btn');
const turnIndicator = document.getElementById('current-player-name');
const diceResultText = document.getElementById('dice-result');
const gameMessage = document.getElementById('game-message');
const messageText = document.getElementById('message-text');

// Timer untuk menghilangkan pesan otomatis
let messageTimeout = null;

// Definisi Ular & Tangga
const ladders = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91
};

const snakes = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78
};

// Data Pemain
let players = [
  { id: 1, position: 1, element: null, color: 'player-1' },
  { id: 2, position: 1, element: null, color: 'player-2' }
];

let currentPlayerIndex = 0;
let isGameOver = false;

// Fungsi Menampilkan Notifikasi Berwarna
function showMessage(text, type = 'info', autoHide = true) {
  clearTimeout(messageTimeout);
  
  messageText.innerText = text;
  gameMessage.className = `game-message ${type}`;

  if (autoHide) {
    messageTimeout = setTimeout(() => {
      gameMessage.classList.add('hidden');
    }, 3000);
  }
}

// 1. Buat Papan Game
function createBoard() {
  board.innerHTML = '';
  
  for (let row = 9; row >= 0; row--) {
    const isEvenRow = (9 - row) % 2 === 1;
    for (let col = 0; col < 10; col++) {
      let tileNum;
      if (isEvenRow) {
        tileNum = row * 10 + (10 - col);
      } else {
        tileNum = row * 10 + (col + 1);
      }

      const tile = document.createElement('div');
      tile.classList.add('tile');
      tile.classList.add(tileNum % 2 === 0 ? 'even' : 'odd');
      tile.dataset.tile = tileNum;
      tile.innerText = tileNum;

      if (ladders[tileNum]) tile.classList.add('ladder');
      if (snakes[tileNum]) tile.classList.add('snake');

      board.appendChild(tile);
    }
  }

  // Elemen Bidak
  players.forEach(p => {
    const el = document.createElement('div');
    el.classList.add('player', p.color);
    p.element = el;
    board.appendChild(el);
  });

  updatePlayerPositions();
  
  // Gambar ulang garis ular & tangga setelah papan selesai dibuat
  setTimeout(drawSnakesAndLadders, 50); 
}

// Tambahkan juga event listener agar garis tetap pas jika ukuran layar berubah
window.addEventListener('resize', drawSnakesAndLadders);


// 2. Update Posisi Pemain
function updatePlayerPositions() {
  players.forEach(p => {
    const tileEl = document.querySelector(`[data-tile="${p.position}"]`);
    if (tileEl) {
      tileEl.appendChild(p.element);
    }
  });
}

// 3. Lempar Dadu & Logika Pergerakan Langkah demi Langkah
async function rollDice() {
  if (isGameOver) return;

  const diceValue = Math.floor(Math.random() * 6) + 1;
  diceResultText.innerText = `Hasil Dadu: ${diceValue}`;

  let player = players[currentPlayerIndex];
  let nextPos = player.position + diceValue;

  if (nextPos > 100) {
    showMessage(`Pemain ${player.id} butuh angka pas untuk ke kotak 100!`, 'info');
    switchTurn();
    return;
  }

  // Matikan tombol dadu sementara bidak berjalan
  rollBtn.disabled = true;

  // Jalankan animasi melangkah satu per satu
  for (let i = 0; i < diceValue; i++) {
    player.position += 1;
    updatePlayerPositions();
    // Jeda waktu 250ms per langkah
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  // Cek Ular / Tangga / Kemenangan setelah selesai melangkah
  checkSpecialTiles(player);
}

// Fungsi Pengecekan Ular, Tangga, dan Menang
function checkSpecialTiles(player) {
  if (ladders[player.position]) {
    const oldPos = player.position;
    player.position = ladders[oldPos];
    showMessage(`🪜 Hebat! Pemain ${player.id} naik tangga dari ${oldPos} ke ${player.position}!`, 'ladder');
    updatePlayerPositions();
  } else if (snakes[player.position]) {
    const oldPos = player.position;
    player.position = snakes[oldPos];
    showMessage(`🐍 Awas! Pemain ${player.id} digigit ular dari ${oldPos} ke ${player.position}!`, 'snake');
    updatePlayerPositions();
  }

  // Cek Menang
  if (player.position === 100) {
    showMessage(`🎉 Selamat! Pemain ${player.id} menang permainan! 🎉`, 'winner', false);
    isGameOver = true;
    rollBtn.disabled = true;
    return;
  }

  // Aktifkan kembali tombol dadu dan ganti giliran
  rollBtn.disabled = false;
  switchTurn();
}

// 4. Ganti Giliran
function switchTurn() {
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  turnIndicator.innerText = `Pemain ${players[currentPlayerIndex].id}`;
}

// 5. Reset Game
function resetGame() {
  players.forEach(p => p.position = 1);
  currentPlayerIndex = 0;
  isGameOver = false;
  rollBtn.disabled = false;
  turnIndicator.innerText = `Pemain 1`;
  diceResultText.innerText = `Hasil Dadu: -`;
  gameMessage.classList.add('hidden');
  updatePlayerPositions();
}

// Event Listener
rollBtn.addEventListener('click', rollDice);
resetBtn.addEventListener('click', resetGame);

// Inisialisasi
createBoard();

// Fungsi untuk menggambar garis ular dan tangga secara dinamis
function drawSnakesAndLadders() {
  const svg = document.getElementById('board-svg');
  if (!svg) return;
  svg.innerHTML = ''; // Bersihkan gambar sebelumnya

  const boardRect = board.getBoundingClientRect();

  // Helper untuk mencari titik tengah (X, Y) dari sebuah nomor kotak
  function getTileCenter(tileNum) {
    const tileEl = document.querySelector(`[data-tile="${tileNum}"]`);
    if (!tileEl) return { x: 0, y: 0 };
    const rect = tileEl.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - boardRect.left,
      y: rect.top + rect.height / 2 - boardRect.top
    };
  }

  // 1. Gambar Garis Tangga (Warna Hijau dengan efek rungs/pijakan)
  for (let start in ladders) {
    let end = ladders[start];
    let p1 = getTileCenter(Number(start));
    let p2 = getTileCenter(Number(end));

    let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p1.x);
    line.setAttribute('y1', p1.y);
    line.setAttribute('x2', p2.x);
    line.setAttribute('y2', p2.y);
    line.setAttribute('stroke', '#16a34a'); // Hijau tangga
    line.setAttribute('stroke-width', '6');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-dasharray', '6,6'); // Efek garis putus-putus ala tangga
    svg.appendChild(line);
  }

  // 2. Gambar Garis Ular (Warna Merah bergelombang / lengkung)
  for (let start in snakes) {
    let end = snakes[start];
    let p1 = getTileCenter(Number(start));
    let p2 = getTileCenter(Number(end));

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // Buat titik lengkung tengah (curve) agar ular terlihat meliuk
    let cx = (p1.x + p2.x) / 2 + 25;
    let cy = (p1.y + p2.y) / 2 - 25;
    
    let d = `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#dc2626'); // Merah ular
    path.setAttribute('stroke-width', '8');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
  }
}