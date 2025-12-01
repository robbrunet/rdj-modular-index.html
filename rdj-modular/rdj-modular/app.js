// ===== GLOBAL STATE =====
let scriptData = [];
let coachingData = {
  truth: {},
  values: {},
  mindset: {},
  habits: {},
  skillset: {}
};
let companiesData = [];
let objectionsData = [];

let activeView = "script"; // "script" | "companies" | "objections"
let activeLineId = null;
let activeTabKey = "truth";
let activeCompanyId = null;
let activeObjectionId = null;

// DOM references
const viewTabs = document.querySelectorAll(".view-tab");
const viewSections = document.querySelectorAll(".view-section");
const coachViews = document.querySelectorAll(".coach-view");
const leftPanelTitleEl = document.getElementById("leftPanelTitle");
const leftPanelHelperEl = document.getElementById("leftPanelHelper");
const rightPanelTitleEl = document.getElementById("rightPanelTitle");
const rightPanelHelperEl = document.getElementById("rightPanelHelper");

const scriptListEl = document.getElementById("scriptList");
const companyListEl = document.getElementById("companyList");
const objectionListEl = document.getElementById("objectionList");

const coachLineLabelEl = document.getElementById("coachLineLabel");
const coachTabContentEl = document.getElementById("coachTabContent");
const tabButtons = document.querySelectorAll(".coach-tab");

const companyLabelEl = document.getElementById("companyLabel");
const companyDetailEl = document.getElementById("companyDetail");
const objectionLabelEl = document.getElementById("objectionLabel");
const objectionDetailEl = document.getElementById("objectionDetail");

// ===== INIT =====
document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const [
      scriptRes,
      companiesRes,
      objectionsRes,
      truthRes,
      valuesRes,
      mindsetRes,
      habitsRes,
      skillsetRes
    ] = await Promise.all([
      fetch("data/script.json"),
      fetch("data/companies.json"),
      fetch("data/objections.json"),
      fetch("data/coaching/truth.json"),
      fetch("data/coaching/values.json"),
      fetch("data/coaching/mindset.json"),
      fetch("data/coaching/habits.json"),
      fetch("data/coaching/skillset.json")
    ]);

    const scriptJson = await scriptRes.json();
    const companiesJson = await companiesRes.json();
    const objectionsJson = await objectionsRes.json();
    const truthJson = await truthRes.json();
    const valuesJson = await valuesRes.json();
    const mindsetJson = await mindsetRes.json();
    const habitsJson = await habitsRes.json();
    const skillsetJson = await skillsetRes.json();

    scriptData = scriptJson.lines || [];
    companiesData = companiesJson.companies || [];
    objectionsData = objectionsJson.objections || [];
    coachingData.truth = truthJson;
    coachingData.values = valuesJson;
    coachingData.mindset = mindsetJson;
    coachingData.habits = habitsJson;
    coachingData.skillset = skillsetJson;

    renderScript();
    renderCompanies();
    renderObjections();
    updateView("script");
    renderTabContent();
  } catch (err) {
    console.error("Error loading data:", err);
  }

  // View tab handlers
  viewTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      updateView(view);
    });
  });

  // Coaching tab handlers
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabKey = btn.dataset.tab;
      setActiveTab(tabKey);
    });
  });
}

// ===== VIEW SWITCHING =====
function updateView(viewKey) {
  activeView = viewKey;

  // Update header tabs
  viewTabs.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewKey);
  });

  // Toggle left panel views
  viewSections.forEach((sec) => {
    sec.classList.toggle("active", sec.dataset.view === viewKey);
  });

  // Toggle right panel coaching views
  coachViews.forEach((cv) => {
    cv.classList.toggle("active", cv.dataset.view === viewKey);
  });

  // Update panel titles/helpers
  if (viewKey === "script") {
    leftPanelTitleEl.textContent = "Script";
    leftPanelHelperEl.textContent = "Click a line to see live coaching.";
    rightPanelTitleEl.textContent = "Coaching";
    rightPanelHelperEl.textContent = "Select a script line to view TRUTH coaching.";
  } else if (viewKey === "companies") {
    leftPanelTitleEl.textContent = "Companies";
    leftPanelHelperEl.textContent = "Select a company to view offer and comp details.";
    rightPanelTitleEl.textContent = "Company Details";
    rightPanelHelperEl.textContent =
      "Use this to remember each company's structure without touching your script.";
  } else if (viewKey === "objections") {
    leftPanelTitleEl.textContent = "Objections";
    leftPanelHelperEl.textContent = "Select an objection pattern to review handling.";
    rightPanelTitleEl.textContent = "Objection Handling";
    rightPanelHelperEl.textContent =
      "Add and refine objection patterns here as you learn from live calls.";
  }

  // Reset some labels when switching views
  if (viewKey === "script") {
    if (!activeLineId && scriptData.length > 0) {
      handleLineClick(scriptData[0].id);
    } else {
      renderTabContent();
    }
  } else if (viewKey === "companies") {
    companyLabelEl.textContent = activeCompanyId
      ? companyLabelEl.textContent
      : "No company selected";
  } else if (viewKey === "objections") {
    objectionLabelEl.textContent = activeObjectionId
      ? objectionLabelEl.textContent
      : "No objection selected";
  }
}

