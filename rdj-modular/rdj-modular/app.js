// ===== GLOBAL STATE =====
let scriptLines = [];
let truthMap = {};
let companiesMap = {};
let objectionsMap = {};

let currentBucket = "all";
let activeView = "script";
let currentLineId = null;
let currentCoachTab = "truth";
let activeCompanyId = null;
let activeObjectionId = null;

// ===== DOM REFS =====
const viewTabs = document.querySelectorAll(".view-tab");
const viewSections = document.querySelectorAll(".view-section");
const coachViews = document.querySelectorAll(".coach-view");
const bucketFiltersEl = document.getElementById("bucket-filters");

const leftPanelTitleEl = document.getElementById("leftPanelTitle");
const leftPanelHelperEl = document.getElementById("leftPanelHelper");
const rightPanelTitleEl = document.getElementById("rightPanelTitle");
const rightPanelHelperEl = document.getElementById("rightPanelHelper");

const scriptListEl = document.getElementById("scriptList");
const companyListEl = document.getElementById("companyList");
const objectionListEl = document.getElementById("objectionList");

const coachLineLabelEl = document.getElementById("coachLineLabel");
const coachingPanelEl = document.getElementById("coaching-panel");
const tabButtons = document.querySelectorAll(".coach-tab");

const companyPanelEl = document.getElementById("company-panel");
const companyPanelBodyEl = document.getElementById("company-panel-body");
const objectionPanelEl = document.getElementById("objections-panel");
const objectionPanelBodyEl = document.getElementById("objections-panel-body");
const companyLabelEl = document.getElementById("companyLabel");
const companyDetailEl = document.getElementById("companyDetail");
const objectionLabelEl = document.getElementById("objectionLabel");
const objectionDetailEl = document.getElementById("objectionDetail");

// Bucket mapping for discovery
const bucketMap = {
  work: ["disc-1", "disc-2", "disc-3", "disc-4", "disc-5"],
  sales: ["disc-6", "disc-7", "disc-8", "disc-9"],
  remote: ["disc-10", "disc-11"],
  why: ["disc-12", "disc-13"],
  runway: ["disc-14", "disc-15", "disc-16"],
};

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  init();
});

async function init() {
  await loadData();
  renderScript();
  renderCompanies();
  renderObjections();
  updateView("script");

  setupBucketFilters();

  viewTabs.forEach((btn) => {
    btn.addEventListener("click", () => updateView(btn.dataset.view));
  });

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => setCoachTab(btn.dataset.tab));
  });
}

// ===== DATA LOADING =====
async function loadData() {
  const [scriptRes, truthRes, companiesRes, objectionsRes] = await Promise.all([
    fetch("./data/script.json"),
    fetch("./data/truth.json"),
    fetch("./data/companies.json"),
    fetch("./data/objections.json"),
  ]);

  const scriptJson = await scriptRes.json();
  scriptLines = scriptJson.lines || [];

  truthMap = await truthRes.json();
  companiesMap = await companiesRes.json();
  objectionsMap = await objectionsRes.json();

  renderScriptList();
}

function renderScriptList() {
  renderScript();
}

