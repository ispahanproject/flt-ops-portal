const ICONS = {
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  layout: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  gamepad: '<line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/>',
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

      const iconSvg = ICONS[app.icon] || ICONS.globe;
      const color = app.color || '#6366f1';

      card.style.setProperty('--card-glow', color + '66');
      card.innerHTML = `
        <div class="card-icon" style="background:${color}">
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