// ===== SCRIPT VIEW =====
function renderScript() {
  scriptListEl.innerHTML = "";
  scriptData.forEach((line) => {
    const li = document.createElement("li");
    li.className = "script-line";
    li.dataset.lineId = line.id;

    if (line.compliance) {
      li.classList.add("compliance-line");
    }

    const sectionTag = document.createElement("span");
    sectionTag.className = "section-tag";
    sectionTag.textContent = line.section.toUpperCase();

    const textSpan = document.createElement("span");
    textSpan.textContent = line.text;

    li.appendChild(sectionTag);
    li.appendChild(textSpan);

    li.addEventListener("click", () => handleLineClick(line.id));

    scriptListEl.appendChild(li);
  });
}

function handleLineClick(lineId) {
  activeLineId = lineId;

  document.querySelectorAll(".script-line").forEach((el) => {
    el.classList.toggle("active", el.dataset.lineId === lineId);
  });

  const line = scriptData.find((l) => l.id === lineId);
  if (!line) return;

  coachLineLabelEl.textContent = line.text;
  setActiveTab(activeTabKey || "truth");
}

// ===== COACHING TABS =====
function setActiveTab(tabKey) {
  activeTabKey = tabKey;

  tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === tabKey;
    btn.classList.toggle("active", isActive);
  });

  renderTabContent();
}

function renderTabContent() {
  coachTabContentEl.innerHTML = "";

  const line = scriptData.find((l) => l.id === activeLineId);
  if (!line) {
    const placeholder = document.createElement("div");
    placeholder.className = "coach-placeholder";
    placeholder.textContent =
      "Select a line on the left to see detailed coaching.";
    coachTabContentEl.appendChild(placeholder);
    return;
  }

  const coaching = coachingData[activeTabKey]?.[line.id];
  if (!coaching) {
    const placeholder = document.createElement("div");
    placeholder.className = "coach-placeholder";
    placeholder.textContent = "No coaching data for this tab yet.";
    coachTabContentEl.appendChild(placeholder);
    return;
  }

  const section = document.createElement("div");
  section.className = "coach-section";

  const title = document.createElement("div");
  title.className = "coach-section-title";
  title.textContent = coaching.title || activeTabKey.toUpperCase();
  section.appendChild(title);

  const body = document.createElement("div");
  body.className = "coach-section-body";

  if (activeTabKey === "truth") {
    const parts = [];
    if (coaching.purpose) {
      parts.push(`<strong>Purpose:</strong> ${coaching.purpose}`);
    }
    if (coaching.why) {
      parts.push(`<strong>Why it matters:</strong> ${coaching.why}`);
    }
    if (coaching.technique && coaching.technique.length) {
      const listItems = coaching.technique.map((t) => `<li>${t}</li>`).join("");
      parts.push(`<strong>Technique:</strong><ul>${listItems}</ul>`);
    }
    if (coaching.redFlag) {
      parts.push(
        `<strong>Red Flag:</strong> <span style="color: var(--rt-danger);">${coaching.redFlag}</span>`
      );
    }
    body.innerHTML = parts.join("<br><br>");
  } else {
    if (coaching.points && coaching.points.length) {
      const listItems = coaching.points.map((p) => `<li>${p}</li>`).join("");
      body.innerHTML = `<ul>${listItems}</ul>`;
    } else {
      body.textContent = "Coaching details coming soon.";
    }
  }

  section.appendChild(body);
  coachTabContentEl.appendChild(section);
}

