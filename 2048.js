let grid = [];
let score = 0;
let best = localStorage.getItem("best") || 0;

let timer = 0;
let interval;

let paused = false;

let level = 1;
let wallCount = 0;

let history = [];

const SIZE = 4;

/* =========================
   CREARE TABLĂ
========================= */

function createGrid() {

  grid = Array(SIZE)
    .fill()
    .map(() => Array(SIZE).fill(0));

}

/* =========================
   DESENARE TABLĂ
========================= */

function drawGrid() {

  const el = document.getElementById("grid");

  el.innerHTML = "";

  grid.forEach(row => {

    row.forEach(cell => {

      const div = document.createElement("div");

      div.classList.add("cell");

      /* ZID */
      if(cell === "W") {

        div.classList.add("wall");

      }

      /* BOMBĂ */
      else if(cell === "B") {

        div.classList.add("bomb");

        div.innerText = "💣";

      }

      /* TILE NORMAL */
      else if(cell !== 0) {

        div.classList.add("tile-" + cell);

        div.innerText = cell;

      }

      el.appendChild(div);

    });

  });

}

/* =========================
   TILE RANDOM
========================= */

function randomTile() {

  let empty = [];

  for(let i=0;i<SIZE;i++) {

    for(let j=0;j<SIZE;j++) {

      if(grid[i][j] === 0) {

        empty.push([i,j]);

      }

    }

  }

  if(empty.length === 0) return;

  let [i,j] = empty[Math.floor(Math.random()*empty.length)];

  let rand = Math.random();

  /* 8% șansă bombă */
  if(rand < 0.08) {

    grid[i][j] = "B";

  }

  else {

    grid[i][j] = Math.random() < 0.9 ? 2 : 4;

  }

}

/* =========================
   LOGICĂ RÂND
========================= */

function operate(row) {

  let walls = [];

  row.forEach((v, i) => {

    if(v === "W") {
      walls.push(i);
    }

  });

  let result = [...row];

  // resetăm tot în afară de ziduri
  for(let i=0;i<SIZE;i++) {

    if(result[i] !== "W") {
      result[i] = 0;
    }

  }

  let start = 0;

  walls.push(SIZE);

  for(let w of walls) {

    let segment = [];

    for(let i=start;i<w;i++) {

      if(row[i] !== 0 && row[i] !== "W") {
        segment.push(row[i]);
      }

    }

    let newSegment = [];

    let i = 0;

    while(i < segment.length) {

      // 💣 bombă + număr din dreapta
      if(
        segment[i] === "B" &&
        i + 1 < segment.length &&
        typeof segment[i + 1] === "number"
      ) {

        score += segment[i + 1] + 150;

        i += 2;

        continue;
      }

      // număr + 💣
      if(
        typeof segment[i] === "number" &&
        i + 1 < segment.length &&
        segment[i + 1] === "B"
      ) {

        score += segment[i] + 150;

        i += 2;

        continue;
      }

      // combinare normală
      if(
        typeof segment[i] === "number" &&
        i + 1 < segment.length &&
        segment[i] === segment[i + 1]
      ) {

        let merged = segment[i] * 2;

        score += merged;

        newSegment.push(merged);

        i += 2;

      }

      else {

        newSegment.push(segment[i]);

        i++;

      }

    }

    let idx = start;

    for(let val of newSegment) {

      while(result[idx] === "W") {
        idx++;
      }

      result[idx] = val;

      idx++;

    }

    start = w + 1;

  }

  return result;
}

/* =========================
   ROTIRE MATRICE
========================= */

function rotateClockwise(mat) {

  let res = Array(SIZE)
    .fill()
    .map(() => Array(SIZE).fill(0));

  for(let i=0;i<SIZE;i++) {

    for(let j=0;j<SIZE;j++) {

      res[j][SIZE - 1 - i] = mat[i][j];

    }

  }

  return res;
}

/* =========================
   MUTARE
========================= */

function move(dir) {

  if(paused) return;

  /* salvăm pentru undo */
  history.push(JSON.stringify({
    grid,
    score
  }));

  let old = JSON.stringify(grid);

  let rotations = 0;

  if(dir === "up") rotations = 3;
  if(dir === "right") rotations = 2;
  if(dir === "down") rotations = 1;

  /* rotire */
  for(let i=0;i<rotations;i++) {

    grid = rotateClockwise(grid);

  }

  /* aplicăm logica */
  for(let i=0;i<SIZE;i++) {

    grid[i] = operate(grid[i]);

  }

  /* revenire */
  for(let i=0;i<(4 - rotations) % 4;i++) {

    grid = rotateClockwise(grid);

  }

  /* dacă s-a schimbat tabla */
  if(JSON.stringify(grid) !== old) {

    /* nivel + zid */
    while(score >= level * 1000 && wallCount < 3) {

      level++;

      addWall();

    }

    randomTile();

  }

  drawGrid();

  updateUI();

  checkGameOver();

  checkWin();

}

