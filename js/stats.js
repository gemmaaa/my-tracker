/* Analytics & Statistics with Chronologically Sorted Charts & Multi-Faceted Collections Filtering */

function renderStats() {
  /* 1. Main Log Analytics */
  const logs = getLogs();
  if (logs.length === 0) {
    document.getElementById('st-streak').innerText = '0';
    document.getElementById('st-total').innerText = '0';
    document.getElementById('st-avg').innerText = '0';
    document.getElementById('st-peak').innerText = '-';
    document.getElementById('topTagsList').innerHTML = '<p style="color:var(--subtext);">No logs recorded yet.</p>';
    document.getElementById('svgChartBox').innerHTML = '';
  } else {
    document.getElementById('st-total').innerText = logs.length;

    const uniqueDates = Array.from(new Set(logs.map(l => l.timestamp.slice(0,10)))).sort().reverse();
    let streak = 0;
    const todayStr = new Date().toISOString().slice(0,10);
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0,10);

    if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
      let checkDate = new Date(uniqueDates.includes(todayStr) ? todayStr : yesterdayStr);
      while (true) {
        const key = checkDate.toISOString().slice(0,10);
        if (uniqueDates.includes(key)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      }
    }
    document.getElementById('st-streak').innerText = streak;

    const avg = (logs.length / Math.max(1, uniqueDates.length)).toFixed(1);
    document.getElementById('st-avg').innerText = avg;

    const hours = {};
    logs.forEach(l => {
      const h = new Date(l.timestamp).getHours();
      hours[h] = (hours[h] || 0) + 1;
    });
    const peakHour = Object.keys(hours).reduce((a, b) => hours[a] > hours[b] ? a : b, 12);
    const ampm = peakHour >= 12 ? 'PM' : 'AM';
    document.getElementById('st-peak').innerText = `${peakHour % 12 || 12}${ampm}`;

    const tagCounts = {};
    logs.forEach(l => (l.tags || []).forEach(t => tagCounts[t.toLowerCase()] = (tagCounts[t.toLowerCase()] || 0) + 1));
    const sortedTags = Object.entries(tagCounts).sort((a,b) => b[1] - a[1]);
    const top5 = sortedTags.slice(0, 5);

    document.getElementById('topTagsList').innerHTML = top5.length ? top5.map(([tag, count], i) => `
      <div style="display:flex; justify-content:space-between; padding: 4px 0; border-bottom: 1px dashed var(--border);">
        <span><strong>${i+1}. ${tag}</strong></span>
        <span style="color:var(--subtext);">${count} logs</span>
      </div>
    `).join('') : '<p style="color:var(--subtext);">No tags used yet.</p>';

    const chartSelect = document.getElementById('chartTagSelect');
    chartSelect.innerHTML = sortedTags.map(([tag]) => `<option value="${tag}">${tag}</option>`).join('');
    if (sortedTags.length === 0) chartSelect.innerHTML = '<option value="">No tags</option>';

    renderChart();
  }

  /* 2. Collections Analytics */
  const colItems = getCollectionItems();
  document.getElementById('cst-total').innerText = colItems.length;

  const finished = colItems.filter(i => i.endDate).length;
  document.getElementById('cst-finished').innerText = finished;

  const ratings = colItems.filter(i => i.rating).map(i => i.rating);
  const avgRating = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) + ' ★' : '-';
  document.getElementById('cst-avg-rating').innerText = avgRating;

  const allTypes = getAllCollectionTypes();
  const breakdownCounts = allTypes.map(t => `${t}: ${colItems.filter(i => i.type === t).length}`);
  document.getElementById('cst-breakdown').innerText = breakdownCounts.join(' | ') || '-';

  populateColChartFilters();
  renderTopRatedCollections();
}

/* Chronologically Sorted SVG Main Chart */
function renderChart() {
  const selectedTag = document.getElementById('chartTagSelect').value;
  const grain = document.getElementById('chartGrainSelect').value;
  const box = document.getElementById('svgChartBox');

  if (!selectedTag) {
    box.innerHTML = '<p style="color:var(--subtext); text-align:center; padding-top:40px;">No tag selected.</p>';
    return;
  }

  const logs = getLogs().filter(l => (l.tags || []).map(t => t.toLowerCase()).includes(selectedTag.toLowerCase()));
  const buckets = {};

  logs.forEach(l => {
    const d = new Date(l.timestamp);
    let key;
    if (grain === 'daily') key = d.toISOString().slice(5, 10);
    else if (grain === 'monthly') key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    else key = `W${Math.ceil(d.getDate()/7)} ${d.toLocaleString('default',{month:'short'})}`;
    buckets[key] = (buckets[key] || 0) + 1;
  });

  /* Strict chronological sort of bucket keys */
  const sortedKeys = Object.keys(buckets).sort((a, b) => a.localeCompare(b)).slice(-7);
  const values = sortedKeys.map(k => buckets[k]);

  if (sortedKeys.length === 0) {
    box.innerHTML = '<p style="color:var(--subtext); text-align:center; padding-top:40px;">No history for this tag.</p>';
    return;
  }

  box.innerHTML = generateSvgPolyline(sortedKeys, values);
}

