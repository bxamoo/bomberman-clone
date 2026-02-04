let gameStarted = false;
let gamePaused = true;
let gameOver = false;

let map, player, enemy, bombs, explosions, enemyCooldown;

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
        stage[y][x] = 1; // 固定壁
      } else {
        stage[y][x] = Math.random() < 0.35 ? 2 : 0; // 壊せる壁 or 空白
      }
    }
  }

  // プレイヤーと敵の初期位置周りは空白にする
  stage[1][1] = stage[1][2] = stage[2][1] = 0;
  stage[13][13] = stage[13][12] = stage[12][13] = 0;

  return stage;
}

/* ===== ステージ初期化 ===== */
function resetStage() {
  map = generateStage();
  player = { x: 1, y: 1 };
  enemy = { x: 13, y: 13, alive: true };
  bombs = [];
  explosions = [];
  enemyCooldown = 0;

  gameOver = false;
  gamePaused = false;
}

/* ===== ゲーム開始処理 ===== */
function startGame() {
  if (gameStarted) return; // 二重起動防止

  gameStarted = true;
  gamePaused = false;
  gameOver = false;

  resetStage();

  // スタート画面を消す
  const uiLayer = document.getElementById("uiLayer");
  uiLayer.classList.add("hidden");

  // ゲームループ開始（logic.js 側で gameLoop が定義されている想定）
  requestAnimationFrame(gameLoop);
}
