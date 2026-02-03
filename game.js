const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
const ROWS = 15;
const COLS = 15;

let gameStarted = false;
let gamePaused = false;

document.getElementById("startButton").addEventListener("click", () => {
    document.getElementById("titleScreen").style.display = "none";
    gameStarted = true;
    gamePaused = false;
    loop();
});

/* ================== ステージ生成 ================== */
function generateStage(pattern5x5) {
    const stage = [];
    for (let y = 0; y < ROWS; y++) {
        stage[y] = [];
        for (let x = 0; x < COLS; x++) {
            if (y === 0 || y === ROWS-1 || x === 0 || x === COLS-1) { stage[y][x]=1; continue; }
            if (y%2===0 && x%2===0) { stage[y][x]=1; continue; }

            const py = Math.floor(y/3);
            const px = Math.floor(x/3);
            const v = pattern5x5[py][px];
            stage[y][x] = (v===2 ? 2 : 0);
        }
    }
    stage[1][1]=stage[1][2]=stage[2][1]=0;
    stage[13][13]=stage[13][12]=stage[12][13]=0;
    return stage;
}

const stages = [
    generateStage([[3,3,3,3,3],[3,2,0,2,3],[3,0,2,0,3],[3,2,0,2,3],[3,3,3,3,3]])
];

let currentStage=0;
let map = JSON.parse(JSON.stringify(stages[currentStage]));

let player = { x:1, y:1 };
let enemy = { x:13, y:13, alive:true };

let bombs = [];
let explosions = [];

/* ================== メッセージ ================== */
function showMessage(text, callback) {
    const box = document.getElementById("messageBox");
    const msg = document.getElementById("messageText");
    const retry = document.getElementById("retryButton");
    let topBtn = document.getElementById("topButton");

    if(!topBtn){
        topBtn = document.createElement("button");
        topBtn.id = "topButton";
        topBtn.textContent = "Top";
        topBtn.style.marginTop = "20px";
        topBtn.style.fontSize = "28px";
        topBtn.style.padding = "10px 30px";
        topBtn.style.borderRadius = "10px";
        topBtn.style.border = "2px solid white";
        topBtn.style.background = "#444";
        topBtn.style.color = "white";
        topBtn.style.cursor = "pointer";
        box.appendChild(topBtn);
    }

    msg.textContent = text;
    box.classList.remove("hidden");
    gamePaused = true;

    setTimeout(()=>box.classList.add("show"), 10);

    function close() {
        box.classList.remove("show");
        setTimeout(()=>{
            box.classList.add("hidden");
            retry.removeEventListener("click", close);
            topBtn.removeEventListener("click", toTop);
            callback();
            gamePaused=false;
            loop();
        },300);
    }

    function toTop() {
        box.classList.remove("show");
        setTimeout(()=>{
            box.classList.add("hidden");
            retry.removeEventListener("click", close);
            topBtn.removeEventListener("click", toTop);
            resetStage();
            gamePaused=false;
            gameStarted=false;
            document.getElementById("titleScreen").style.display="flex";
        },300);
    }

    retry.addEventListener("click", close);
    topBtn.addEventListener("click", toTop);
}

/* ================== キー入力 ================== */
let keyPressed = {};
document.addEventListener("keydown", e => {
    if(!gameStarted || gamePaused) return;
    if(!keyPressed[e.key]){
        keyPressed[e.key]=true;
        handleKeyPress(e.key);
    }
});
document.addEventListener("keyup", e => keyPressed[e.key]=false);

function handleKeyPress(key){
    let nx=player.x, ny=player.y;
    if(key==="ArrowUp") ny--;
    if(key==="ArrowDown") ny++;
    if(key==="ArrowLeft") nx--;
    if(key==="ArrowRight") nx++;
    if(canMove(nx,ny)) { player.x=nx; player.y=ny; }

    if(key===" " && !bombs.find(b=>b.owner==="player")){
        bombs.push({x:player.x, y:player.y, timer:120, owner:"player"});
    }
}

/* ================== 移動判定 ================== */
function canMove(x,y){ return map[y] && map[y][x]===0; }

/* ================== 爆風範囲 ================== */
function getExplosionTiles(b){
    if(!b) return [];
    let tiles=[{x:b.x,y:b.y}];
    const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
    for(let d of dirs){
        for(let i=1;i<=2;i++){
            let nx=b.x+d.x*i, ny=b.y+d.y*i;
            if(!map[ny]||map[ny][nx]===undefined) break;
            tiles.push({x:nx,y:ny});
            if(map[ny][nx]===1) break;
        }
    }
    return tiles;
}

function getDangerTiles(){
    const set=new Set();
    bombs.forEach(b=>getExplosionTiles(b).forEach(t=>set.add(`${t.x},${t.y}`)));
    return set;
}

/* ================== 爆弾処理 ================== */
function updateBombs(){
    for(let i=bombs.length-1;i>=0;i--){
        let b=bombs[i];
        b.timer--;
        if(b.timer<=0){
            let tiles=getExplosionTiles(b);
            explosions.push({tiles,timer:60});
            tiles.forEach(e=>{ if(map[e.y]&&map[e.y][e.x]===2) map[e.y][e.x]=0; });

            tiles.forEach(e=>{ if(player.x===e.x&&player.y===e.y) showMessage("You Lose…",()=>resetStage()); });
            tiles.forEach(e=>{ if(enemy.x===e.x&&enemy.y===e.y) enemy.alive=false; });

            bombs.splice(i,1);
        }
    }
    for(let i=explosions.length-1;i>=0;i--){
        explosions[i].timer--;
        if(explosions[i].timer<=0) explosions.splice(i,1);
    }
}

