// GitHub username and filter
const GITHUB_USER = "peteorbase";

// DOM elements
const repoList = document.getElementById("repo-list");
const languageFilter = document.getElementById("language-filter");

let allRepos = [];
let languagesSet = new Set();

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {year: "numeric", month: "short", day: "numeric"});
}

// Fetch all public repos (paginated)
async function fetchRepos() {
  let page = 1;
  let repos = [];
  let fetched = [];
  do {
    const resp = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&page=${page}`);
    fetched = await resp.json();
    repos = repos.concat(fetched);
    page++;
  } while (fetched.length === 100);
  return repos;
}

// Get topics for a repo (needs a separate request per repo for topics)
async function fetchRepoTopics(repo) {
  const resp = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${repo}/topics`, {
    headers: {"Accept": "application/vnd.github.mercy-preview+json"}
  });
  if (resp.ok) {
    const data = await resp.json();
    return data.names || [];
  }
  return [];
}

// Render a single repo card
function renderRepoCard(repo) {
  // Use topics directly from the repo object (repo.topics)
  const topicsHtml = repo.topics ? repo.topics.map(t => `<span class="tag">${t}</span>`).join('') : '';
  
  return `
    <div class="repo-card" data-language="${repo.language || ''}">
      <a href="${repo.html_url}" class="repo-title" target="_blank">${repo.name}</a>
      ${repo.description ? `<div class="repo-desc">${repo.description}</div>` : ``}
      <div class="repo-meta">
        ${repo.language ? `<span>🛠️ ${repo.language}</span>` : ``}
        <span>⭐ ${repo.stargazers_count}</span>
        <span>🕓 ${new Date(repo.updated_at).toLocaleDateString()}</span>
      </div>
      <div class="repo-topics">${topicsHtml}</div>
    </div>
  `;
}

// Populate language filter dropdown
function fillLanguageFilter(languages) {
  // Clear current options (except "All")
  for (let i = languageFilter.options.length - 1; i > 0; i--) {
    languageFilter.remove(i);
  }
  Array.from(languages)
    .sort((a, b) => a.localeCompare(b))
    .forEach(lang => {
      let opt = document.createElement("option");
      opt.value = lang;
      opt.textContent = lang;
      languageFilter.appendChild(opt);
    });
}

// Main render function
async function renderRepos(repos) {
  repoList.innerHTML = `<div style="color:var(--text-light)">Loading topics…</div>`;
  // Fetch topics for each repo in parallel
  const topicsList = await Promise.all(
    repos.map(r => fetchRepoTopics(r.name))
  );
  repoList.innerHTML = repos.map((r, i) => renderRepoCard(r, topicsList[i])).join('');
}

// Filter repos by selected language
function filterRepos() {
  const lang = languageFilter.value;
  document.querySelectorAll('.repo-card').forEach(card => {
    if (lang === "all" || card.dataset.language === lang) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });
}

// Initial load
(async function init() {
  repoList.innerHTML = `<div style="color:var(--text-light)">Loading repositories…</div>`;
  allRepos = await fetchRepos();
  // Build unique language list
  allRepos.forEach(r => {
    if (r.language) languagesSet.add(r.language);
  });
  fillLanguageFilter(languagesSet);
  await renderRepos(allRepos);
})();

// Listen for filter changes
languageFilter.addEventListener("change", filterRepos);
