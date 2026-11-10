(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width,
    H = canvas.height;
  const scoreEl = document.getElementById("score");
  const speedEl = document.getElementById("speed");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const titleEl = document.getElementById("title");
  const msgEl = document.getElementById("msg");
  const startBtn = document.getElementById("startBtn");

  let best = 0;
  try {
    best = parseInt(localStorage.getItem("spaceSurvivalBest"), 10) || 0;
  } catch (e) {}
  bestEl.textContent = best;

  const keys = {};
  let ship,
    rocks,
    stars,
    running = false,
    elapsed = 0,
    spawnTimer = 0,
    last = 0,
    score = 0;

  // Background stars (parallax layers)
  stars = Array.from({ length: 70 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.6 + 0.4,
    v: Math.random() * 40 + 20,
  }));

  function reset() {
    ship = { x: W / 2, y: H - 80, r: 14, speed: 300 };
    rocks = [];
    elapsed = 0;
    spawnTimer = 0;
    score = 0;
  }

  // Difficulty grows with time survived
  const speedMultiplier = () => 1 + elapsed / 20; // +1x every 20 seconds
  const spawnInterval = () => Math.max(0.28, 0.9 - elapsed * 0.012);

  function spawnRock() {
    const r = Math.random() * 20 + 12;
    const points = 9,
      shape = [];
    for (let i = 0; i < points; i++) shape.push(0.75 + Math.random() * 0.35);
    rocks.push({
      x: Math.random() * (W - r * 2) + r,
      y: -r * 2,
      r,
      v: (Math.random() * 60 + 120) * speedMultiplier(),
      drift: (Math.random() - 0.5) * 40,
      rot: 0,
      spin: (Math.random() - 0.5) * 3,
      shape,
    });
  }

  function update(dt) {
    elapsed += dt;
    score = Math.floor(elapsed * 10);

    // Ship movement
    let dx = 0,
      dy = 0;
    if (keys.ArrowLeft || keys.a) dx -= 1;
    if (keys.ArrowRight || keys.d) dx += 1;
    if (keys.ArrowUp || keys.w) dy -= 1;
    if (keys.ArrowDown || keys.s) dy += 1;
    if (dx && dy) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }
    ship.x = Math.min(
      W - ship.r,
      Math.max(ship.r, ship.x + dx * ship.speed * dt),
    );
    ship.y = Math.min(
      H - ship.r,
      Math.max(ship.r, ship.y + dy * ship.speed * dt),
    );

    // Spawn and move obstacles
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnRock();
      spawnTimer = spawnInterval();
    }
    for (const k of rocks) {
      k.y += k.v * dt;
      k.x += k.drift * dt;
      k.rot += k.spin * dt;
      if (k.x < k.r || k.x > W - k.r) k.drift *= -1;
      // Collision: circle vs circle, a bit forgiving
      const dist = Math.hypot(k.x - ship.x, k.y - ship.y);
      if (dist < k.r * 0.85 + ship.r * 0.7) {
        gameOver();
        return;
      }
    }
    rocks = rocks.filter((k) => k.y < H + k.r * 2);

    scoreEl.textContent = score;
    speedEl.textContent = speedMultiplier().toFixed(1) + "x";
  }

