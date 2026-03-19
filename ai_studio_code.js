/**
 * NEWTON INVADERS - SISTEMA EDUCATIVO LOG
 */

const questionBank = [
    { q: "¿Qué ley enuncia que un cuerpo permanece en reposo a menos que actúe una fuerza?", a: ["1ª Ley de Newton", "2ª Ley de Newton", "3ª Ley de Newton"], c: 0 },
    { q: "Si la aceleración es constante y la masa se duplica, la fuerza necesaria debe...", a: ["Reducirse", "Duplicarse", "Triplicarse"], c: 1 },
    { q: "La Tercera Ley de Newton es también conocida como la ley de...", a: ["Inercia", "Fuerza y Masa", "Acción y Reacción"], c: 2 },
    { q: "En la ecuación F = m * a, ¿qué representa la 'm'?", a: ["Movimiento", "Masa", "Momento"], c: 1 },
    { q: "¿Cuál es la unidad de fuerza en el SI?", a: ["Watt", "Joule", "Newton"], c: 2 },
    { q: "Si pateas un balón, el balón ejerce una fuerza igual sobre tu pie.", a: ["Verdadero (3ª Ley)", "Falso", "Solo si el balón no se mueve"], c: 0 }
];

// Registro de datos del alumno
const sessionData = {
    name: "",
    score: 0,
    answersLog: [],
    startTime: null
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 600;

let gameActive = false;
let level = 1;
let enemies = [];
let bullets = [];
let bombs = [];
let powerups = [];
let enemyDir = 1;
const keys = {};

// --- CLASES ---
class Entity {
    constructor(x, y, w, h, color) { Object.assign(this, {x, y, w, h, color}); }
}

class Player extends Entity {
    constructor() {
        super(375, 540, 50, 30, '#00f3ff');
        this.health = 100;
        this.lastShot = 0;
        this.fireRate = 500;
        this.bulletW = 4;
    }
    update() {
        if (keys['ArrowLeft'] && this.x > 0) this.x -= 7;
        if (keys['ArrowRight'] && this.x < canvas.width - this.w) this.x += 7;
        if (Date.now() - this.lastShot > this.fireRate) {
            bullets.push({x: this.x + this.w/2, y: this.y, w: this.bulletW, h: 12});
            this.lastShot = Date.now();
        }
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

const player = new Player();

// --- LÓGICA DE INICIO ---
document.getElementById('start-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('student-name').value;
    if (nameInput.length < 3) return alert("Por favor ingresa tu nombre");
    sessionData.name = nameInput;
    sessionData.startTime = new Date().toLocaleTimeString();
    document.getElementById('display-name').innerText = nameInput;
    document.getElementById('login-screen').style.display = 'none';
    gameActive = true;
    initLevel(1);
    loop();
});

function initLevel(lvl) {
    enemies = [];
    const shapes = ['square', 'rhombus', 'triangle'];
    for(let r=0; r<3; r++) {
        for(let c=0; c<8; c++) {
            enemies.push({
                x: 150 + c*60, y: 80 + r*50, w: 35, h: 30, 
                hp: lvl, type: shapes[lvl-1] || 'triangle'
            });
        }
    }
}

function loop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update();
    player.draw();

    // Balas jugador
    bullets.forEach((b, i) => {
        b.y -= 8;
        ctx.fillStyle = "#39ff14";
        ctx.fillRect(b.x - b.w/2, b.y, b.w, b.h);
        if (b.y < 0) bullets.splice(i, 1);
    });

    // Enemigos
    let edge = false;
    enemies.forEach((e, ei) => {
        e.x += enemyDir * (0.5 + level*0.5);
        if (e.x + e.w > canvas.width || e.x < 0) edge = true;
        
        ctx.fillStyle = level === 1 ? '#ff00ff' : (level === 2 ? '#00f3ff' : '#ff3131');
        ctx.fillRect(e.x, e.y, e.w, e.h);

        // Bombas (Probabilidad reducida)
        if (Math.random() < 0.001 * level) {
            bombs.push({x: e.x + e.w/2, y: e.y + e.h, w: 6, h: 6});
        }

        // Colisión Bala -> Enemigo
        bullets.forEach((b, bi) => {
            if (b.x > e.x && b.x < e.x + e.w && b.y < e.y + e.h && b.y > e.y) {
                e.hp--;
                bullets.splice(bi, 1);
                if (e.hp <= 0) {
                    if (Math.random() < 0.15) powerups.push({x: e.x, y: e.y});
                    enemies.splice(ei, 1);
                    sessionData.score += 100;
                }
            }
        });
    });

    if (edge) { enemyDir *= -1; enemies.forEach(e => e.y += 20); }

    // Bombas enemigas (Daño 7%)
    bombs.forEach((b, bi) => {
        b.y += 4;
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI*2); ctx.fill();
        if (b.x > player.x && b.x < player.x + player.w && b.y > player.y && b.y < player.y + player.h) {
            bombs.splice(bi, 1);
            player.health -= 7;
            updateHUD();
        }
    });

    // Powerups
    powerups.forEach((p, pi) => {
        p.y += 2;
        ctx.fillStyle = "#ff00ff";
        ctx.fillText("NEWTON", p.x, p.y);
        if (p.x > player.x && p.x < player.x + player.w && p.y > player.y && p.y < player.y + player.h) {
            powerups.splice(pi, 1);
            openQuiz();
        }
    });

    if (enemies.length === 0) {
        level++;
        if (level > 3) showResults();
        else initLevel(level);
    }

    if (player.health <= 0) showResults();

    document.getElementById('score-txt').innerText = sessionData.score;
    document.getElementById('lvl-txt').innerText = level;
    
    requestAnimationFrame(loop);
}

