const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
const ROWS = 15;
const COLS = 15;
const DIRS = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];

let gameStarted=false, gamePaused=false, animationId=null;

document.getElementById("startButton").onclick=()=>{
  document.getElementById("titleScreen").style.display="none";
  gameStarted=true;
  loop();
};

/* ===== ステージ ===== */

function generateStage(p){
  const s=[];
  for(let y=0;y<ROWS;y++){
    s[y]=[];
    for(let x=0;x<COLS;x++){
      if(y===0||x===0||y===ROWS-1||x===COLS-1) s[y][x]=1;
      else if(y%2===0&&x%2===0) s[y][x]=1;
      else s[y][x]=p[Math.floor(y/3)][Math.floor(x/3)]===2?2:0;
    }
  }
  s[1][1]=s[1][2]=s[2][1]=0;
  s[13][13]=s[12][13]=s[13][12]=0;
  return s;
}

const stages=[
  generateStage([[3,3,3,3,3],[3,2,0,2,3],[3,0,2,0,3],[3,2,0,2,3],[3,3,3,3,3]]),
  generateStage([[3,2,0,2,3],[2,0,2,0,2],[0,2,0,2,0],[2,0,2,0,2],[3,2,0,2,3]])
];

let currentStage=0, map;
let player, enemy, bomb=null;
let explosions=[], explosionTimer=0, particles=[];
let lookX=0, lookY=1;
let enemyCooldown=0;

/* ===== 初期化 ===== */

function resetStage(){
  map=JSON.parse(JSON.stringify(stages[currentStage]));
  player={x:1,y:1};
  enemy={x:13,y:13,alive:true};
  bomb=null;
  explosions=[];
  particles=[];
  explosionTimer=0;
  enemyCooldown=0;
}

resetStage();

/* ===== 入力 ===== */

document.addEventListener("keydown",e=>{
  if(!gameStarted||gamePaused) return;

  let nx=player.x, ny=player.y;
  if(e.key==="ArrowUp"){ny--;lookX=0;lookY=-1;}
  if(e.key==="ArrowDown"){ny++;lookX=0;lookY=1;}
  if(e.key==="ArrowLeft"){nx--;lookX=-1;lookY=0;}
  if(e.key==="ArrowRight"){nx++;lookX=1;lookY=0;}

  if(map[ny]?.[nx]===0){player.x=nx;player.y=ny;}

  if(e.key===" "&&!bomb){
    bomb={x:player.x,y:player.y,timer:60};
  }
});

/* ===== 爆弾 ===== */

function getExplosionTiles(b){
  const t=[{x:b.x,y:b.y}];
  for(const d of DIRS){
    for(let i=1;i<=2;i++){
      const nx=b.x+d.x*i, ny=b.y+d.y*i;
      if(!map[ny]||map[ny][nx]===1) break;
      t.push({x:nx,y:ny});
      if(map[ny][nx]===2) break;
    }
  }
  return t;
}

function spawnParticles(x,y){
  for(let i=0;i<10;i++){
    particles.push({
      x:x*TILE+16,
      y:y*TILE+16,
      vx:(Math.random()-0.5)*4,
      vy:(Math.random()-0.5)*4,
      life:30
    });
  }
}

function updateBomb(){
  if(!bomb||gamePaused) return;
  bomb.timer--;

  if(bomb.timer<=0){
    explosions=getExplosionTiles(bomb);
    explosionTimer=60; // ★ 1秒
    for(const e of explosions){
      spawnParticles(e.x,e.y);
      if(map[e.y][e.x]===2) map[e.y][e.x]=0;
      if(player.x===e.x&&player.y===e.y) lose();
      if(enemy.alive&&enemy.x===e.x&&enemy.y===e.y) enemy.alive=false;
    }
    bomb=null;
  }

  if(explosionTimer>0){
    explosionTimer--;
    if(explosionTimer===0) explosions=[];
  }
}

/* ===== CPU ===== */

function isDanger(x,y){
  if(!bomb) return false;
  return getExplosionTiles(bomb).some(e=>e.x===x&&e.y===y);
}

