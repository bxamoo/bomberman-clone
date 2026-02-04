let gameStarted = false;
let gamePaused = true;
let gameOver = false;

let map, player, enemy, bombs, explosions, enemyCooldown;

function generateStage() {
  const stage = [];
  for (let y = 0; y < ROWS; y++) {
    stage[y] = [];
    for (let x = 0; x < COLS; x++) {
      if (
        y === 0 || y === ROWS - 1 ||
        x === 0 || x === COLS - 1 ||
        (y % 2 === 0 && x % 2 === 0)
      ) stage[y][x] = 1;
      else stage[y][x] = Math.random() < 0.35 ? 2 : 0;
    }
  }
  stage[1][1] = stage[1][2] = stage[2][1] = 0;
  stage[13][13] = stage[13][12] = stage[12][13] = 0;
  return stage;
}

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
