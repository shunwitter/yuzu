// ===== 設定 =====
const W = 800;
const H = 500;
const PIG_SIZE = 110;
const GRAVITY = 0.4;
const JUMP_FORCE = -7;
const OBSTACLE_SPEED_INIT = 4;
const OBSTACLE_INTERVAL = 90; // フレーム数

// ===== 状態 =====
let pig, pigImg;
let obstacles = [];
let bubbles = [];
let splashes = [];
let score = 0;
let hiScore = 0;
let frame = 0;
let gameState = 'start'; // 'start' | 'play' | 'over'
let obstacleSpeed;
let swimAngle = 0; // 泳ぎモーションのアニメ用

// ===== p5.js 関数 =====

function preload() {
  pigImg = loadImage('pig.png');
}

function setup() {
  createCanvas(W, H);
  imageMode(CENTER);
  textFont('monospace');
  resetGame();
}

function draw() {
  drawOcean();

  if (gameState === 'start') {
    drawStart();
  } else if (gameState === 'play') {
    updateGame();
    drawGame();
  } else if (gameState === 'over') {
    drawGame();
    drawGameOver();
  }
}

// ----- 背景 -----

function drawOcean() {
  // グラデーション背景（空→海）
  for (let y = 0; y < H; y++) {
    let c = lerpColor(color('#87CEEB'), color('#006994'), y / H);
    stroke(c);
    line(0, y, W, y);
  }

  // 泡
  updateBubbles();
}

function updateBubbles() {
  if (frame % 8 === 0) {
    bubbles.push({ x: random(W), y: H + 10, r: random(4, 12), speed: random(1, 3) });
  }
  for (let b of bubbles) {
    b.y -= b.speed;
    noFill();
    stroke(255, 255, 255, 120);
    strokeWeight(1.5);
    ellipse(b.x, b.y, b.r);
  }
  bubbles = bubbles.filter(b => b.y > -20);
}

// ----- ゲームロジック -----

function resetGame() {
  pig = { x: 150, y: H / 2, vy: 0 };
  obstacles = [];
  splashes = [];
  score = 0;
  frame = 0;
  obstacleSpeed = OBSTACLE_SPEED_INIT;
}

function updateGame() {
  frame++;
  swimAngle += 0.15;

  // 豚の物理
  pig.vy += GRAVITY;
  pig.y += pig.vy;

  // 画面端の制限
  pig.y = constrain(pig.y, PIG_SIZE / 2, H - PIG_SIZE / 2);
  if (pig.y <= PIG_SIZE / 2 || pig.y >= H - PIG_SIZE / 2) {
    pig.vy = 0;
  }

  // 障害物の生成
  if (frame % OBSTACLE_INTERVAL === 0) {
    spawnObstacle();
  }

  // 障害物の更新
  for (let o of obstacles) {
    o.x -= obstacleSpeed;
  }
  obstacles = obstacles.filter(o => o.x > -80);

  // 衝突判定
  for (let o of obstacles) {
    if (hitCheck(pig, o)) {
      if (score > hiScore) hiScore = score;
      gameState = 'over';
      return;
    }
  }

  // スコア＆スピードアップ
  score++;
  if (frame % 300 === 0) {
    obstacleSpeed = min(obstacleSpeed + 0.5, 12);
  }
}

function spawnObstacle() {
  // 上下いずれかまたは両方に障害物を出す
  let type = floor(random(3)); // 0:上, 1:下, 2:両方
  let gap = random(220, 300);
  let centerY = random(H * 0.3, H * 0.7);

  if (type === 0 || type === 2) {
    obstacles.push({ x: W + 40, y: centerY - gap / 2 - 50, w: 28, h: centerY - gap / 2 });
  }
  if (type === 1 || type === 2) {
    let topY = centerY + gap / 2;
    obstacles.push({ x: W + 40, y: topY, w: 28, h: H - topY });
  }
}

function hitCheck(p, o) {
  let margin = 18; // 当たり判定を少し小さめに
  let px = p.x, py = p.y;
  let r = PIG_SIZE / 2 - margin;
  return (
    px + r > o.x - o.w / 2 &&
    px - r < o.x + o.w / 2 &&
    py + r > o.y &&
    py - r < o.y + o.h
  );
}

// ----- 描画 -----

