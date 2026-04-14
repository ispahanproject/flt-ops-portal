const ICONS = {
  // Weather — cloud with sun
  weather: '<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m17.66 6.34 1.41-1.41"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M2 12h2"/><circle cx="12" cy="10" r="4"/><path d="M6 18a4 4 0 0 1 3.26-5.92A4 4 0 0 1 16 14h1a3 3 0 0 1 0 6H7a3 3 0 0 1-1-5.83Z"/>',
  // Takeoff — airplane lifting off runway
  takeoff: '<path d="M2 20h20"/><path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1 2.93-5.1a2 2 0 0 1 1.72-1l1.28.07L15 4l2 1-3 6h4l2-2 1 1-3 5H4.5Z"/>',
  // 1 Engine — engine with warning
  engine: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="m5.64 5.64 2.12 2.12"/><path d="m16.24 16.24 2.12 2.12"/><path d="m5.64 18.36 2.12-2.12"/><path d="m16.24 5.64 2.12 2.12"/><line x1="2" y1="2" x2="22" y2="22"/>',
  // Study / Regulations — book open
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  // Captain Report — clipboard with checklist
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  // Q&A — database / reference book
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
};

const GITHUB_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>';

let apps = [];
let activeTag = null;

async function init() {
  try {
    const res = await fetch('apps.json');
    apps = await res.json();
  } catch {
    apps = [];
  }
  renderFilters();
  renderGrid();
  updateFooter();
  document.getElementById('search').addEventListener('input', renderGrid);
}

function getAllTags() {
  const set = new Set();
  apps.forEach(app => (app.tags || []).forEach(t => set.add(t)));
  return [...set].sort();
}

function renderFilters() {
  const bar = document.getElementById('filterBar');
  const tags = getAllTags();
  if (tags.length === 0) return;

  const allChip = createChip('All', null);
  bar.appendChild(allChip);
  tags.forEach(tag => bar.appendChild(createChip(tag, tag)));
}

function createChip(label, tag) {
  const el = document.createElement('button');
  el.className = 'filter-chip' + (tag === activeTag ? ' active' : (!tag && !activeTag ? ' active' : ''));
  el.textContent = label;
  el.addEventListener('click', () => {
    activeTag = tag;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    renderGrid();
  });
  return el;
}

function renderGrid() {
  const query = document.getElementById('search').value.toLowerCase().trim();
  const grid = document.getElementById('appGrid');
  const empty = document.getElementById('emptyState');

  const filtered = apps.filter(app => {
    const matchesTag = !activeTag || (app.tags || []).includes(activeTag);
    const matchesSearch = !query ||
      app.title.toLowerCase().includes(query) ||
      app.description.toLowerCase().includes(query) ||
      (app.tags || []).some(t => t.toLowerCase().includes(query));
    return matchesTag && matchesSearch;
  });

  grid.innerHTML = '';

  if (filtered.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  // Group by category (preserve order from JSON)
  const groups = new Map();
  filtered.forEach(app => {
    const cat = app.category || 'Other';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(app);
  });

  groups.forEach((groupApps, category) => {
    // Section wrapper
    const section = document.createElement('div');
    section.className = 'section';

    // Section header
    const header = document.createElement('h2');
    header.className = 'section-title';
    header.textContent = category;
    section.appendChild(header);

    // Icon grid within section
    const iconGrid = document.createElement('div');
    iconGrid.className = 'icon-grid';

    groupApps.forEach(app => {
      const card = document.createElement('a');
      card.className = 'card';
      card.href = app.url;
      card.target = '_blank';
      card.rel = 'noopener';

      const iconSvg = ICONS[app.icon] || ICONS.weather;
      const color = app.color || '#6366f1';

      card.style.setProperty('--card-glow', color + '66');
      card.style.setProperty('--card-color', color + '55');
      card.innerHTML = `
        <div class="card-icon">
          <svg viewBox="0 0 24 24">${iconSvg}</svg>
        </div>
        <div class="card-title">${escapeHtml(app.title)}</div>
      `;

      iconGrid.appendChild(card);
    });

    section.appendChild(iconGrid);
    grid.appendChild(section);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const el = document.getElementById('clock');
  if (el) el.textContent = h + ':' + m + 'Z';
}

function updateFooter() {
  const countEl = document.getElementById('appCount');
  if (countEl) countEl.textContent = apps.length;

  const dateEl = document.getElementById('footerDate');
  if (dateEl) {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    dateEl.textContent = d + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
  }
}

updateClock();
setInterval(updateClock, 10000);

init();