// ===== COMPANIES VIEW =====
function renderCompanies() {
  companyListEl.innerHTML = "";

  companiesData.forEach((c) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.dataset.companyId = c.id;

    const title = document.createElement("div");
    title.className = "list-item-title";
    title.textContent = c.name;

    const sub = document.createElement("div");
    sub.className = "list-item-sub";
    sub.textContent = c.tagline || "";

    li.appendChild(title);
    li.appendChild(sub);

    li.addEventListener("click", () => handleCompanyClick(c.id));

    companyListEl.appendChild(li);
  });
}

function handleCompanyClick(companyId) {
  activeCompanyId = companyId;

  document.querySelectorAll("#companyList .list-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.companyId === companyId);
  });

  const company = companiesData.find((c) => c.id === companyId);
  if (!company) return;

  companyLabelEl.textContent = company.name;
  renderCompanyDetail(company);
}

function renderCompanyDetail(company) {
  companyDetailEl.innerHTML = "";

  const parts = [];

  if (company.overview) {
    parts.push(
      `<div class="coach-section">
         <div class="coach-section-title">Overview</div>
         <div class="coach-section-body">${company.overview}</div>
       </div>`
    );
  }

  if (company.compensation) {
    const items = company.compensation.map((c) => `<li>${c}</li>`).join("");
    parts.push(
      `<div class="coach-section">
         <div class="coach-section-title">Compensation Highlights</div>
         <div class="coach-section-body">
           <ul>${items}</ul>
         </div>
       </div>`
    );
  }

  if (company.requirements) {
    const items = company.requirements.map((r) => `<li>${r}</li>`).join("");
    parts.push(
      `<div class="coach-section">
         <div class="coach-section-title">Ideal Candidate / Requirements</div>
         <div class="coach-section-body">
           <ul>${items}</ul>
         </div>
       </div>`
    );
  }

  if (company.notes) {
    parts.push(
      `<div class="coach-section">
         <div class="coach-section-title">Notes</div>
         <div class="coach-section-body">${company.notes}</div>
       </div>`
    );
  }

  companyDetailEl.innerHTML =
    parts.join("") ||
    '<div class="coach-placeholder">No details yet. Add them in data/companies.json.</div>';
}

// ===== OBJECTIONS VIEW =====
function renderObjections() {
  objectionListEl.innerHTML = "";

  objectionsData.forEach((obj) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.dataset.objectionId = obj.id;

    const title = document.createElement("div");
    title.className = "list-item-title";
    title.textContent = obj.label;

    const sub = document.createElement("div");
    sub.className = "list-item-sub";
    sub.textContent = obj.category || "";

    li.appendChild(title);
    li.appendChild(sub);

    li.addEventListener("click", () => handleObjectionClick(obj.id));

    objectionListEl.appendChild(li);
  });
}

function handleObjectionClick(objectionId) {
  activeObjectionId = objectionId;

  document.querySelectorAll("#objectionList .list-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.objectionId === objectionId);
  });

  const obj = objectionsData.find((o) => o.id === objectionId);
  if (!obj) return;

  objectionLabelEl.textContent = obj.label;
  renderObjectionDetail(obj);
}

function renderObjectionDetail(obj) {
  objectionDetailEl.innerHTML = "";

  const parts = [];

  if (obj.script) {
    parts.push(
      `<div class="coach-section">
         <div class="coach-section-title">Core Handling Script</div>
         <div class="coach-section-body">${obj.script}</div>
       </div>`
    );
  }

  if (obj.bullets && obj.bullets.length) {
    const items = obj.bullets.map((b) => `<li>${b}</li>`).join("");
    parts.push(
      `<div class="coach-section">
         <div class="coach-section-title">Key Points</div>
         <div class="coach-section-body">
           <ul>${items}</ul>
         </div>
       </div>`
    );
  }

  if (obj.notes) {
    parts.push(
      `<div class="coach-section">
         <div class="coach-section-title">Notes</div>
         <div class="coach-section-body">${obj.notes}</div>
       </div>`
    );
  }

  objectionDetailEl.innerHTML =
    parts.join("") ||
    '<div class="coach-placeholder">No details yet. Add them in data/objections.json.</div>';
}