// ===== VIEW SWITCHING =====
function updateView(viewKey) {
  activeView = viewKey;

  viewTabs.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewKey);
  });

  viewSections.forEach((sec) => {
    sec.classList.toggle("active", sec.dataset.view === viewKey);
  });

  coachViews.forEach((cv) => {
    cv.classList.toggle("active", cv.dataset.view === viewKey);
  });

  if (viewKey === "script") {
    leftPanelTitleEl.textContent = "Script";
    leftPanelHelperEl.textContent = "Click a line to see live coaching.";
    rightPanelTitleEl.textContent = "Coaching";
    rightPanelHelperEl.textContent = "Select a script line to view TRUTH coaching.";

    if (!currentLineId && scriptLines.length > 0) {
      selectLine(scriptLines[0].id);
    } else if (currentLineId) {
      selectLine(currentLineId);
    }
  } else if (viewKey === "companies") {
    leftPanelTitleEl.textContent = "Companies";
    leftPanelHelperEl.textContent = "Select a company to view offer and comp details.";
    rightPanelTitleEl.textContent = "Company Details";
    rightPanelHelperEl.textContent =
      "Use this to remember each company's structure without touching your script.";

    if (!activeCompanyId) {
      const firstCompany = Object.keys(companiesMap)[0];
      if (firstCompany) handleCompanyClick(firstCompany);
    } else {
      handleCompanyClick(activeCompanyId);
    }
  } else if (viewKey === "objections") {
    leftPanelTitleEl.textContent = "Objections";
    leftPanelHelperEl.textContent = "Select an objection pattern to review handling.";
    rightPanelTitleEl.textContent = "Objection Handling";
    rightPanelHelperEl.textContent =
      "Add and refine objection patterns here as you learn from live calls.";

    if (!activeObjectionId) {
      const firstObj = Object.keys(objectionsMap)[0];
      if (firstObj) handleObjectionClick(firstObj);
    } else {
      handleObjectionClick(activeObjectionId);
    }
  }
}

// ===== SCRIPT VIEW =====
function renderScript() {
  scriptListEl.innerHTML = "";
  let linesToRender = scriptLines;

  if (currentBucket !== "all") {
    const ids = new Set(bucketMap[currentBucket] || []);
    linesToRender = scriptLines.filter((line) => ids.has(line.id));
  }

  linesToRender.forEach((line) => {
    const li = document.createElement("li");
    li.className = "script-line";
    li.dataset.lineId = line.id;

    if (line.compliance) {
      li.classList.add("compliance-line");
    }

    if (currentLineId === line.id) {
      li.classList.add("active");
    }

    const sectionTag = document.createElement("span");
    sectionTag.className = "section-tag";
    sectionTag.textContent = line.section.toUpperCase();

    const textSpan = document.createElement("span");
    textSpan.textContent = line.text;

    li.appendChild(sectionTag);
    li.appendChild(textSpan);

    li.addEventListener("click", () => selectLine(line.id));

    scriptListEl.appendChild(li);
  });
}

function setupBucketFilters() {
  if (!bucketFiltersEl) return;

  const buttons = bucketFiltersEl.querySelectorAll(".bucket-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentBucket = btn.getAttribute("data-bucket") || "all";
      renderScript();
    });
  });
}

function selectLine(lineId) {
  currentLineId = lineId;
  highlightSelectedLine(lineId);
  updateCoachingPanel(lineId);
  updateCompanyPanel(lineId);
  updateObjectionsPanel(lineId);
  if (typeof scrollLineIntoView === "function") {
    scrollLineIntoView(lineId);
  }
}

function highlightSelectedLine(lineId) {
  document.querySelectorAll(".script-line").forEach((el) => {
    el.classList.toggle("active", el.dataset.lineId === lineId);
  });

  const line = scriptLines.find((l) => l.id === lineId);
  if (!line) return;

  coachLineLabelEl.textContent = line.text;
}

// ===== COACHING =====
function setCoachTab(tabKey) {
  currentCoachTab = tabKey;
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabKey);
  });

  if (currentLineId) {
    updateCoachingPanel(currentLineId);
  }
}

function updateCoachingPanel(lineId) {
  const data = truthMap[lineId];

  if (!data || !data[currentCoachTab]) {
    coachingPanelEl.innerHTML =
      '<div class="coach-placeholder">Coaching details will appear here when you select a script line.</div>';
    return;
  }

  const entry = data[currentCoachTab];
  coachingPanelEl.innerHTML = `
    <h3>${entry.title}</h3>
    <ul>
      ${(entry.points || []).map((p) => `<li>${p}</li>`).join("")}
    </ul>
  `;
}

// ===== COMPANIES =====
function renderCompanies() {
  companyListEl.innerHTML = "";
  const companies = Object.values(companiesMap);

  companies.forEach((c) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.dataset.companyId = c.id;

    const title = document.createElement("div");
    title.className = "list-item-title";
    title.textContent = c.name;

    const sub = document.createElement("div");
    sub.className = "list-item-sub";
    sub.textContent = c.headline || "";

    li.appendChild(title);
    li.appendChild(sub);
    li.addEventListener("click", () => handleCompanyClick(c.id));
    companyListEl.appendChild(li);
  });
}

