let grid = [];
let score = 0;
let best = localStorage.getItem("best") || 0;
let previous = null;
let timer = 0;
let interval;
let started = false;
let paused = false;

const gridEl = document.getElementById("grid");

function startGame() {
    started = true;
    paused = false;

    grid = Array(16).fill(0);
    score = 0;
    timer = 0;

    clearInterval(interval);

    interval = setInterval(() => {
        timer++;
        document.getElementById("timer").innerText = timer;
    }, 1000);

    document.getElementById("pauseOverlay").style.display = "none";
    document.getElementById("pauseBtn").innerText = "Pause";

    addRandom();
    addRandom();
    draw();
}

function pauseGame() {
    if (!started) return;

    if (!paused) {
        clearInterval(interval);
        paused = true;

        document.getElementById("pauseOverlay").style.display = "flex";
        document.getElementById("pauseBtn").innerText = "Resume";
    } else {
        paused = false;

        interval = setInterval(() => {
            timer++;
            document.getElementById("timer").innerText = timer;
        }, 1000);

        document.getElementById("pauseOverlay").style.display = "none";
        document.getElementById("pauseBtn").innerText = "Pause";
    }
}

function draw() {
    gridEl.innerHTML = "";

    grid.forEach(val => {
        let cell = document.createElement("div");
        cell.className = "cell";

        if (val === "B") {
            cell.classList.add("bomb");
            cell.innerText = "💣";
        } else if (val !== 0) {
            cell.innerText = val;
            cell.classList.add("x" + val);
        }

        gridEl.appendChild(cell);
    });

    document.getElementById("score").innerText = score;
    document.getElementById("best").innerText = best;
}

function addRandom() {
    let empty = grid.map((v, i) => v === 0 ? i : null).filter(v => v !== null);
    if (empty.length === 0) return;

    let i = empty[Math.floor(Math.random() * empty.length)];

    if (Math.random() < 0.05) {
        grid[i] = "B";
    } else {
        grid[i] = Math.random() < 0.9 ? 2 : 4;
    }
}

function slide(row) {
    row = row.filter(v => v !== 0);

    for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
            row[i] *= 2;
            score += row[i];
            row[i + 1] = 0;
        }
    }

    row = row.filter(v => v !== 0);

    while (row.length < 4) row.push(0);

    return row;
}

function moveLeft() {
    save();
    for (let i = 0; i < 4; i++) {
        let r = grid.slice(i*4, i*4+4);
        r = slide(r);
        grid.splice(i*4, 4, ...r);
    }
}

function moveRight() {
    save();
    for (let i = 0; i < 4; i++) {
        let r = grid.slice(i*4, i*4+4).reverse();
        r = slide(r).reverse();
        grid.splice(i*4, 4, ...r);
    }
}

function moveUp() {
    save();
    for (let i = 0; i < 4; i++) {
        let c = [grid[i], grid[i+4], grid[i+8], grid[i+12]];
        c = slide(c);
        [grid[i], grid[i+4], grid[i+8], grid[i+12]] = c;
    }
}

function moveDown() {
    save();
    for (let i = 0; i < 4; i++) {
        let c = [grid[i], grid[i+4], grid[i+8], grid[i+12]].reverse();
        c = slide(c).reverse();
        [grid[i], grid[i+4], grid[i+8], grid[i+12]] = c;
    }
}

function bomb() {
    grid.forEach((v,i) => {
        if (v === "B") {
            let n = [i-1, i+1, i-4, i+4];
            n.forEach(x => {
                if (grid[x] !== undefined) grid[x] = 0;
            });
            grid[i] = 0;
        }
    });
}

function key(e) {
    if (!started || paused) return;

    let old = [...grid];

    if (e.key=="ArrowLeft"||e.key=="a") moveLeft();
    if (e.key=="ArrowRight"||e.key=="d") moveRight();
    if (e.key=="ArrowUp"||e.key=="w") moveUp();
    if (e.key=="ArrowDown"||e.key=="s") moveDown();

    if (JSON.stringify(old) !== JSON.stringify(grid)) {
        bomb();
        addRandom();
        draw();

        if (score > best) {
            best = score;
            localStorage.setItem("best", best);
        }
    }
}

document.addEventListener("keydown", key);

function save() {
    previous = {grid:[...grid], score:score};
}

function undo() {
    if (previous) {
        grid = previous.grid;
        score = previous.score;
        draw();
    }
}

function saveGame() {
    localStorage.setItem("game", JSON.stringify({grid, score, timer}));
}

function loadGame() {
    let data = JSON.parse(localStorage.getItem("game"));
    if (data) {
        grid = data.grid;
        score = data.score;
        timer = data.timer;
        draw();
    }
}

function restartGame() {
    startGame();
}