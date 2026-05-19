const state = {
  boards: null,
  jobsPayload: null,
  activeIndustry: null,
  jobFilter: "",
  sourceFilter: "all",
};

const tabsEl = document.querySelector("#industry-tabs");
const boardContentEl = document.querySelector("#board-content");
const jobsContentEl = document.querySelector("#jobs-content");
const jobsUpdatedEl = document.querySelector("#jobs-updated");
const jobFilterEl = document.querySelector("#job-filter");
const sourceFilterEl = document.querySelector("#job-source-filter");

const tagClass = {
  Official: "",
  Curated: "gold",
  Company: "rose",
};

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

function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "Not configured yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
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
      renderBoard();
      renderTabs();
    });
  });
}

function renderBoard() {
  const industry = state.boards.industries.find((item) => item.id === state.activeIndustry);
  if (!industry) return;

  const links = industry.links
    .map((link) => {
      const className = tagClass[link.type] || "";
      const searchLink = link.searchUrl
        ? `<a class="button" href="${escapeHtml(link.searchUrl)}" target="_blank" rel="noreferrer">Saved Search</a>`
        : "";

      return `
        <article class="link-card">
          <div class="card-top">
            <div>
              <h3>${escapeHtml(link.name)}</h3>
              <p>${escapeHtml(link.description)}</p>
            </div>
            <span class="tag ${className}">${escapeHtml(link.type)}</span>
          </div>
          <p>${escapeHtml(link.cadence)}</p>
          <div class="card-actions">
            <a class="button button-primary" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">Open</a>
            ${searchLink}
          </div>
        </article>
      `;
    })
    .join("");

  const quickLinks = industry.quickActions
    .map((action) => `<a class="button" href="${escapeHtml(action.url)}" target="_blank" rel="noreferrer">${escapeHtml(action.label)}</a>`)
    .join("");

  boardContentEl.innerHTML = `
    <div class="industry-summary">
      <div class="summary-panel">
        <p class="eyebrow">${escapeHtml(industry.shortName)}</p>
        <h2>${escapeHtml(industry.headline)}</h2>
        <p>${escapeHtml(industry.description)}</p>
      </div>
      <div class="quick-actions">
        ${quickLinks}
      </div>
    </div>
    <div class="link-grid">
      ${links}
    </div>
  `;
}

function getAllJobs() {
  if (!state.jobsPayload?.searches) return [];
  return state.jobsPayload.searches.flatMap((search) =>
    search.jobs.map((job) => ({
      ...job,
      searchId: search.id,
      searchLabel: search.label,
      industry: search.industry,
    })),
  );
}

function populateSourceFilter() {
  const searches = state.jobsPayload?.searches || [];
  sourceFilterEl.innerHTML = [
    `<option value="all">All saved searches</option>`,
    ...searches.map((search) => `<option value="${escapeHtml(search.id)}">${escapeHtml(search.label)}</option>`),
  ].join("");
}

function renderJobs() {
  const configured = state.jobsPayload?.configured !== false;
  const updated = state.jobsPayload?.updatedAt;
  const statusMessage = configured
    ? `Last updated ${formatDateTime(updated)}`
    : "USAJOBS secrets are not configured yet";
  jobsUpdatedEl.textContent = statusMessage;

  const query = state.jobFilter.trim().toLowerCase();
  const jobs = getAllJobs()
    .filter((job) => state.sourceFilter === "all" || job.searchId === state.sourceFilter)
    .filter((job) => {
      if (!query) return true;
      return [job.title, job.organization, job.location, job.source, job.searchLabel]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0));

  if (!configured) {
    jobsContentEl.innerHTML = `
      <div class="empty-state">
        Add <code>USAJOBS_USER_AGENT</code> and <code>USAJOBS_AUTH_KEY</code> as GitHub Actions secrets, then run the update workflow.
      </div>
    `;
    return;
  }

  if (!jobs.length) {
    jobsContentEl.innerHTML = `<div class="empty-state">No matching jobs found for the current filters.</div>`;
    return;
  }

  jobsContentEl.innerHTML = jobs
    .map((job) => `
      <article class="job-card">
        <p class="job-source">${escapeHtml(job.searchLabel)} · ${escapeHtml(job.source || "USAJOBS")}</p>
        <h3><a href="${escapeHtml(job.url)}" target="_blank" rel="noreferrer">${escapeHtml(job.title)}</a></h3>
        <div class="job-meta">
          <span>${escapeHtml(job.organization || "Unknown organization")}</span>
          <span>${escapeHtml(job.location || "Location varies")}</span>
          <span>Posted ${escapeHtml(formatDate(job.postedAt))}</span>
          <span>Closes ${escapeHtml(formatDate(job.closesAt))}</span>
        </div>
        <div class="jobs-actions">
          <a class="button button-primary" href="${escapeHtml(job.url)}" target="_blank" rel="noreferrer">View Job</a>
          ${job.applyUrl ? `<a class="button" href="${escapeHtml(job.applyUrl)}" target="_blank" rel="noreferrer">Apply</a>` : ""}
        </div>
      </article>
    `)
    .join("");
}

async function init() {
  try {
    const [boards, jobsPayload] = await Promise.all([
      loadJson("data/boards.json"),
      loadJson("data/jobs.json"),
    ]);

    state.boards = boards;
    state.jobsPayload = jobsPayload;
    state.activeIndustry = boards.industries[0]?.id;

    renderTabs();
    renderBoard();
    populateSourceFilter();
    renderJobs();
  } catch (error) {
    boardContentEl.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    jobsContentEl.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

jobFilterEl.addEventListener("input", (event) => {
  state.jobFilter = event.target.value;
  renderJobs();
});

sourceFilterEl.addEventListener("change", (event) => {
  state.sourceFilter = event.target.value;
  renderJobs();
});

init();