function updateHUD() {
    document.getElementById('health-fill').style.width = player.health + "%";
}

function openQuiz() {
    gameActive = false;
    const qIndex = Math.floor(Math.random() * questionBank.length);
    const q = questionBank[qIndex];
    
    document.getElementById('q-txt').innerText = q.q;
    const box = document.getElementById('opt-box');
    box.innerHTML = '';
    
    q.a.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerText = opt;
        btn.onclick = () => {
            const isCorrect = (i === q.c);
            sessionData.answersLog.push({
                pregunta: q.q,
                respuestaDada: opt,
                resultado: isCorrect ? "CORRECTO" : "INCORRECTO"
            });
            
            if (isCorrect) {
                player.bulletW += 8;
                player.fireRate = Math.max(150, player.fireRate - 100);
                alert("¡Física aplicada! Mejora de arma activada.");
            } else {
                player.health -= 10;
                updateHUD();
                alert("Error de cálculo. El retroceso dañó la nave.");
            }
            
            document.getElementById('quiz-modal').style.display = 'none';
            gameActive = true;
            loop();
        };
        box.appendChild(btn);
    });
    document.getElementById('quiz-modal').style.display = 'flex';
}

function showResults() {
    gameActive = false;
    const screen = document.getElementById('results-screen');
    const stats = document.getElementById('final-stats');
    
    let logHTML = `<h3>Estudiante: ${sessionData.name}</h3>`;
    logHTML += `<p>Puntaje Final: ${sessionData.score}</p><ul>`;
    
    sessionData.answersLog.forEach(item => {
        logHTML += `<li><b>${item.pregunta}</b><br>Respondió: ${item.respuestaDada} - <span style="color:${item.resultado==='CORRECTO'?'lime':'red'}">${item.resultado}</span></li>`;
    });
    logHTML += `</ul>`;
    
    stats.innerHTML = logHTML;
    screen.style.display = 'flex';
}

document.getElementById('download-report').onclick = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessionData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `reporte_newton_${sessionData.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

window.onkeydown = e => keys[e.key] = true;
window.onkeyup = e => keys[e.key] = false;