/* ================== ステージリセット ================== */
function resetStage(){
    map=JSON.parse(JSON.stringify(stages[currentStage]));
    player={x:1,y:1};
    enemy={x:13,y:13,alive:true};
    bombs=[];
    explosions=[];
    enemyCooldown=0;
}

/* ================== ステージクリア判定 ================== */
function checkStageClear(){
    if(!enemy.alive){
        showMessage("You Win!",()=>{
            let prev=currentStage;
            do{ currentStage=Math.floor(Math.random()*stages.length);} while(currentStage===prev);
            resetStage();
        });
    }
}

/* ================== 敵AI ================== */
let enemyCooldown=0;
function enemyAI(){
    if(!enemy.alive||gamePaused) return;
    if(enemyCooldown>0){ enemyCooldown--; return; }
    enemyCooldown=12+Math.floor(Math.random()*6);

    const danger=getDangerTiles();
    const ek=`${enemy.x},${enemy.y}`;
    const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];

    // 爆風回避を最優先
    if(danger.has(ek)){
        let safeMoves=dirs.map(d=>({x:enemy.x+d.x,y:enemy.y+d.y}))
            .filter(p=>canMove(p.x,p.y)&&!danger.has(`${p.x},${p.y}`));
        if(safeMoves.length>0){
            let move=safeMoves[Math.floor(Math.random()*safeMoves.length)];
            enemy.x=move.x; enemy.y=move.y; 
            return;
        }
        // どうしても安全がない場合は動かさない
        return;
    }

    // 壊せる壁より安全移動を優先
    let safeDirs=dirs.map(d=>({x:enemy.x+d.x,y:enemy.y+d.y}))
        .filter(p=>canMove(p.x,p.y)&&!danger.has(`${p.x},${p.y}`));
    if(safeDirs.length>0 && !bombs.find(b=>b.owner==="enemy")){
        // 壊せる壁が近くにあれば置くが、安全移動を優先
        const breakableDirs=dirs.map(d=>({x:enemy.x+d.x,y:enemy.y+d.y}))
            .filter(p=>map[p.y]&&map[p.x]===2);
        if(breakableDirs.length>0){
            bombs.push({x:enemy.x,y:enemy.y,timer:120,owner:"enemy"});
        }
        let move=safeDirs[Math.floor(Math.random()*safeDirs.length)];
        enemy.x=move.x; enemy.y=move.y;
        return;
    }
}

/* ================== 描画 ================== */
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // マップ
    for(let y=0;y<ROWS;y++){
        for(let x=0;x<COLS;x++){
            if(map[y][x]===1){ ctx.fillStyle="#666"; ctx.fillRect(x*TILE,y*TILE,TILE,TILE); ctx.strokeStyle="#999"; ctx.strokeRect(x*TILE,y*TILE,TILE,TILE);}
            if(map[y][x]===2){ ctx.fillStyle="#A66"; ctx.fillRect(x*TILE,y*TILE,TILE,TILE); ctx.strokeStyle="#D99"; ctx.strokeRect(x*TILE,y*TILE,TILE,TILE);}
        }
    }

    // 爆弾
    bombs.forEach(b=>{
        const cx=b.x*TILE+TILE/2, cy=b.y*TILE+TILE/2;
        ctx.fillStyle="orange";
        ctx.beginPath();
        ctx.arc(cx,cy,12,0,Math.PI*2);
        ctx.fill();
    });

    // 爆発
    explosions.forEach(ex=>{
        ctx.fillStyle="yellow";
        ex.tiles.forEach(t=>ctx.fillRect(t.x*TILE,t.y*TILE,TILE,TILE));
    });

    // キャラクター
    drawCharacter(player.x*TILE, player.y*TILE, "cyan");
    if(enemy.alive) drawCharacter(enemy.x*TILE, enemy.y*TILE, "red");
}

/* ================== ぷよ目キャラクター ================== */
function drawCharacter(px, py, color){
    const r = TILE/2-2;
    const cx = px+TILE/2;
    const cy = py+TILE/2;

    // 本体
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.fill();

    // 目（ぷよぷよ風）
    const eyeOffsetX = 6;
    const eyeOffsetY = -4;
    const whiteR = 6;
    const blackR = 3;
    const shineR = 1.5;

    // 白目
    ctx.fillStyle="white";
    ctx.beginPath();
    ctx.arc(cx-eyeOffsetX,cy+eyeOffsetY,whiteR,0,Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx+eyeOffsetX,cy+eyeOffsetY,whiteR,0,Math.PI*2);
    ctx.fill();

    // 黒目
    ctx.fillStyle="black";
    ctx.beginPath();
    ctx.arc(cx-eyeOffsetX,cy+eyeOffsetY,blackR,0,Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx+eyeOffsetX,cy+eyeOffsetY,blackR,0,Math.PI*2);
    ctx.fill();

    // ハイライト
    ctx.fillStyle="white";
    ctx.beginPath();
    ctx.arc(cx-eyeOffsetX-1,cy+eyeOffsetY-1,shineR,0,Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx+eyeOffsetX-1,cy+eyeOffsetY-1,shineR,0,Math.PI*2);
    ctx.fill();
}

/* ================== ループ ================== */
function loop(){
    if(!gameStarted) return;
    if(!gamePaused){
        updateBombs();
        enemyAI();
        checkStageClear();
        draw();
    }
    requestAnimationFrame(loop);
}