function updateCompanyPanel(lineId) {
  const panel = document.getElementById("company-panel-body");
  if (!panel) return;

  const truthEntry = truthMap[lineId];
  if (!truthEntry || !truthEntry.companies || truthEntry.companies.length === 0) {
    panel.innerHTML = `<p class="coach-placeholder">No company selected</p>`;
    return;
  }

  const cards = truthEntry.companies
    .map((id) => companiesMap[id])
    .filter(Boolean)
    .map(
      (c) => `
      <div class="company-card">
        <div class="company-name">${c.name}</div>
        <p>${c.headline}</p>
        <ul>
          ${c.bullets.map((b) => `<li>${b}</li>`).join("")}
        </ul>
      </div>
    `
    )
    .join("");

  panel.innerHTML = cards;
}

function handleCompanyClick(companyId) {
  activeCompanyId = companyId;

  document.querySelectorAll("#companyList .list-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.companyId === companyId);
  });

  const company = companiesMap[companyId];
  if (!company) return;

  companyLabelEl.textContent = company.name;

  const parts = [];
  parts.push(
    `<div class="coach-section">
       <div class="coach-section-title">Headline</div>
       <div class="coach-section-body">${company.headline}</div>
     </div>`
  );

  parts.push(
    `<div class="coach-section">
       <div class="coach-section-title">Comp</div>
       <div class="coach-section-body">${company.comp}</div>
     </div>`
  );

  if (company.bullets && company.bullets.length) {
    const items = company.bullets.map((b) => `<li>${b}</li>`).join("");
    parts.push(
      `<div class="coach-section">
         <div class="coach-section-title">Highlights</div>
         <div class="coach-section-body"><ul>${items}</ul></div>
       </div>`
    );
  }

  companyDetailEl.innerHTML = parts.join("");
}

// ===== OBJECTIONS =====
function renderObjections() {
  objectionListEl.innerHTML = "";
  const objections = Object.values(objectionsMap);

  objections.forEach((obj) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.dataset.objectionId = obj.id;

    const title = document.createElement("div");
    title.className = "list-item-title";
    title.textContent = obj.label;

    li.appendChild(title);
    li.addEventListener("click", () => handleObjectionClick(obj.id));
    objectionListEl.appendChild(li);
  });
}

function updateObjectionsPanel(lineId) {
  const panel = document.getElementById("objections-panel-body");
  if (!panel) return;

  const truthEntry = truthMap[lineId];

  if (!truthEntry || !Array.isArray(truthEntry.objections) || truthEntry.objections.length === 0) {
    panel.innerHTML = `
      <p class="coach-placeholder">
        No objection selected<br>
        <small>Select a script line where an objection is likely to show up.</small>
      </p>
    `;
    return;
  }

  const cards = truthEntry.objections
    .map(id => objectionsMap[id])
    .filter(Boolean)
    .map(o => `
      <div class="objection-card">
        <div class="objection-label">${o.label}</div>
        <p class="objection-script">${o.script.join(" ")}</p>
      </div>
    `)
    .join("");

  panel.innerHTML = cards;
}

function handleObjectionClick(objectionId) {
  activeObjectionId = objectionId;

  document.querySelectorAll("#objectionList .list-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.objectionId === objectionId);
  });

  const obj = objectionsMap[objectionId];
  if (!obj) return;

  objectionLabelEl.textContent = obj.label;

  const parts = [];
  if (obj.script && obj.script.length) {
    parts.push(
      `<div class="coach-section">
         <div class="coach-section-title">Core Handling Script</div>
         <div class="coach-section-body">${obj.script.join(" ")}</div>
       </div>`
    );
  }

  objectionDetailEl.innerHTML = parts.join("") ||
    '<div class="coach-placeholder">No details yet. Add them in data/objections.json.</div>';
}