function updateEnemy(){
  if(!enemy.alive||gamePaused) return;
  if(enemyCooldown-->0) return;
  enemyCooldown=15;

  // 爆風回避
  if(isDanger(enemy.x,enemy.y)){
    let best=null, bestDist=-1;
    for(const d of DIRS){
      const nx=enemy.x+d.x, ny=enemy.y+d.y;
      if(map[ny]?.[nx]!==0||isDanger(nx,ny)) continue;
      const dist=Math.abs(nx-bomb.x)+Math.abs(ny-bomb.y);
      if(dist>bestDist){bestDist=dist;best={x:nx,y:ny};}
    }
    if(best){enemy.x=best.x;enemy.y=best.y;}
    return;
  }

  // 壊せるブロックを狙う
  for(const d of DIRS){
    const nx=enemy.x+d.x, ny=enemy.y+d.y;
    if(map[ny]?.[nx]===2&&!bomb){
      bomb={x:enemy.x,y:enemy.y,timer:60};
      return;
    }
  }

  // プレイヤー接近
  const dist=Math.abs(enemy.x-player.x)+Math.abs(enemy.y-player.y);
  if(dist<=3&&!bomb){
    bomb={x:enemy.x,y:enemy.y,timer:60};
    return;
  }

  // 追跡移動
  let best=null, bestDist=Infinity;
  for(const d of DIRS){
    const nx=enemy.x+d.x, ny=enemy.y+d.y;
    if(map[ny]?.[nx]!==0) continue;
    const d2=Math.abs(nx-player.x)+Math.abs(ny-player.y);
    if(d2<bestDist){bestDist=d2;best={x:nx,y:ny};}
  }
  if(best){enemy.x=best.x;enemy.y=best.y;}
}

/* ===== 勝敗 ===== */

function showMessage(text,cb){
  gamePaused=true;
  cancelAnimationFrame(animationId);
  const box=document.getElementById("messageBox");
  document.getElementById("messageText").textContent=text;
  box.classList.remove("hidden");
  box.classList.add("show");
  document.getElementById("retryButton").onclick=()=>{
    box.classList.add("hidden");
    cb();
    gamePaused=false;
    loop();
  };
}

function lose(){showMessage("You Lose…",resetStage);}
function win(){
  showMessage("You Win!",()=>{
    currentStage=(currentStage+1)%stages.length;
    resetStage();
  });
}

/* ===== 描画 ===== */

function drawEyes(cx,cy,dx,dy){
  dx=Math.max(-1,Math.min(1,dx));
  dy=Math.max(-1,Math.min(1,dy));
  for(const s of[-1,1]){
    ctx.fillStyle="white";
    ctx.beginPath();
    ctx.arc(cx+s*7,cy-4,6,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle="black";
    ctx.beginPath();
    ctx.arc(cx+s*7+dx*3,cy-4+dy*3,3,0,Math.PI*2);
    ctx.fill();
  }
}

function drawBomb(b){
  const cx=b.x*TILE+16, cy=b.y*TILE+16;
  ctx.fillStyle="#ccc";
  ctx.strokeStyle="black";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.arc(cx,cy,10,0,Math.PI*2);
  ctx.fill(); ctx.stroke();

  ctx.strokeStyle="orange";
  ctx.beginPath();
  ctx.moveTo(cx+6,cy-6);
  ctx.lineTo(cx+14,cy-14);
  ctx.stroke();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(map[y][x]===1) ctx.fillStyle="#666";
    if(map[y][x]===2) ctx.fillStyle="#A66";
    if(map[y][x]) ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
  }

  if(bomb) drawBomb(bomb);

  for(const e of explosions){
    const cx=e.x*TILE+16, cy=e.y*TILE+16;
    const g=ctx.createRadialGradient(cx,cy,5,cx,cy,20);
    g.addColorStop(0,"white");
    g.addColorStop(0.5,"yellow");
    g.addColorStop(1,"orange");
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(cx,cy,20,0,Math.PI*2);
    ctx.fill();
  }

  particles.forEach(p=>{
    ctx.fillStyle="yellow";
    ctx.fillRect(p.x,p.y,3,3);
    p.x+=p.vx; p.y+=p.vy; p.life--;
  });
  particles=particles.filter(p=>p.life>0);

  let cx=player.x*TILE+16, cy=player.y*TILE+16;
  ctx.fillStyle="cyan";
  ctx.beginPath(); ctx.arc(cx,cy,14,0,Math.PI*2); ctx.fill();
  drawEyes(cx,cy,lookX,lookY);

  if(enemy.alive){
    cx=enemy.x*TILE+16; cy=enemy.y*TILE+16;
    ctx.fillStyle="red";
    ctx.beginPath(); ctx.arc(cx,cy,14,0,Math.PI*2); ctx.fill();
    drawEyes(cx,cy,player.x-enemy.x,player.y-enemy.y);
  }
}

/* ===== ループ ===== */

function loop(){
  if(!gameStarted||gamePaused) return;
  updateEnemy();
  updateBomb();
  if(!enemy.alive) win();
  draw();
  animationId=requestAnimationFrame(loop);
}