/* Multi-Faceted Collections Chart Setup */
function populateColChartFilters() {
  const typeSelect = document.getElementById('colChartTypeSelect');
  const allTypes = getAllCollectionTypes();
  typeSelect.innerHTML = `<option value="ALL">All Types</option>` + allTypes.map(t => `<option value="${t}">${t}</option>`).join('');
  onColChartTypeChange();
}

function onColChartTypeChange() {
  const typeSelect = document.getElementById('colChartTypeSelect');
  const tagSelect = document.getElementById('colChartTagSelect');
  const selectedType = typeSelect.value;
  const items = getCollectionItems();

  const filteredItems = (selectedType === 'ALL') ? items : items.filter(i => i.type === selectedType);
  const tagCounts = {};
  filteredItems.forEach(i => (i.tags || []).forEach(t => tagCounts[t.toLowerCase()] = (tagCounts[t.toLowerCase()] || 0) + 1));

  const sortedTags = Object.keys(tagCounts).sort((a,b) => tagCounts[b] - tagCounts[a]);
  tagSelect.innerHTML = `<option value="ALL">All Tags</option>` + sortedTags.map(t => `<option value="${t}">${t} (${tagCounts[t]})</option>`).join('');

  renderCollectionChart();
}

function renderCollectionChart() {
  const selectedType = document.getElementById('colChartTypeSelect').value;
  const selectedTag = document.getElementById('colChartTagSelect').value;
  const grain = document.getElementById('colChartGrainSelect').value;
  const box = document.getElementById('svgColChartBox');

  let items = getCollectionItems();
  if (selectedType !== 'ALL') items = items.filter(i => i.type === selectedType);
  if (selectedTag !== 'ALL') items = items.filter(i => (i.tags || []).map(t => t.toLowerCase()).includes(selectedTag.toLowerCase()));

  if (items.length === 0) {
    box.innerHTML = '<p style="color:var(--subtext); text-align:center; padding-top:40px;">No records match criteria.</p>';
    return;
  }

  const buckets = {};
  items.forEach(i => {
    const d = new Date((i.startDate || i.timestamp || new Date().toISOString()).slice(0, 10) + 'T00:00:00');
    let key;
    if (grain === 'daily') key = d.toISOString().slice(5, 10);
    else if (grain === 'monthly') key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    else key = `W${Math.ceil(d.getDate()/7)} ${d.toLocaleString('default',{month:'short'})}`;
    buckets[key] = (buckets[key] || 0) + 1;
  });

  const sortedKeys = Object.keys(buckets).sort((a, b) => a.localeCompare(b)).slice(-7);
  const values = sortedKeys.map(k => buckets[k]);

  box.innerHTML = generateSvgPolyline(sortedKeys, values);
}

function generateSvgPolyline(keys, values) {
  const maxVal = Math.max(...values, 1);
  const width = 280; const height = 120; const padding = 20;

  const points = values.map((val, idx) => {
    const x = padding + (idx / Math.max(1, keys.length - 1)) * (width - 2 * padding);
    const y = height - padding - (val / maxVal) * (height - 2 * padding);
    return { x, y, val, label: keys[idx] };
  });

  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%;">
      <polyline points="${polylineStr}" />
      ${points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="4" />
        <text x="${p.x}" y="${height - 2}" font-size="8" fill="var(--subtext)" text-anchor="middle">${p.label}</text>
        <text x="${p.x}" y="${p.y - 7}" font-size="9" font-weight="bold" fill="var(--text)" text-anchor="middle">${p.val}</text>
      `).join('')}
    </svg>
  `;
}

function renderTopRatedCollections() {
  const container = document.getElementById('topRatedCollectionsContainer');
  const items = getCollectionItems();
  const allTypes = getAllCollectionTypes();

  let html = '';
  allTypes.forEach(type => {
    const typeItems = items.filter(i => i.type === type && i.rating > 0);
    const top3 = typeItems.sort((a, b) => b.rating - a.rating).slice(0, 3);

    html += `<div style="margin-top: 8px;"><strong>${type}</strong></div>`;
    if (top3.length === 0) {
      html += `<div style="font-size:12px; color:var(--subtext); font-style:italic; padding: 2px 0;">None rated yet.</div>`;
    } else {
      top3.forEach((item, idx) => {
        html += `
          <div class="top-col-item">
            <strong>${idx+1}. ${item.title}</strong> ${item.author ? `<span style="font-size:11px; color:var(--subtext);">(By ${item.author})</span>` : ''}
            <span style="color:#ffcc00; margin-left:4px;">${'★'.repeat(item.rating)}</span>
          </div>
        `;
      });
    }
  });

  container.innerHTML = html;
}