function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);

  // Engine flame
  const flameHeight = 18 + Math.random() * 8;

  ctx.fillStyle = "#ff6b00";
  ctx.beginPath();
  ctx.moveTo(-5, 10);
  ctx.lineTo(0, flameHeight + 12);
  ctx.lineTo(5, 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffe66d";
  ctx.beginPath();
  ctx.moveTo(-2, 12);
  ctx.lineTo(0, flameHeight + 5);
  ctx.lineTo(2, 12);
  ctx.closePath();
  ctx.fill();

  // Left wing
  ctx.fillStyle = "#159447";
  ctx.beginPath();
  ctx.moveTo(-4, -7);
  ctx.lineTo(-14, 1);
  ctx.lineTo(-14, 13);
  ctx.lineTo(-5, 9);
  ctx.closePath();
  ctx.fill();

  // Right wing
  ctx.fillStyle = "#159447";
  ctx.beginPath();
  ctx.moveTo(4, -7);
  ctx.lineTo(14, 1);
  ctx.lineTo(14, 13);
  ctx.lineTo(5, 9);
  ctx.closePath();
  ctx.fill();

  // Wing highlights
  ctx.strokeStyle = "#8cff65";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, -3);
  ctx.lineTo(-12, 3);
  ctx.lineTo(-12, 9);
  ctx.moveTo(6, -3);
  ctx.lineTo(12, 3);
  ctx.lineTo(12, 9);
  ctx.stroke();

  // Main ship body
  const bodyGradient = ctx.createLinearGradient(-8, 0, 8, 0);
  bodyGradient.addColorStop(0, "#08783d");
  bodyGradient.addColorStop(0.5, "#66ff80");
  bodyGradient.addColorStop(1, "#08783d");

  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(6, -7);
  ctx.lineTo(7, 9);
  ctx.lineTo(0, 13);
  ctx.lineTo(-7, 9);
  ctx.lineTo(-6, -7);
  ctx.closePath();
  ctx.fill();

  // Body outline
  ctx.strokeStyle = "#b2ff8c";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Cockpit frame
  ctx.fillStyle = "#073b49";
  ctx.beginPath();
  ctx.ellipse(0, -5, 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Blue glass cockpit
  const glassGradient = ctx.createLinearGradient(-3, -12, 3, 2);
  glassGradient.addColorStop(0, "#b9faff");
  glassGradient.addColorStop(0.4, "#25caff");
  glassGradient.addColorStop(1, "#07558f");

  ctx.fillStyle = glassGradient;
  ctx.beginPath();
  ctx.ellipse(0, -5, 2.8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cockpit reflection
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.7;
  ctx.fillRect(-1.5, -10, 1.5, 3);
  ctx.globalAlpha = 1;

  // Engine details
  ctx.fillStyle = "#34495e";
  ctx.fillRect(-4, 10, 8, 4);

  ctx.fillStyle = "#8cff65";
  ctx.fillRect(-2, 11, 4, 2);

  ctx.restore();
}

function drawRock(k) {
  ctx.save();
  ctx.translate(k.x, k.y);
  ctx.rotate(k.rot);

  // Create asteroid shape
  const points = [];

  k.shape.forEach((m, i) => {
    const a = (i / k.shape.length) * Math.PI * 2;
    const px = Math.cos(a) * k.r * m;
    const py = Math.sin(a) * k.r * m;

    points.push({ x: px, y: py });

    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });

  ctx.closePath();

  // Asteroid base shading
  const gradient = ctx.createRadialGradient(
    -k.r * 0.35, -k.r * 0.4, k.r * 0.1,
    0, 0, k.r * 1.2
  );

  gradient.addColorStop(0, "#c9b9a8");
  gradient.addColorStop(0.35, "#96877b");
  gradient.addColorStop(0.7, "#665950");
  gradient.addColorStop(1, "#39332f");

  ctx.fillStyle = gradient;
  ctx.fill();

  // Clip details inside asteroid
  ctx.save();
  ctx.clip();

  // Rocky surface facets
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(points[i].x, points[i].y);
    ctx.lineTo(points[next].x, points[next].y);
    ctx.closePath();

    ctx.fillStyle = i % 2 === 0
      ? "rgba(210, 190, 170, 0.12)"
      : "rgba(20, 15, 10, 0.15)";

    ctx.fill();
  }

  // Small craters
  for (let i = 0; i < 4; i++) {
    const cx = Math.cos(i * 2.4) * k.r * 0.4;
    const cy = Math.sin(i * 2.4) * k.r * 0.35;
    const size = k.r * (0.08 + (i % 2) * 0.04);

    ctx.fillStyle = "rgba(35, 29, 25, 0.3)";
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(220, 200, 180, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx - 1, cy - 1, size, Math.PI, Math.PI * 1.8);
    ctx.stroke();
  }

  ctx.restore();

  // Asteroid outline
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#51463f";
  ctx.stroke();

  // Outer highlight
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(225, 205, 185, 0.4)";
  ctx.stroke();

  ctx.restore();
}

  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    const boost = running ? speedMultiplier() : 1;
    ctx.fillStyle = "#cfd6ff";
    for (const s of stars) {
      s.y += s.v * boost * dt;
      if (s.y > H) {
        s.y = 0;
        s.x = Math.random() * W;
      }
      ctx.globalAlpha = 0.4 + s.r / 3;
      ctx.fillRect(s.x, s.y, s.r, s.r * (1 + boost * 0.6));
    }
    ctx.globalAlpha = 1;
    if (running) {
      rocks.forEach(drawRock);
      drawShip();
    }
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    if (running) update(dt);
    draw(dt);
    requestAnimationFrame(loop);
  }

  function start() {
    reset();
    running = true;
    overlay.classList.add("hidden");
    scoreEl.textContent = "0";
    speedEl.textContent = "1.0x";
  }

  function gameOver() {
    running = false;
    let note = "";
    if (score > best) {
      best = score;
      note = " New best score!";
      try {
        localStorage.setItem("spaceSurvivalBest", String(best));
      } catch (e) {}
      bestEl.textContent = best;
    }
    titleEl.textContent = "Ship destroyed";
    msgEl.textContent =
      "You scored " +
      score +
      " and reached " +
      speedMultiplier().toFixed(1) +
      "x speed." +
      note;
    startBtn.textContent = "Play again";
    overlay.classList.remove("hidden");
    startBtn.focus();
  }

  // Input
  window.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
    )
      e.preventDefault();
    keys[k] = true;
    if (e.key === " " && !running) start();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
  });
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
  });

  // Touch / mouse drag: ship follows finger movement
  /*
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  */
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || !running) return;
    const rect = canvas.getBoundingClientRect();
    ship.x = Math.min(
      W - ship.r,
      Math.max(ship.r, ship.x + (e.clientX - drag.x) * (W / rect.width)),
    );
    ship.y = Math.min(
      H - ship.r,
      Math.max(ship.r, ship.y + (e.clientY - drag.y) * (H / rect.height)),
    );
    drag = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener("pointerup", () => {
    drag = null;
  });

  startBtn.addEventListener("click", start);

  reset();
  requestAnimationFrame(loop);
})();
