let weapons = [];
let drugs = [];

const content = document.getElementById("content");
const sectionTitle = document.getElementById("sectionTitle");
const subHint = document.getElementById("subHint");

function setHint(text){
  subHint.textContent = text || "";
}

function normalizeTier(t){
  return String(t || "").trim().toUpperCase().replace(/\s+/g, "");
}

function clampStars(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return 1;
  return Math.max(1, Math.min(6, v));
}

/* =========================
   Tier helpers (for T1.5)
   ========================= */
function isTier15(w){
  const t = normalizeTier(w?.tier);
  return (
    t === "T1.5" ||
    t === "T1,5" ||
    t === "T15"  ||
    t === "1.5"  ||
    t === "T1-5" ||
    t === "T1_5"
  );
}

/* ✅ EXACT POOL RULES YOU ASKED FOR
   - REFILL  -> Tier 1 only
   - TEST    -> Tier 1 only
   - T1      -> Tier 1 only
   - T1.5    -> Tier 1 + Tier 1.5
   - T2      -> Tier 2 only
*/
function getWeaponPoolForMode(mode){
  const m = String(mode || "").toUpperCase();

  if (m === "T2"){
    return weapons.filter(w => normalizeTier(w.tier) === "T2");
  }

  if (m === "T15"){
    return weapons.filter(w => normalizeTier(w.tier) === "T1" || isTier15(w));
  }

  // TEST / REFILL / T1 default => Tier 1 only
  return weapons.filter(w => normalizeTier(w.tier) === "T1");
}

