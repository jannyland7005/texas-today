const W = 1080;
let uploadedImages = [];
let rerollOffset = 0;
let latestBlob = null;

const COLORS = {
  ink: "#2c2925",
  muted: "#6b6258",
  line: "#e9dccb",
  accent: "#8d6748",
  accentSoft: "#f1dfc9",
  paper: "rgba(255,253,248,.96)"
};

const TYPE = {
  title: 82,
  subtitle: 42,
  date: 38,
  section: 54,
  body: 48,
  boxTitle: 46,
  list: 44,
  quote: 50,
  note: 38,
  footer: 30
};

function seedFromDate(dateStr) {
  let n = 0;
  for (const ch of dateStr || "") n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return n + rerollOffset;
}

function pick(arr, seed, offset = 0) {
  return arr[(seed + offset) % arr.length];
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function setStatus(msg) {
  document.getElementById("status").textContent = msg;
}

function font(weight, size) {
  return `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif`;
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fillRound(ctx, x, y, w, h, r, fill, stroke = null, lw = 1) {
  roundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

function wrapText(ctx, text, maxWidth) {
  const tokens = (text || "").replace(/\n/g, " \n ").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const token of tokens) {
    if (token === "\n") {
      if (line) lines.push(line);
      line = "";
      continue;
    }

    const candidate = line ? `${line} ${token}` : token;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }

    if (line) lines.push(line);

    if (ctx.measureText(token).width <= maxWidth) {
      line = token;
    } else {
      let chunk = "";
      for (const ch of token) {
        const t = chunk + ch;
        if (ctx.measureText(t).width <= maxWidth) {
          chunk = t;
        } else {
          if (chunk) lines.push(chunk);
          chunk = ch;
        }
      }
      line = chunk;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function drawWrapped(ctx, text, x, y, maxWidth, lineHeight, color = COLORS.ink) {
  ctx.fillStyle = color;
  const lines = wrapText(ctx, text, maxWidth);
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

function drawBackground(ctx, height) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#f8eedf");
  grad.addColorStop(0.45, "#fff9ef");
  grad.addColorStop(1, "#f5eadb");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, height);
}

function sectionHead(ctx, emoji, title, x, yBase) {
  fillRound(ctx, x, yBase - 56, 76, 76, 24, COLORS.accentSoft);
  ctx.font = "44px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, x + 38, yBase - 17);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.font = font(800, TYPE.section);
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(title, x + 98, yBase);
}

function imageBoxForFullPhoto(img, maxWidth) {
  const iw = img.naturalWidth || img.width || maxWidth;
  const ih = img.naturalHeight || img.height || maxWidth;
  return { w: maxWidth, h: maxWidth * (ih / iw) };
}

function photoLayout(images, maxWidth) {
  const gap = 18;
  if (!images.length) return { height: 190, boxes: [] };

  if (images.length === 1) {
    const b = imageBoxForFullPhoto(images[0], maxWidth);
    return { height: b.h, boxes: [{ img: images[0], x: 0, y: 0, w: b.w, h: b.h }] };
  }

  const colW = (maxWidth - gap) / 2;
  const colHeights = [0, 0];
  const boxes = [];

  images.slice(0, 4).forEach(img => {
    const col = colHeights[0] <= colHeights[1] ? 0 : 1;
    const b = imageBoxForFullPhoto(img, colW);
    const x = col === 0 ? 0 : colW + gap;
    const y = colHeights[col];
    boxes.push({ img, x, y, w: b.w, h: b.h });
    colHeights[col] += b.h + gap;
  });

  return { height: Math.max(colHeights[0], colHeights[1]) - gap, boxes };
}

function drawPhoto(ctx, img, x, y, w, h) {
  fillRound(ctx, x, y, w, h, 22, "#fffdf8", "#efe1cf", 2);
  ctx.save();
  roundedRect(ctx, x, y, w, h, 22);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

function drawPhotoArea(ctx, images, x, y, w) {
  if (!images.length) {
    fillRound(ctx, x, y, w, 190, 24, "#f5eadb");
    ctx.font = font(700, 42);
    ctx.fillStyle = "#8d765f";
    ctx.textAlign = "center";
    ctx.fillText("사진을 올리면 여기에 표시됩니다", x + w / 2, y + 110);
    ctx.textAlign = "left";
    return 190;
  }

  const layout = photoLayout(images, w);
  layout.boxes.forEach(b => drawPhoto(ctx, b.img, x + b.x, y + b.y, b.w, b.h));
  return layout.height;
}

function miniBoxHeight(items) {
  return 108 + items.length * 66 + 34;
}

function drawMiniBox(ctx, title, items, x, y, w) {
  const h = miniBoxHeight(items);
  fillRound(ctx, x, y, w, h, 26, "#fbf5ec", "#eadcc9", 1);

  ctx.font = font(800, TYPE.boxTitle);
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(title, x + 30, y + 64);

  ctx.font = font(500, TYPE.list);
  let yy = y + 132;
  for (const item of items) {
    ctx.fillText("•", x + 38, yy);
    ctx.fillText(item, x + 84, yy);
    yy += 66;
  }
  return h;
}

function drawMoveBox(ctx, num, title, desc, x, y, w) {
  const h = 230;
  fillRound(ctx, x, y, w, h, 26, "#f8f2e9", "#e7d8c6", 1);
  fillRound(ctx, x + 24, y + 34, 76, 76, 24, "#fff", "#e6d5c2", 2);

  ctx.font = font(800, 40);
  ctx.fillStyle = COLORS.accent;
  ctx.textAlign = "center";
  ctx.fillText(String(num), x + 62, y + 84);
  ctx.textAlign = "left";

  ctx.font = font(800, 44);
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(title, x + 128, y + 78);

  ctx.font = font(500, 38);
  drawWrapped(ctx, desc, x + 128, y + 138, w - 160, 52, "#5e554c");
  return h;
}

async function loadImageFromFile(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = new Image();
  img.src = dataUrl;
  await img.decode().catch(() => new Promise(resolve => {
    img.onload = resolve;
    img.onerror = resolve;
  }));
  return img;
}

async function handlePhotos(files) {
  setStatus("사진을 불러오는 중입니다.");
  const selected = Array.from(files || []).slice(0, 4);
  uploadedImages = [];

  for (const file of selected) {
    try {
      const img = await loadImageFromFile(file);
      if ((img.naturalWidth || img.width) > 0) uploadedImages.push(img);
    } catch (err) {
      console.error(err);
    }
  }

  renderNewsletter();
  setStatus(uploadedImages.length ? `${uploadedImages.length}장의 사진이 반영되었습니다.` : "사진이 선택되지 않았습니다.");
}

function renderNewsletter() {
  const canvas = document.getElementById("newsletterCanvas");
  const visible = canvas.getContext("2d");

  const date = document.getElementById("dateInput").value;
  const subtitle = document.getElementById("subtitleInput").value.trim();
  const familyText = document.getElementById("familyText").value.trim();

  const seed = seedFromDate(date);
  const health = pick(healthTips, seed, 0);
  const habit = pick(lifestyleTips, seed, 7);
  const mind = pick(mindTips, seed, 13);
  const ex = pick(exerciseSets, seed, 23);

  const off = document.createElement("canvas");
  off.width = W;
  off.height = 12000;
  const ctx = off.getContext("2d");
  drawBackground(ctx, off.height);

  const cardX = 48;
  const cardW = W - 96;
  const innerX = cardX + 36;
  const innerW = cardW - 72;
  const gap = 30;

  let y = 140;

  // Header
  ctx.font = font(900, TYPE.title);
  ctx.fillStyle = COLORS.ink;
  ctx.fillText("텍사스, 오늘", 58, y);

  ctx.font = font(500, TYPE.subtitle);
  ctx.fillStyle = COLORS.muted;
  if (subtitle) ctx.fillText(subtitle, 60, y + 66);

  const dateText = formatDate(date);
  ctx.font = font(800, TYPE.date);
  const dw = ctx.measureText(dateText).width + 74;
  fillRound(ctx, W - 58 - dw, 70, dw, 90, 45, "#fffdf8", COLORS.line, 2);
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(dateText, W - 58 - dw + 37, 128);

  y = subtitle ? 184 : 154;

  // Family
  const pLayout = photoLayout(uploadedImages, innerW);
  const photoH = uploadedImages.length ? pLayout.height : 190;

  ctx.font = font(500, TYPE.body);
  const familyTextH = familyText ? wrapText(ctx, familyText, innerW).length * 70 : 26;
  const familyCardH = 142 + photoH + 70 + familyTextH + 46;

  fillRound(ctx, cardX, y, cardW, familyCardH, 32, COLORS.paper, COLORS.line, 2);
  sectionHead(ctx, "🏡", "오늘의 우리 소식", innerX, y + 88);
  const photoY = y + 146;
  drawPhotoArea(ctx, uploadedImages, innerX, photoY, innerW);
  ctx.font = font(500, TYPE.body);
  drawWrapped(ctx, familyText, innerX, photoY + photoH + 76, innerW, 70);
  y += familyCardH + gap;

  // Health
  ctx.font = font(500, TYPE.body);
  const healthLeadH = wrapText(ctx, health.lead, innerW).length * 70;
  const goodH = miniBoxHeight(health.good);
  const avoidH = miniBoxHeight(health.avoid);
  const healthCardH = 142 + healthLeadH + 42 + goodH + 26 + avoidH + 54;

  fillRound(ctx, cardX, y, cardW, healthCardH, 32, COLORS.paper, COLORS.line, 2);
  sectionHead(ctx, "🥣", "오늘의 건강 상식", innerX, y + 88);
  ctx.font = font(500, TYPE.body);
  let hy = drawWrapped(ctx, health.lead, innerX, y + 160, innerW, 70);
  hy += 42;
  hy += drawMiniBox(ctx, "오늘 먹으면 좋은 메뉴", health.good, innerX, hy, innerW) + 26;
  drawMiniBox(ctx, "오늘 조심할 메뉴", health.avoid, innerX, hy, innerW);
  y += healthCardH + gap;

  // Habit
  ctx.font = font(500, TYPE.body);
  const habitH = wrapText(ctx, habit, innerW).length * 70;
  const habitCardH = 142 + habitH + 52;

  fillRound(ctx, cardX, y, cardW, habitCardH, 32, COLORS.paper, COLORS.line, 2);
  sectionHead(ctx, "🌿", "오늘의 생활 습관", innerX, y + 88);
  ctx.font = font(500, TYPE.body);
  drawWrapped(ctx, habit, innerX, y + 164, innerW, 70);
  y += habitCardH + gap;

  // Mind
  const quote = `“${mind.text}”`;
  ctx.font = font(700, TYPE.quote);
  const quoteH = wrapText(ctx, quote, innerW).length * 72;
  ctx.font = font(500, TYPE.note);
  const noteH = wrapText(ctx, mind.note, innerW).length * 54;
  const mindCardH = 142 + quoteH + 72 + noteH + 60;

  fillRound(ctx, cardX, y, cardW, mindCardH, 32, COLORS.paper, COLORS.line, 2);
  sectionHead(ctx, "🕯️", "마음 습관", innerX, y + 88);
  ctx.font = font(700, TYPE.quote);
  let my = drawWrapped(ctx, quote, innerX, y + 166, innerW, 72);
  ctx.font = font(500, TYPE.note);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(`— ${mind.by}`, innerX, my + 20);
  drawWrapped(ctx, mind.note, innerX, my + 82, innerW, 54, COLORS.muted);
  y += mindCardH + gap;

  // Exercise
  const moveH = 230;
  const exCardH = 142 + ex.length * moveH + (ex.length - 1) * 24 + 124;

  fillRound(ctx, cardX, y, cardW, exCardH, 32, COLORS.paper, COLORS.line, 2);
  sectionHead(ctx, "🪑", "하루 운동", innerX, y + 88);
  let ey = y + 150;
  ex.forEach((m, i) => {
    drawMoveBox(ctx, i + 1, m[0], m[1], innerX, ey, innerW);
    ey += moveH + 24;
  });
  ctx.font = font(500, TYPE.note);
  drawWrapped(ctx, "통증, 어지럼, 숨참이 있으면 즉시 멈추고, 지팡이·의자 등 안전한 지지대를 사용하세요.", innerX, ey + 24, innerW, 54, COLORS.muted);
  y += exCardH + gap;

  // Footer
  ctx.font = font(500, TYPE.footer);
  drawWrapped(ctx, `참고: ${health.source}; CDC Older Adult Physical Activity Guidelines. 개인 건강 상태에 따라 의사 상담이 필요할 수 있습니다.`, 66, y, 760, 42, "#75695f");
  ctx.font = font(900, 34);
  ctx.fillStyle = "#9a816b";
  ctx.fillText("from 미국 가족", 790, y + 56);
  y += 190;

  const finalH = Math.ceil(y + 40);
  canvas.width = W;
  canvas.height = finalH;
  drawBackground(visible, finalH);
  visible.drawImage(off, 0, 0, W, finalH, 0, 0, W, finalH);

  latestBlob = null;
}