/* =========================
   ZID FIX
========================= */

function addWall() {

  if(wallCount >= 3) return;

  let empty = [];

  for(let i=0;i<SIZE;i++) {

    for(let j=0;j<SIZE;j++) {

      if(grid[i][j] === 0) {

        empty.push([i,j]);

      }

    }

  }

  if(empty.length === 0) return;

  let [i,j] = empty[Math.floor(Math.random()*empty.length)];

  grid[i][j] = "W";

  wallCount++;

}

/* =========================
   GAME OVER
========================= */

function checkGameOver() {

  /* spații goale */
  for(let i=0;i<SIZE;i++) {

    for(let j=0;j<SIZE;j++) {

      if(grid[i][j] === 0) {

        return;

      }

    }

  }

  /* verificăm mutări posibile */
  for(let i=0;i<SIZE;i++) {

    for(let j=0;j<SIZE;j++) {

      let current = grid[i][j];

      /* dreapta */
      if(j < SIZE - 1) {

        let right = grid[i][j + 1];

        if(
          typeof current === "number" &&
          current === right
        ) {

          return;

        }

        if(
          (current === "B" && typeof right === "number") ||
          (right === "B" && typeof current === "number")
        ) {

          return;

        }

      }

      /* jos */
      if(i < SIZE - 1) {

        let down = grid[i + 1][j];

        if(
          typeof current === "number" &&
          current === down
        ) {

          return;

        }

        if(
          (current === "B" && typeof down === "number") ||
          (down === "B" && typeof current === "number")
        ) {

          return;

        }

      }

    }

  }

  clearInterval(interval);

  document.getElementById("gameOverScreen").style.display = "flex";

  document.querySelector(".gameover-title").innerText = "GAME OVER";

}

/* =========================
   WIN
========================= */

function checkWin() {

  for(let i=0;i<SIZE;i++) {

    for(let j=0;j<SIZE;j++) {

      if(grid[i][j] === 2048) {

        showWin();

        return;

      }

    }

  }

}

function showWin() {

  clearInterval(interval);

  document.getElementById("gameOverScreen").style.display = "flex";

  document.querySelector(".gameover-title").innerText = "YOU WIN 🎉";

}

/* =========================
   UI
========================= */

function updateUI() {

  if(score > best) {

    best = score;

    localStorage.setItem("best", best);

  }

  document.getElementById("score").innerText = score;

  document.getElementById("best").innerText = best;

  document.getElementById("level").innerText = level;

}

/* =========================
   START GAME
========================= */

function startGame() {

  createGrid();

  score = 0;

  level = 1;

  wallCount = 0;

  paused = false;

  timer = 0;

  history = [];

  document.getElementById("pauseScreen").style.display = "none";

  document.getElementById("gameOverScreen").style.display = "none";

  randomTile();

  randomTile();

  drawGrid();

  updateUI();

  document.getElementById("timer").innerText = timer;

  clearInterval(interval);

  interval = setInterval(() => {

    if(!paused) {

      timer++;

      document.getElementById("timer").innerText = timer;

    }

  }, 1000);

}

/* =========================
   PAUSE
========================= */

function pauseGame() {

  paused = !paused;

  document.getElementById("pauseScreen").style.display =
    paused ? "flex" : "none";

}

/* =========================
   UNDO
========================= */

function undoMove() {

  if(history.length > 0) {

    let prev = JSON.parse(history.pop());

    grid = prev.grid;

    score = prev.score;

    drawGrid();

    updateUI();

  }

}

/* =========================
   SAVE
========================= */

function saveGame() {

  localStorage.setItem(
    "save",
    JSON.stringify({
      grid,
      score,
      level,
      timer,
      wallCount
    })
  );

}

/* =========================
   LOAD
========================= */

function loadGame() {

  let data = JSON.parse(localStorage.getItem("save"));

  if(data) {

    grid = data.grid;

    score = data.score;

    level = data.level;

    timer = data.timer;

    wallCount = data.wallCount || 0;

    paused = false;

    document.getElementById("pauseScreen").style.display = "none";

    document.getElementById("gameOverScreen").style.display = "none";

    document.getElementById("timer").innerText = timer;

    drawGrid();

    updateUI();

    clearInterval(interval);

    interval = setInterval(() => {

      if(!paused) {

        timer++;

        document.getElementById("timer").innerText = timer;

      }

    }, 1000);

  }

}

/* =========================
   CONTROALE
========================= */

window.addEventListener("keydown", e => {

  if(e.key === "ArrowLeft") move("left");

  if(e.key === "ArrowRight") move("right");

  if(e.key === "ArrowUp") move("up");

  if(e.key === "ArrowDown") move("down");

});
