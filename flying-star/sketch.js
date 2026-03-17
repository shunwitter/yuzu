// ===== 設定 =====
const W = 800;
const H = 500;
const STAR_W = 140;
const STAR_H = 100; // 原画比率 400:287 ≈ 1.4:1
const GRAVITY = 0.4;
const JUMP_FORCE = -7;
const OBSTACLE_SPEED_INIT = 4;
const OBSTACLE_INTERVAL = 90; // フレーム数

// ===== 状態 =====
let star, starImg;
let obstacles = [];
let bgStars = [];
let sparkles = [];
let shootingStars = [];
let score = 0;
let hiScore = 0;
let frame = 0;
let gameState = 'start'; // 'start' | 'play' | 'over'
let obstacleSpeed;
let flyAngle = 0; // 飛びモーションのアニメ用

// ===== p5.js 関数 =====

function preload() {
  starImg = loadImage('star.png');
}

function setup() {
  createCanvas(W, H);
  imageMode(CENTER);
  textFont('monospace');
  // 背景の星を初期化
  for (let i = 0; i < 120; i++) {
    bgStars.push({
      x: random(W),
      y: random(H),
      r: random(1, 3.5),
      twinkle: random(TWO_PI),
      speed: random(0.02, 0.08)
    });
  }
  resetGame();
}