function drawGame() {
  // 障害物（海藻っぽく）
  for (let o of obstacles) {
    let c = color('#228B22');
    noStroke();
    fill(c);
    rectMode(CENTER);
    // 少し揺れるアニメ
    let wobble = sin(frame * 0.05 + o.y * 0.01) * 4;
    rect(o.x + wobble, o.y + o.h / 2, o.w, o.h, 8);

    // ハイライト
    fill(255, 255, 255, 40);
    rect(o.x + wobble - 6, o.y + o.h / 2, 8, o.h - 10, 4);
  }
  rectMode(CORNER);

  // 豚（上下に揺れる泳ぎモーション）
  let swimY = sin(swimAngle) * 5;
  let tilt = sin(swimAngle) * 8; // 少し傾く

  push();
  translate(pig.x, pig.y + swimY);
  rotate(radians(tilt + constrain(pig.vy * 3, -25, 25)));

  // 常時の小さな水しぶき（ゆっくり流れる）
  if (frame % 3 === 0) {
    splashes.push({ x: random(-PIG_SIZE / 2, PIG_SIZE / 2), y: random(-PIG_SIZE / 4, PIG_SIZE / 4), r: random(3, 8), life: 40, vx: random(-0.5, 0.5), vy: random(-0.3, 0.3) });
  }
  if (abs(pig.vy) > 4 && frame % 2 === 0) {
    for (let i = 0; i < 2; i++) {
      splashes.push({ x: random(-25, 25), y: random(-15, 15), r: random(5, 12), life: 50, vx: random(-0.8, 0.8), vy: random(-0.5, 0.5) });
    }
  }
  for (let s of splashes) {
    noStroke();
    fill(200, 230, 255, map(s.life, 0, 50, 0, 140));
    ellipse(s.x, s.y, s.r);
    s.x += s.vx;
    s.y += s.vy;
    s.life--;
  }

  image(pigImg, 0, 0, PIG_SIZE, PIG_SIZE);
  pop();

  splashes = splashes.filter(s => s.life > 0);

  // スコア
  noStroke();
  fill(255);
  textSize(22);
  textAlign(LEFT);
  text(`SCORE: ${score}`, 20, 35);
  textAlign(RIGHT);
  text(`BEST: ${hiScore}`, W - 20, 35);
}

function drawStart() {
  // タイトル背景
  fill(0, 0, 0, 150);
  noStroke();
  rectMode(CENTER);
  rect(W / 2, H / 2, 420, 260, 20);
  rectMode(CORNER);

  // タイトル
  fill(255, 220, 50);
  textSize(42);
  textAlign(CENTER);
  text('🐷 Swimming Pig', W / 2, H / 2 - 60);

  fill(255);
  textSize(18);
  text('SPACE or クリック でジャンプ', W / 2, H / 2);
  text('障害物を避けながら泳ごう！', W / 2, H / 2 + 35);

  fill(100, 255, 100);
  textSize(22);
  text('▶  スタート  ◀', W / 2, H / 2 + 90);

  textAlign(LEFT);
}

function drawGameOver() {
  fill(0, 0, 0, 160);
  noStroke();
  rectMode(CENTER);
  rect(W / 2, H / 2, 380, 240, 20);
  rectMode(CORNER);

  fill(255, 80, 80);
  textSize(42);
  textAlign(CENTER);
  text('GAME OVER', W / 2, H / 2 - 60);

  fill(255);
  textSize(22);
  text(`スコア: ${score}`, W / 2, H / 2 - 10);
  text(`ベスト: ${hiScore}`, W / 2, H / 2 + 30);

  fill(100, 220, 255);
  textSize(18);
  text('SPACE or クリック でリスタート', W / 2, H / 2 + 80);

  textAlign(LEFT);
}

// ----- 入力 -----

function keyPressed() {
  if (key === ' ' || keyCode === UP_ARROW || keyCode === ENTER) {
    handleInput();
  }
}

function mousePressed() {
  handleInput();
}

function touchStarted() {
  handleInput();
  return false; // スクロール防止
}

function handleInput() {
  if (gameState === 'start') {
    gameState = 'play';
  } else if (gameState === 'play') {
    pig.vy = JUMP_FORCE;
  } else if (gameState === 'over') {
    resetGame();
    gameState = 'play';
  }
}