// ---------- MODAL (Drug details) ----------
function ensureDrugModal(){
  if (document.getElementById("drugModal")) return;

  const modal = document.createElement("div");
  modal.id = "drugModal";
  modal.className = "modal hidden";
  modal.innerHTML = `
    <div class="modal-backdrop" data-close="1"></div>
    <div class="modal-card" role="dialog" aria-modal="true">
      <button class="modal-close btn small" data-close="1">✕</button>
      <div class="modal-grid">
        <div class="modal-image">
          <img id="drugModalImg" src="" alt="">
        </div>
        <div class="modal-info">
          <div id="drugModalTitle" class="modal-title">Drug</div>

          <div id="drugModalPerks" class="modal-perks"></div>

          <div id="drugModalDesc" class="modal-desc"></div>

          <div id="drugModalPrice" class="modal-price"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) closeDrugModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrugModal();
  });
}

function openDrugModal(drug){
  ensureDrugModal();

  const modal = document.getElementById("drugModal");
  const img = document.getElementById("drugModalImg");
  const title = document.getElementById("drugModalTitle");
  const perks = document.getElementById("drugModalPerks");
  const desc = document.getElementById("drugModalDesc");
  const price = document.getElementById("drugModalPrice");

  img.src = drug.image || "";
  img.alt = drug.name || "Drug";

  title.textContent = drug.name || "Drug";

  const perkList = drug.perks || drug.effects || drug.buffs || [];
  if (Array.isArray(perkList) && perkList.length){
    perks.innerHTML = perkList.map(p => `<span class="perk-pill">${p}</span>`).join("");
  } else {
    perks.innerHTML = `<span class="perk-pill muted">No perks set</span>`;
  }

  desc.textContent = drug.description || "No description set.";
  price.textContent = drug.price ? `Price: ${drug.price}` : "";

  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeDrugModal(){
  const modal = document.getElementById("drugModal");
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

// ---------- WEAPON MINI CARDS (Randomize wheel + drops) ----------
function weaponCardHTML(w){
  return `
    <div class="card miniCard" data-stars="${clampStars(w.stars)}">
      <div class="name miniName">${w.name}</div>
      <div class="imgwrap miniImgwrap">
        <img src="${w.image}" alt="${w.name}" loading="lazy">
      </div>
    </div>
  `;
}

// ---------- GRID RENDER ----------
function renderGrid(items, type){
  content.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "grid";

  for (const item of items){
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.stars = String(item.stars ?? 1);

    if (type === "drugs"){
      card.classList.add("drugCard");

      const priceText = item.price ? `${item.name}  ${item.price}` : `${item.name}`;
      card.innerHTML = `
        <div class="drug-badge">${item.name}</div>
        <div class="drug-tooltip">${priceText}</div>
        <div class="imgwrap drugImgwrap">
          <img src="${item.image}" alt="${item.name}" loading="lazy">
        </div>
      `;

      card.addEventListener("click", () => openDrugModal(item));
    } else {
      const tag = item.tag ? `<div class="tag">${item.tag}</div>` : "";
      card.innerHTML = `
        <div class="name">${item.name}</div>
        ${tag}
        <div class="imgwrap"><img src="${item.image}" alt="${item.name}" loading="lazy"></div>
      `;
    }

    grid.appendChild(card);
  }

  content.appendChild(grid);
}

function showT1(){
  sectionTitle.textContent = "Tier 1 Weapons";
  setHint("");
  renderGrid(weapons.filter(w => normalizeTier(w.tier) === "T1"), "weapons");
}

function showT15(){
  sectionTitle.textContent = "Tier 1.5 Weapons";
  setHint("");
  renderGrid(weapons.filter(isTier15), "weapons");
}

function showT2(){
  sectionTitle.textContent = "Tier 2 Weapons";
  setHint("");
  renderGrid(weapons.filter(w => normalizeTier(w.tier) === "T2"), "weapons");
}

function showDrugs(){
  sectionTitle.textContent = "Drugs";
  setHint("Hover shows price. Click a drug for details.");
  ensureDrugModal();
  renderGrid(drugs, "drugs");
}

// ---------- RANDOM HELPERS ----------
function randInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeDrugCounts(pool, total){
  const counts = new Map();
  for (let i = 0; i < total; i++){
    const pick = pool[Math.floor(Math.random() * pool.length)];
    counts.set(pick, (counts.get(pick) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a,b) => b[1] - a[1])
    .map(([drug, qty]) => ({ drug, qty }));
}

/* Randomize:
   - Tier 1 = 4 spins (Tier 1 only)
   - Tier 1.5 = 4 spins (Tier 1 + Tier 1.5)
   - Tier 2 = 6 spins (Tier 2 only)
   - Test Drops = 2 spins (Tier 1 only)
   - Refill = 1 spin (Tier 1 only)
*/
function showRandomize(){
  sectionTitle.textContent = "Randomize";
  setHint("");

  content.innerHTML = `
    <div style="max-width:980px;margin:0 auto;padding:6px 12px;text-align:center;">
      <div style="color:#7fb7ff;margin-bottom:8px;">Simulate a faction drop spin</div>

      <div style="display:flex;gap:10px;justify-content:center;align-items:center;margin:10px 0;">
        <div>Choose Tier:</div>
        <select id="spinTier" class="btn small select-dark">
          <option value="TEST">Test Drops</option>
          <option value="T1">Tier 1</option>
          <option value="T15">Tier 1.5</option>
          <option value="T2">Tier 2</option>
          <option value="REFILL">Refill</option>
        </select>
        <button id="spinBtn" class="btn small">Spin</button>
      </div>

      <div id="wheelWrap" style="
        width: 980px;
        max-width: calc(100vw - 290px);
        margin: 14px auto 0;
        border:1px solid rgba(255,255,255,.14);
        border-radius:14px;
        background:rgba(255,255,255,.03);
        position:relative;
        overflow:hidden;
        height: 170px;
      ">
        <div id="wheelBar" style="
          position:absolute;
          left:50%;
          top:10%;
          transform:translateX(-50%);
          width:4px;
          height:80%;
          background:#ffd400;
          opacity:.95;
          z-index: 9999;
          border-radius: 3px;
          box-shadow: 0 0 18px rgba(255,212,0,.25);
          pointer-events:none;
        "></div>

        <div id="wheelStrip" style="
          position:absolute;
          left:0;
          top:0;
          height:100%;
          display:flex;
          gap:14px;
          align-items:center;
          padding: 10px 14px;
          will-change: transform;
        "></div>
      </div>

      <div style="margin-top:14px;color:#ffd400;font-weight:800;">Your drops</div>
      <div id="drops" style="
        margin-top:10px;
        display:grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 180px));
        gap: 14px;
        justify-content:center;
      "></div>

      <div style="margin-top:26px;color:#ff9b35;font-weight:800;">Drug Randomizer</div>
      <div style="color:#7fb7ff;font-size:12px;margin-top:4px;opacity:.9;">
        Randomly generate a large batch of drugs (T1 = 75–100 total, T2 = 100–180 total)
      </div>

      <div style="display:flex;gap:10px;justify-content:center;align-items:center;margin:12px 0;">
        <div>Choose Drug Tier:</div>
        <select id="drugTier" class="btn small select-dark">
          <option value="T1">T1</option>
          <option value="T2">T2</option>
        </select>
        <button id="spinDrugsBtn" class="btn small">Spin Drugs</button>
      </div>

      <div id="drugDrops"></div>
    </div>
  `;

  const spinBtn = document.getElementById("spinBtn");
  const tierSel = document.getElementById("spinTier");
  const wheelWrap = document.getElementById("wheelWrap");
  const wheelStrip = document.getElementById("wheelStrip");
  const dropsEl = document.getElementById("drops");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const CARD_W = 180;
  const GAP = 14;
  const STEP = CARD_W + GAP;

  function makeCardHTML(w){
    return `
      <div class="card miniCard" data-stars="${clampStars(w.stars)}">
        <div class="name miniName">${w.name}</div>
        <div class="imgwrap miniImgwrap">
          <img src="${w.image}" alt="${w.name}" loading="lazy">
        </div>
      </div>
    `;
  }

  function buildWheel(pool){
    const reps = 12;
    const items = [];
    for (let r=0; r<reps; r++){
      for (const p of pool) items.push(p);
    }

    wheelStrip.innerHTML = items.map(makeCardHTML).join("");
    wheelStrip.style.transition = "none";
    wheelStrip.style.transform = "translateX(0px)";
    void wheelStrip.offsetHeight;
    return items;
  }

  async function spinOnce(pool){
    const items = buildWheel(pool);

    const minIndex = pool.length * 4;
    const maxIndex = pool.length * 9;
    const landIndex = randInt(minIndex, maxIndex);

    const wrapW = wheelWrap.clientWidth;
    const centerX = wrapW / 2;

    const paddingLeft = 14;
    const cardLeft = paddingLeft + landIndex * STEP;
    const cardCenter = cardLeft + (CARD_W / 2);
    const targetX = centerX - cardCenter;

    wheelStrip.style.transition = "transform 2.2s cubic-bezier(.10,.90,.10,1.00)";
    wheelStrip.style.transform = `translateX(${targetX}px)`;

    await sleep(2300);
    return items[landIndex];
  }

  function renderDrops(list){
    dropsEl.innerHTML = list.map(makeCardHTML).join("");
  }

  function pickMode(mode){
    // counts unchanged, Tier 1.5 gets its own option but still 4 picks
    if (mode === "TEST") return { mode: "TEST", count: 2 };
    if (mode === "REFILL") return { mode: "REFILL", count: 1 };
    if (mode === "T2") return { mode: "T2", count: 6 };
    if (mode === "T15") return { mode: "T15", count: 4 };
    return { mode: "T1", count: 4 };
  }

  let spinning = false;

  spinBtn.addEventListener("click", async () => {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;

    const selected = tierSel.value; // TEST / T1 / T15 / T2 / REFILL
    const { mode, count } = pickMode(selected);

    // ✅ pool rules applied here
    const pool = getWeaponPoolForMode(mode);

    if (!pool.length){
      spinning = false;
      spinBtn.disabled = false;
      return;
    }

    const drops = [];
    dropsEl.innerHTML = "";

    for (let i=0; i<count; i++){
      const landed = await spinOnce(pool);
      drops.push(landed);
      renderDrops(drops);
      await sleep(450);
    }

    spinning = false;
    spinBtn.disabled = false;
  });

  // Drug randomizer
  const spinDrugsBtn = document.getElementById("spinDrugsBtn");
  const drugTierSel = document.getElementById("drugTier");
  const drugDrops = document.getElementById("drugDrops");

  ensureDrugModal();

  spinDrugsBtn.addEventListener("click", () => {
    const tier = drugTierSel.value;
    const total = (tier === "T1") ? randInt(75, 100) : randInt(100, 180);

    const pool = drugs;
    if (!pool.length) return;

    const counted = makeDrugCounts(pool, total);

    drugDrops.innerHTML = `
      <ul class="drug-bullets">
        ${counted.map(({drug, qty}) => `
          <li class="drug-bullet"
              title="${drug.price ? `Price: ${drug.price}` : ""}"
              data-drug="${encodeURIComponent(drug.name)}">
            <span class="dot">•</span>
            <span class="txt">${drug.name} x${qty}</span>
          </li>
        `).join("")}
      </ul>
    `;

    drugDrops.querySelectorAll(".drug-bullet").forEach(li => {
      li.addEventListener("click", () => {
        const name = decodeURIComponent(li.dataset.drug || "");
        const found = pool.find(d => d.name === name) || drugs.find(d => d.name === name);
        if (found) openDrugModal(found);
      });
    });
  });
}

async function loadData(){
  weapons = await fetch("data/weapons.json").then(r => r.json());
  drugs = await fetch("data/drugs.json").then(r => r.json());
}

document.querySelectorAll("[data-view]").forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    if (view === "t1") showT1();
    if (view === "t15") showT15();
    if (view === "t2") showT2();
    if (view === "drugs") showDrugs();
    if (view === "randomize") showRandomize();
  });
});

// Theme toggle + save
const themeBtn = document.getElementById("themeToggle");
themeBtn.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light");
  themeBtn.textContent = isLight ? "Dark Mode" : "Light Mode";
  localStorage.setItem("theme", isLight ? "light" : "dark");
});
(() => {
  const t = localStorage.getItem("theme");
  if (t === "light"){
    document.body.classList.add("light");
    themeBtn.textContent = "Dark Mode";
  }
})();

(async function init(){
  await loadData();
  showT1();
})();