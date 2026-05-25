const state = {
  boards: null,
  activeIndustry: null,
};

const tabsEl = document.querySelector("#industry-tabs");
const boardContentEl = document.querySelector("#board-content");

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[char];
  });
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
}

function renderTabs() {
  tabsEl.innerHTML = state.boards.industries
    .map((industry) => {
      const selected = industry.id === state.activeIndustry;
      return `
        <button class="tab" type="button" aria-selected="${selected}" data-industry="${escapeHtml(industry.id)}">
          ${escapeHtml(industry.name)}
        </button>
      `;
    })
    .join("");

  tabsEl.querySelectorAll("[data-industry]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeIndustry = button.dataset.industry;
      renderTabs();
      renderBoard();
    });
  });
}

function renderCards(items) {
  return items
    .map((item) => `
      <article class="site-card">
        <h3>${escapeHtml(item.name)}</h3>
        ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
        <a class="button button-primary" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Open</a>
      </article>
    `)
    .join("");
}

function renderSiteSection(title, items) {
  return `
    <section class="content-section">
      <div class="subheading">
        <h2>${escapeHtml(title)}</h2>
        <span class="count">${items.length}</span>
      </div>
      <div class="site-grid">
        ${renderCards(items)}
      </div>
    </section>
  `;
}

function renderKeywordSearch(industry) {
  if (!industry.keywordSearch) return "";

  const options = industry.keywordSearch.sites
    .map((site) => `<option value="${escapeHtml(site.template)}">${escapeHtml(site.name)}</option>`)
    .join("");

  return `
    <section class="content-section keyword-section">
      <div class="subheading">
        <h2>Keyword Search</h2>
      </div>
      <form class="keyword-form" data-keyword-search>
        <label class="field">
          <span>Site</span>
          <select name="site" aria-label="Search site">${options}</select>
        </label>
        <label class="field keyword-input">
          <span>Keywords</span>
          <input name="query" type="search" required placeholder="${escapeHtml(industry.keywordSearch.placeholder)}">
        </label>
        <button class="button button-primary search-submit" type="submit">Search</button>
      </form>
    </section>
  `;
}

function renderAutomation(industry) {
  const ready = industry.automation.ready.length
    ? industry.automation.ready
      .map((source) => `
        <li>
          <strong>${escapeHtml(source.name)}</strong>
          <span>${escapeHtml(source.requirement)}</span>
        </li>
      `)
      .join("")
    : `<li><span>No source on this tab has a documented public job-listings API confirmed yet.</span></li>`;

  const requirements = industry.automation.requirements
    .map((note) => `<p>${escapeHtml(note)}</p>`)
    .join("");
  const research = industry.automation.research
    .map((note) => `<li>${escapeHtml(note)}</li>`)
    .join("");

  return `
    <section class="content-section newest-section" id="newest-jobs">
      <div class="subheading">
        <div>
          <p class="eyebrow">Planned daily update</p>
          <h2>Newest Jobs</h2>
        </div>
        <span class="status">Not active yet</span>
      </div>
      <div class="automation-grid">
        <div class="automation-panel ready-panel">
          <h3>Possible To Automate</h3>
          <ul>${ready}</ul>
        </div>
        <div class="automation-panel">
          <h3>Requirements And Research</h3>
          ${requirements}
          <ul>${research}</ul>
        </div>
      </div>
    </section>
  `;
}

function bindKeywordSearch() {
  const form = boardContentEl.querySelector("[data-keyword-search]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const template = formData.get("site");
    const query = String(formData.get("query") || "").trim();
    if (!query || typeof template !== "string") return;
    const destination = template.replace("{query}", encodeURIComponent(query));
    window.open(destination, "_blank", "noopener,noreferrer");
  });
}

function renderBoard() {
  const industry = state.boards.industries.find((item) => item.id === state.activeIndustry);
  if (!industry) return;

  boardContentEl.innerHTML = `
    <header class="summary-panel">
      <p class="eyebrow">${escapeHtml(industry.shortName)}</p>
      <h2>${escapeHtml(industry.headline)}</h2>
      <p>${escapeHtml(industry.description)}</p>
    </header>
    ${renderKeywordSearch(industry)}
    ${renderSiteSection("Careers Pages", industry.careers)}
    ${renderSiteSection("Job Boards", industry.jobBoards)}
    ${renderAutomation(industry)}
  `;

  bindKeywordSearch();
}

async function init() {
  try {
    state.boards = await loadJson("data/boards.json");
    state.activeIndustry = state.boards.industries[0]?.id;
    renderTabs();
    renderBoard();
  } catch (error) {
    boardContentEl.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

init();
