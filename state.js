let gameStarted = false;
let gamePaused = true;
let gameOver = false;

let map, player, enemy, bombs, explosions, enemyCooldown;
let items = [];      // アイテム一覧
let firePower = 2;   // 爆風の長さ
let maxBombs = 1;    // 同時に置ける爆弾数

/* ===== ステージ生成 ===== */
function generateStage() {
  const stage = [];
  for (let y = 0; y < ROWS; y++) {
    stage[y] = [];
    for (let x = 0; x < COLS; x++) {
      if (
        y === 0 || y === ROWS - 1 ||
        x === 0 || x === COLS - 1 ||
        (y % 2 === 0 && x % 2 === 0)
      ) {
        stage[y][x] = 1;
      } else {
        stage[y][x] = Math.random() < 0.35 ? 2 : 0;
      }
    }
  }

  stage[1][1] = stage[1][2] = stage[2][1] = 0;
  stage[13][13] = stage[13][12] = stage[12][13] = 0;

  placeItems(stage);
  return stage;
}

/* ===== アイテム配置 ===== */
function placeItems(stage) {
  const breakable = [];

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (stage[y][x] === 2) breakable.push({ x, y });
    }
  }

  const shuffle = breakable.sort(() => Math.random() - 0.5);

  items = [
    { x: shuffle[0].x, y: shuffle[0].y, type: "fire", visible: false },
    { x: shuffle[1].x, y: shuffle[1].y, type: "bomb", visible: false }
  ];
}

/* ===== ステージ初期化 ===== */
function resetStage() {
  map = generateStage();
  player = { x: 1, y: 1 };
  enemy = { x: 13, y: 13, alive: true };
  bombs = [];
  explosions = [];
  enemyCooldown = 0;

  firePower = 2;
  maxBombs = 1;

  gameOver = false;
  gamePaused = false;
}

/* ===== ゲーム開始 ===== */
function startGame() {
  gameStarted = true;
  gamePaused = false;
  gameOver = false;

  resetStage();

  document.getElementById("uiLayer").classList.add("hidden");

  requestAnimationFrame(gameLoop);
}
