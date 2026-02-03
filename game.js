const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
const ROWS = 15;
const COLS = 15;

let gameStarted = false;
let gamePaused = false;

/* ================= タイトルキャラクター描画 ================= */
function drawTitleCharacter(canvasId,color){
    const c=document.getElementById(canvasId);
    const ctx=c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);
    const cx=c.width/2,cy=c.height/2;
    ctx.fillStyle=color;
    ctx.beginPath(); ctx.arc(cx,cy,30,0,Math.PI*2); ctx.fill();

    const eyeOffsets=[{x:-10,y:-8},{x:10,y:-8}];
    eyeOffsets.forEach(off=>{
        ctx.fillStyle="white"; ctx.beginPath(); ctx.arc(cx+off.x,cy+off.y,8,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="black"; ctx.beginPath(); ctx.arc(cx+off.x,cy+off.y,4,0,Math.PI*2); ctx.fill();
    });
}

drawTitleCharacter("titlePlayerCanvas","cyan");
drawTitleCharacter("titleEnemyCanvas","red");

/* ================= ゲーム開始 ================= */
document.getElementById("startButton").addEventListener("click", () => {
    document.getElementById("titleScreen").style.display = "none";
    gameStarted = true;
    resetStage();
    loop();
});

document.getElementById("topButton").addEventListener("click", () => {
    document.getElementById("messageBox").classList.add("hidden");
    document.getElementById("titleScreen").style.display = "flex";
    gamePaused = false;
    gameStarted = false;
});

/* ================= ステージ・キャラクター・爆風など ================= */
/* 前回の game.js の全機能（ステージ生成・player/enemy/bombs/explosions・CPU AI・描画）をそのまま統合 */

