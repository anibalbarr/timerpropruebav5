let timeLeft;
let timerId = null;
let currentRound = 1;
let isPaused = true;
let isSuddenDeath = false;
let isPrepMode = false;
let currentTheme = 'mk';

const STATUS_TEXTS = {
    mk: { waiting: "⚔️ PREPARANDO DUELO...", running: "💥 ¡DUELO EN CURSO!", end: "RONDA TERMINADA" },
    op: { waiting: "🌊 LEVANTEN ANCLAS...", running: "🏴‍☠️ ¡EN BUSCA DEL ONE PIECE!", end: "RONDA TERMINADA" },
    pk: { waiting: "🏟️ PREPARANDO EL ESTADIO...", running: "⚡ ¡ATRÁPALOS YA!", end: "RONDA TERMINADA" },
    db: { waiting: "☄️ REUNIENDO KI...", running: "🐉 ¡DESATA TU PODER!", end: "RONDA TERMINADA" }
};

const themeSelect = document.getElementById('theme-select');
const timerDisplay = document.getElementById('timer-display');
const roundDisplay = document.getElementById('round-display');
const durationSelect = document.getElementById('duration-select');
const statusMsg = document.getElementById('status-msg');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const finalMsg = document.getElementById('final-msg');
const progressBar = document.getElementById('progress-bar');
const fsBtn = document.getElementById('fullscreen-btn');
const prepBtn = document.getElementById('prep-btn');

function playSfx(tipo) {
    const audio = document.getElementById(`audio-${currentTheme}-${tipo}`);
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
}

function updateDisplay() {
    const mins = Math.floor(timeLeft / 60);
    const secs = Math.floor(timeLeft % 60);
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    let totalSecs;
    if (isPrepMode) {
        totalSecs = 120;
    } else if (isSuddenDeath) {
        totalSecs = 300;
    } else {
        totalSecs = parseFloat(durationSelect.value) * 60;
    }

    const percentage = (timeLeft / totalSecs) * 100;
    if (progressBar) progressBar.style.width = `${percentage}%`;

    // Lógica de Semáforo: Rojo (20s) y Amarillo (5 min = 300s)
    if (!isPrepMode) {
        if (timeLeft <= 20 && timeLeft > 0) {
            timerDisplay.classList.add('timer-alerta');
            timerDisplay.classList.remove('timer-warning');
        } else if (timeLeft <= 300 && timeLeft > 20) {
            timerDisplay.classList.add('timer-warning');
            timerDisplay.classList.remove('timer-alerta');
        } else {
            timerDisplay.classList.remove('timer-alerta', 'timer-warning');
        }
    } else {
        timerDisplay.classList.remove('timer-alerta', 'timer-warning');
    }

    if (timeLeft <= 0) {
        timeLeft = 0;
        clearInterval(timerId);
        timerId = "finished";
        isPaused = true;
        
        if (isPrepMode) {
            isPrepMode = false;
            startBtn.disabled = false;
            startBtn.textContent = "INICIAR RONDA";
            
            timeLeft = Math.round(parseFloat(durationSelect.value) * 60);
            
            const minsFinal = Math.floor(timeLeft / 60);
            const secsFinal = Math.floor(timeLeft % 60);
            timerDisplay.textContent = `${minsFinal.toString().padStart(2, '0')}:${secsFinal.toString().padStart(2, '0')}`;
            if (progressBar) progressBar.style.width = `100%`;
            
            statusMsg.textContent = "¡PREPARACIÓN TERMINADA! INICIEN RONDA";
            roundDisplay.textContent = `RONDA ${currentRound}`;
        } else {
            timerDisplay.style.display = 'none'; 
            finalMsg.classList.add('show-final');
            playSfx('end');
            statusMsg.textContent = "REPORTEN SUS RESULTADOS";
        }
    }
    
    // Guardar estado en LocalStorage en cada actualización
    saveState();
}

function startTimer() {
    if (isPaused) {
        if ((!timerId || timerId === "finished") && !isSuddenDeath && !isPrepMode) {
            playSfx(`start-${currentRound}`);
        }

        isPaused = false;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        if (!isPrepMode) {
            statusMsg.textContent = STATUS_TEXTS[currentTheme].running;
        }

        timerId = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                if (timeLeft === 20 && !isPrepMode) playSfx('20sec');
                updateDisplay();
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    isPaused = true;
    isSuddenDeath = false;
    isPrepMode = false;
    
    timerDisplay.style.display = '';
    // Limpiamos las clases de alerta y advertencia
    timerDisplay.classList.remove('hide-time', 'timer-alerta', 'timer-warning');
    finalMsg.classList.remove('show-final');
    
    const rawValue = durationSelect.value;
    timeLeft = Math.round(parseFloat(rawValue) * 60);
    
    updateDisplay();
    
    startBtn.disabled = false;
    startBtn.textContent = "INICIAR RONDA";
    statusMsg.textContent = STATUS_TEXTS[currentTheme].waiting;
}

prepBtn.addEventListener('click', () => {
    clearInterval(timerId);
    isPaused = false; 
    isPrepMode = true;
    isSuddenDeath = false;

    timeLeft = 120; 
    roundDisplay.textContent = "PREPARACIÓN";
    statusMsg.textContent = "🪑 BUSQUEN SUS MESAS...";
    
    timerDisplay.style.display = '';
    timerDisplay.classList.remove('hide-time', 'timer-alerta', 'timer-warning');
    finalMsg.classList.remove('show-final');
    
    updateDisplay();
    
    startBtn.disabled = false;
    startBtn.textContent = "SALTAR A RONDA";
    pauseBtn.disabled = false;

    timerId = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        }
    }, 1000);
});

