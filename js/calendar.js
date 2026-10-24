/* Calendar View with Dynamic 3-Color Coding: Main / Collections / Both */

let calCurrentDate = new Date();

function changeCalMonth(delta) {
  calCurrentDate.setMonth(calCurrentDate.getMonth() + delta);
  renderCalendar();
}

function renderCalendar() {
  const year = calCurrentDate.getFullYear();
  const month = calCurrentDate.getMonth();

  document.getElementById('calMonthLabel').innerText = new Date(year, month).toLocaleString(currentLang, { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const mainLogs = getLogs();
  const colItems = getCollectionItems();

  const dayData = {};
  mainLogs.forEach(l => {
    const d = new Date(l.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!dayData[key]) dayData[key] = { main: [], col: [] };
    dayData[key].main.push(l);
  });

  colItems.forEach(c => {
    const d = new Date((c.startDate || c.timestamp || new Date().toISOString()).slice(0, 10) + 'T00:00:00');
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!dayData[key]) dayData[key] = { main: [], col: [] };
    dayData[key].col.push(c);
  });

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    grid.innerHTML += `<div class="cal-cell empty"></div>`;
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const data = dayData[dateKey];
    const hasMain = data && data.main.length > 0;
    const hasCol = data && data.col.length > 0;

    let classColor = '';
    if (hasMain && hasCol) classColor = 'has-both';
    else if (hasMain) classColor = 'has-main';
    else if (hasCol) classColor = 'has-col';

    const totalCount = (hasMain ? data.main.length : 0) + (hasCol ? data.col.length : 0);

    const cell = document.createElement('div');
    cell.className = `cal-cell ${classColor}`;
    cell.innerHTML = `<span>${day}</span>${totalCount > 0 ? `<span class="badge">${totalCount} ●</span>` : ''}`;
    cell.onclick = () => inspectCalDay(dateKey, data || { main: [], col: [] });

    grid.appendChild(cell);
  }
}

function inspectCalDay(dateKey, data) {
  const inspector = document.getElementById('calDayInspector');
  const title = document.getElementById('calInspectDateTitle');
  const container = document.getElementById('calInspectLogs');

  inspector.style.display = 'block';
  title.innerText = new Date(dateKey + 'T00:00:00').toLocaleDateString(currentLang, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  if (data.main.length === 0 && data.col.length === 0) {
    container.innerHTML = `<p style="color:var(--subtext); font-size:13px; margin:8px 0;">No logs on this date.</p>`;
    return;
  }

  let html = '';
  if (data.main.length > 0) {
    html += `<div style="font-size:11px; font-weight:bold; color:var(--header-accent); margin-top:4px;">MAIN LOGS</div>`;
    data.main.forEach(l => {
      const timeStr = new Date(l.timestamp).toLocaleTimeString(currentLang, { hour: '2-digit', minute: '2-digit' });
      const emoji = l.emoji ? `${l.emoji} ` : '';
      const stars = l.rating ? ` <span style="color:#ffcc00">${'★'.repeat(l.rating)}</span>` : '';
      html += `
        <div style="padding: 4px 0; border-bottom: 1px dashed var(--border);">
          <small style="color:var(--subtext);">${timeStr}${stars}</small><br>
          <strong>${emoji}${l.note}</strong>
        </div>
      `;
    });
  }

  if (data.col.length > 0) {
    html += `<div style="font-size:11px; font-weight:bold; color:var(--header-accent); margin-top:8px;">COLLECTIONS</div>`;
    data.col.forEach(c => {
      const stars = c.rating ? ` <span style="color:#ffcc00">${'★'.repeat(c.rating)}</span>` : '';
      html += `
        <div style="padding: 4px 0; border-bottom: 1px dashed var(--border);">
          <span class="col-type-badge">${c.type}</span> <strong>${c.title}</strong>${stars}
        </div>
      `;
    });
  }

  container.innerHTML = html;
}