function draw() {
  drawNightSky();

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

function drawNightSky() {
  // グラデーション背景（夜空）
  for (let y = 0; y < H; y++) {
    let c = lerpColor(color('#0a0a2e'), color('#1a1a4e'), y / H);
    stroke(c);
    line(0, y, W, y);
  }

  // 背景の星（瞬き）
  noStroke();
  for (let s of bgStars) {
    s.twinkle += s.speed;
    let alpha = map(sin(s.twinkle), -1, 1, 60, 255);
    fill(255, 255, 220, alpha);
    ellipse(s.x, s.y, s.r);
  }

  // 流れ星
  updateShootingStars();
}

function updateShootingStars() {
  if (frame % 120 === 0 && random() > 0.3) {
    shootingStars.push({
      x: random(W * 0.2, W),
      y: random(H * 0.1, H * 0.4),
      len: random(40, 80),
      speed: random(6, 10),
      life: 30
    });
  }
  for (let s of shootingStars) {
    let tailX = s.x + s.len * 0.7;
    let tailY = s.y - s.len * 0.3;
    stroke(255, 255, 200, map(s.life, 0, 30, 0, 200));
    strokeWeight(2);
    line(s.x, s.y, tailX, tailY);
    // 光る先端
    noStroke();
    fill(255, 255, 220, map(s.life, 0, 30, 0, 255));
    ellipse(s.x, s.y, 4);
    s.x -= s.speed;
    s.y += s.speed * 0.4;
    s.life--;
  }
  shootingStars = shootingStars.filter(s => s.life > 0);
}

// ----- ゲームロジック -----

function resetGame() {
  star = { x: 150, y: H / 2, vy: 0 };
  obstacles = [];
  sparkles = [];
  score = 0;
  frame = 0;
  obstacleSpeed = OBSTACLE_SPEED_INIT;
}

function updateGame() {
  frame++;
  flyAngle += 0.15;

  // 星の物理
  star.vy += GRAVITY;
  star.y += star.vy;

  // 画面端の制限
  star.y = constrain(star.y, STAR_H / 2, H - STAR_H / 2);
  if (star.y <= STAR_H / 2 || star.y >= H - STAR_H / 2) {
    star.vy = 0;
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
    if (hitCheck(star, o)) {
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
  let margin = 18;
  let px = p.x, py = p.y;
  let r = STAR_H / 2 - margin;
  return (
    px + r > o.x - o.w / 2 &&
    px - r < o.x + o.w / 2 &&
    py + r > o.y &&
    py - r < o.y + o.h
  );
}

// ----- 描画 -----

function drawGame() {
  // 障害物（隕石の柱っぽく）
  for (let o of obstacles) {
    noStroke();
    // メインの柱
    fill(80, 60, 100);
    rectMode(CENTER);
    let wobble = sin(frame * 0.03 + o.y * 0.01) * 3;
    rect(o.x + wobble, o.y + o.h / 2, o.w, o.h, 8);

    // 光るエッジ
    fill(140, 100, 180, 80);
    rect(o.x + wobble - 6, o.y + o.h / 2, 8, o.h - 10, 4);

    // 小さな光の点
    fill(200, 180, 255, 60);
    for (let i = 0; i < 3; i++) {
      let dotY = o.y + o.h * (0.2 + i * 0.3);
      ellipse(o.x + wobble + sin(frame * 0.05 + i) * 3, dotY, 4);
    }
  }
  rectMode(CORNER);

  // 星キャラ（上下に揺れる飛びモーション）
  let flyY = sin(flyAngle) * 5;
  let tilt = sin(flyAngle) * 8;

  push();
  translate(star.x, star.y + flyY);
  rotate(radians(tilt + constrain(star.vy * 3, -25, 25)));

  // キラキラエフェクト（常時）
  if (frame % 3 === 0) {
    sparkles.push({
      x: random(-STAR_W / 2, STAR_W / 2),
      y: random(-STAR_H / 4, STAR_H / 4),
      r: random(3, 8),
      life: 40,
      vx: random(-0.8, -0.2),
      vy: random(-0.3, 0.3)
    });
  }
  // ジャンプ時の追加キラキラ
  if (abs(star.vy) > 4 && frame % 2 === 0) {
    for (let i = 0; i < 2; i++) {
      sparkles.push({
        x: random(-25, 25),
        y: random(-15, 15),
        r: random(5, 12),
        life: 50,
        vx: random(-1.2, -0.3),
        vy: random(-0.5, 0.5)
      });
    }
  }
  for (let s of sparkles) {
    noStroke();
    let alpha = map(s.life, 0, 50, 0, 200);
    fill(255, 255, 150, alpha);
    ellipse(s.x, s.y, s.r);
    // 十字の輝き
    fill(255, 255, 200, alpha * 0.5);
    ellipse(s.x, s.y, s.r * 0.3, s.r * 2);
    ellipse(s.x, s.y, s.r * 2, s.r * 0.3);
    s.x += s.vx;
    s.y += s.vy;
    s.life--;
  }

  image(starImg, 0, 0, STAR_W, STAR_H);
  pop();

  sparkles = sparkles.filter(s => s.life > 0);

  // スコア
  noStroke();
  fill(255, 255, 200);
  textSize(22);
  textAlign(LEFT);
  text(`SCORE: ${score}`, 20, 35);
  textAlign(RIGHT);
  text(`BEST: ${hiScore}`, W - 20, 35);
}

function drawStart() {
  // タイトル背景
  fill(0, 0, 30, 180);
  noStroke();
  rectMode(CENTER);
  rect(W / 2, H / 2, 420, 260, 20);
  rectMode(CORNER);

  // タイトル
  fill(255, 220, 80);
  textSize(42);
  textAlign(CENTER);
  text('⭐ Flying Star', W / 2, H / 2 - 60);

  fill(255, 255, 220);
  textSize(18);
  text('SPACE or クリック でジャンプ', W / 2, H / 2);
  text('障害物を避けながら夜空を飛ぼう！', W / 2, H / 2 + 35);

  fill(255, 220, 100);
  textSize(22);
  text('▶  スタート  ◀', W / 2, H / 2 + 90);

  textAlign(LEFT);
}

function drawGameOver() {
  fill(0, 0, 30, 180);
  noStroke();
  rectMode(CENTER);
  rect(W / 2, H / 2, 380, 240, 20);
  rectMode(CORNER);

  fill(255, 80, 80);
  textSize(42);
  textAlign(CENTER);
  text('GAME OVER', W / 2, H / 2 - 60);

  fill(255, 255, 220);
  textSize(22);
  text(`スコア: ${score}`, W / 2, H / 2 - 10);
  text(`ベスト: ${hiScore}`, W / 2, H / 2 + 30);

  fill(255, 220, 100);
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
    star.vy = JUMP_FORCE;
  } else if (gameState === 'over') {
    resetGame();
    gameState = 'play';
  }
}