startBtn.addEventListener('click', () => {
    if (isPrepMode && startBtn.textContent === "SALTAR A RONDA") {
        resetTimer(); 
        roundDisplay.textContent = `RONDA ${currentRound}`;
        return; 
    }
    startTimer();
});

pauseBtn.addEventListener('click', () => {
    isPaused = true;
    clearInterval(timerId);
    startBtn.disabled = false;
    startBtn.textContent = "REANUDAR";
    statusMsg.textContent = "PAUSADO";
    saveState(); // Guardar explícitamente al pausar
});

document.getElementById('reset-btn').addEventListener('click', resetTimer);

document.getElementById('next-round-btn').addEventListener('click', () => {
    if (currentRound < 6) {
        currentRound++;
        roundDisplay.textContent = `RONDA ${currentRound}`;
        resetTimer();
    }
});

document.getElementById('sudden-death-btn').addEventListener('click', () => {
    clearInterval(timerId); 
    timerId = "finished"; 
    isPaused = true; 
    
    isSuddenDeath = true;
    isPrepMode = false;
    timeLeft = 300; 
    
    timerDisplay.style.display = ''; 
    finalMsg.classList.remove('show-final');
    timerDisplay.classList.remove('timer-alerta');
    
    playSfx('sudden');
    updateDisplay();
    
    startTimer();
});

fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
        fsBtn.textContent = "Minimizar";
    } else {
        document.exitFullscreen();
        fsBtn.textContent = "⛶ Pantalla Completa";
    }
});

themeSelect.addEventListener('change', (e) => {
    currentTheme = e.target.value;
    document.body.setAttribute('data-theme', currentTheme);
    resetTimer();
});

// Evento para el Ticker Dinámico
document.getElementById('update-ticker-btn').addEventListener('click', () => {
    const newText = document.getElementById('ticker-input').value;
    if (newText.trim() !== "") {
        const spans = document.querySelectorAll('.ticker-content span');
        const formattedText = `📢 ${newText.toUpperCase()} • `.repeat(4);
        spans.forEach(span => span.textContent = formattedText);
        document.getElementById('ticker-input').value = "";
    }
});

// Funciones de LocalStorage
function saveState() {
    const state = {
        timeLeft: timeLeft,
        currentRound: currentRound,
        currentTheme: currentTheme,
        isPrepMode: isPrepMode,
        isSuddenDeath: isSuddenDeath
    };
    localStorage.setItem('tcgTimerState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('tcgTimerState');
    if (saved) {
        const state = JSON.parse(saved);
        timeLeft = state.timeLeft;
        currentRound = state.currentRound;
        currentTheme = state.currentTheme;
        isPrepMode = state.isPrepMode;
        isSuddenDeath = state.isSuddenDeath;
        isPaused = true; 

        document.body.setAttribute('data-theme', currentTheme);
        themeSelect.value = currentTheme;
        roundDisplay.textContent = isPrepMode ? "PREPARACIÓN" : `RONDA ${currentRound}`;
        
        timerDisplay.style.display = '';
        finalMsg.classList.remove('show-final');
        
        startBtn.disabled = false;
        startBtn.textContent = "REANUDAR";
        statusMsg.textContent = "RECUPERADO - PAUSADO";
        
        updateDisplay();
        return true;
    }
    return false;
}

// Inicialización: Intentar cargar estado previo, si no hay, resetear normal
if (!loadState()) {
    resetTimer();
}

// Reloj de Hora Real
function updateRealTimeClock() {
    const now = new Date();
    // Formato de hora corto (ej: 17:30)
    const timeString = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    const clockEl = document.getElementById('real-time-clock');
    if (clockEl) clockEl.textContent = timeString;
}
setInterval(updateRealTimeClock, 1000);
updateRealTimeClock();

// Lógica del Código QR
document.getElementById('update-qr-btn').addEventListener('click', () => {
    const url = document.getElementById('qr-input').value;
    const qrContainer = document.getElementById('qr-container');
    const qrBox = document.getElementById('qr-code-box');

    if (url.trim() !== "") {
        // Limpiamos cualquier QR anterior
        qrBox.innerHTML = "";
        
        // Generamos el nuevo QR
        new QRCode(qrBox, {
            text: url,
            width: 160,
            height: 160,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.M
        });

        // Lo mostramos en pantalla
        qrContainer.classList.remove('hidden');
    }
});

// Botón para ocultar el QR
document.getElementById('hide-qr-btn').addEventListener('click', () => {
    document.getElementById('qr-container').classList.add('hidden');
    document.getElementById('qr-input').value = ""; // Limpiar el input
});