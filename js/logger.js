/* Main Logger Module with Standardized Deduplicated Tags */

function getLogs() {
  return JSON.parse(localStorage.getItem('my_pwa_logs') || '[]');
}

/* Sanitizes tag strings: lowercase, trimmed, no duplicates */
function cleanTags(tagStr) {
  if (!tagStr) return [];
  const rawParts = tagStr.split(/\s+/).map(p => p.trim().toLowerCase());
  const uniqueTags = new Set();
  rawParts.forEach(part => {
    if (!part) return;
    const formatted = part.startsWith('#') ? part : '#' + part;
    if (formatted.length > 1) uniqueTags.add(formatted);
  });
  return Array.from(uniqueTags);
}

function handleTagTyping(inputEl, chipBarId, appendFn) {
  let val = inputEl.value;
  if (val.endsWith(' ')) {
    const cleaned = cleanTags(val);
    inputEl.value = cleaned.length ? cleaned.join(' ') + ' ' : '';
  }
  updatePrefixTagSuggestions(inputEl, chipBarId, appendFn);
}

/* Dynamic Prefix Filtered Suggestions from real data only */
function updatePrefixTagSuggestions(inputEl, chipBarId, appendFn) {
  const container = document.getElementById(chipBarId);
  if (!container) return;

  const isCol = (chipBarId === 'colQuickTagBar');
  const items = isCol ? getCollectionItems() : getLogs();

  const tagCounts = {};
  items.forEach(item => {
    (item.tags || []).forEach(t => {
      const lower = t.toLowerCase();
      tagCounts[lower] = (tagCounts[lower] || 0) + 1;
    });
  });

  const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
  const currentTokens = (inputEl.value || '').trim().toLowerCase().split(/\s+/);
  const activeWord = currentTokens[currentTokens.length - 1] || '';

  let matches = [];
  if (activeWord) {
    const query = activeWord.startsWith('#') ? activeWord : '#' + activeWord;
    matches = sortedTags.filter(t => t.startsWith(query) && !currentTokens.includes(t));
  } else {
    matches = sortedTags.filter(t => !currentTokens.includes(t)).slice(0, 8);
  }

  if (matches.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = matches.map(tag => `
    <span class="tag-chip" onclick="${appendFn.name}('${tag}')">${tag}</span>
  `).join('');
}

function appendQuickTag(tagStr) {
  const input = document.getElementById('tags');
  const existing = cleanTags(input.value);
  if (!existing.includes(tagStr.toLowerCase())) {
    existing.push(tagStr.toLowerCase());
  }
  input.value = existing.join(' ') + ' ';
  updatePrefixTagSuggestions(input, 'quickTagBar', appendQuickTag);
}

function setLogRating(val) {
  document.getElementById('selectedLogRating').value = val;
  const stars = document.querySelectorAll('#logStarRating .star');
  stars.forEach((s, idx) => {
    if (idx < val) s.classList.add('active');
    else s.classList.remove('active');
  });
}

function selectEmoji(el, emojiChar) {
  document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
  const hiddenInput = document.getElementById('selectedEmoji');
  if (hiddenInput.value === emojiChar) {
    hiddenInput.value = '';
  } else {
    el.classList.add('selected');
    hiddenInput.value = emojiChar;
  }
}

function saveLog() {
  const tagsInput = document.getElementById('tags').value;
  const noteInput = document.getElementById('note').value.trim();
  const datetimeInput = document.getElementById('customDatetime').value;
  const emojiInput = document.getElementById('selectedEmoji').value;
  const ratingInput = parseInt(document.getElementById('selectedLogRating').value || '0');
  const editingId = document.getElementById('editingId').value;

  if (!noteInput) return alert(t('details') + ' is required.');

  const formattedTags = cleanTags(tagsInput);
  const finalTimestamp = datetimeInput ? new Date(datetimeInput).toISOString() : new Date().toISOString();
  let logs = getLogs();

  if (editingId) {
    logs = logs.map(log => log.id == editingId ? {
      ...log,
      timestamp: finalTimestamp,
      emoji: emojiInput,
      rating: ratingInput,
      tags: formattedTags,
      note: noteInput
    } : log);
  } else {
    logs.push({
      id: Date.now(),
      created_at: new Date().toISOString(),
      timestamp: finalTimestamp,
      emoji: emojiInput,
      rating: ratingInput,
      tags: formattedTags,
      note: noteInput
    });
  }

  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  localStorage.setItem('my_pwa_logs', JSON.stringify(logs));
  resetForm();
  renderLogs();
  updatePrefixTagSuggestions(document.getElementById('tags'), 'quickTagBar', appendQuickTag);
}

function editLog(id) {
  const log = getLogs().find(l => l.id == id);
  if (!log) return;

  document.getElementById('editingId').value = log.id;
  document.getElementById('tags').value = (log.tags || []).join(' ') + ' ';
  document.getElementById('note').value = log.note;
  document.getElementById('selectedEmoji').value = log.emoji || '';
  setLogRating(log.rating || 0);

  document.querySelectorAll('.emoji-opt').forEach(e => {
    if (e.innerText === log.emoji) e.classList.add('selected');
    else e.classList.remove('selected');
  });

  const localDate = new Date(log.timestamp);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  document.getElementById('customDatetime').value = localDate.toISOString().slice(0, 16);

  document.getElementById('saveBtn').innerText = t('update');
  document.getElementById('cancelEditBtn').style.display = 'block';
  document.getElementById('entryCard').style.display = 'block';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteLog(id) {
  if (!confirm('Are you sure you want to delete this entry?')) return;
  localStorage.setItem('my_pwa_logs', JSON.stringify(getLogs().filter(l => l.id != id)));
  renderLogs();
  updatePrefixTagSuggestions(document.getElementById('tags'), 'quickTagBar', appendQuickTag);
}

function deleteAllLogs() {
  if (confirm('FIRST WARNING: Are you sure you want to delete ALL main log entries? This cannot be undone.')) {
    if (confirm('FINAL CONFIRMATION: Tap OK to permanently wipe your main log timeline.')) {
      localStorage.removeItem('my_pwa_logs');
      renderLogs();
      updatePrefixTagSuggestions(document.getElementById('tags'), 'quickTagBar', appendQuickTag);
      closeView('settingsView');
      alert('Main log timeline erased.');
    }
  }
}

function cancelEdit() { resetForm(); }

function resetForm() {
  document.getElementById('editingId').value = '';
  document.getElementById('tags').value = '';
  document.getElementById('note').value = '';
  document.getElementById('selectedEmoji').value = '';
  setLogRating(0);
  document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
  setCurrentDatetime();
  document.getElementById('saveBtn').innerText = t('save');
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('entryCard').style.display = 'none';
}

function getFilteredLogs() {
  const logs = getLogs();
  const query = (document.getElementById('searchFilter').value || '').toLowerCase().trim();
  if (!query) return logs;
  return logs.filter(l =>
    l.note.toLowerCase().includes(query) ||
    (l.tags || []).some(t => t.toLowerCase().includes(query))
  );
}

function renderLogs() {
  const container = document.getElementById('logsContainer');
  const searchQuery = (document.getElementById('searchFilter').value || '').trim();
  const filteredLogs = getFilteredLogs();

  const filterBtn = document.getElementById('filteredExportBtn');
  if (searchQuery) {
    filterBtn.innerText = `${t('export_filtered')} (${filteredLogs.length})`;
    filterBtn.style.display = 'block';
  } else {
    filterBtn.style.display = 'none';
  }

  if (filteredLogs.length === 0) {
    container.innerHTML = `<p style="color:var(--subtext); margin-top:12px;">${searchQuery ? t('no_matches') : t('no_logs')}</p>`;
    return;
  }

  const grouped = {};
  filteredLogs.forEach(log => {
    const d = new Date(log.timestamp);
    const year = d.getFullYear();
    const month = d.toLocaleString(currentLang, { month: 'long' });
    const dateStr = d.toLocaleDateString(currentLang, { weekday: 'short', month: 'short', day: 'numeric' });
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = {};
    if (!grouped[year][month][dateStr]) grouped[year][month][dateStr] = [];
    grouped[year][month][dateStr].push(log);
  });

  let html = '';
  for (const year in grouped) {
    html += `<div class="year-header">${year}</div>`;
    for (const month in grouped[year]) {
      html += `<div class="month-header">${month}</div>`;
      for (const dateStr in grouped[year][month]) {
        html += `<div class="date-card"><div class="date-title">${dateStr}</div>`;
        grouped[year][month][dateStr].forEach(l => {
          const timeStr = new Date(l.timestamp).toLocaleTimeString(currentLang, { hour: '2-digit', minute: '2-digit' });
          const emojiDisplay = l.emoji ? `<span style="margin-right:6px; font-size:16px;">${l.emoji}</span>` : '';
          const starsDisplay = l.rating ? `<span style="color:#ffcc00; margin-left:6px;">${'★'.repeat(l.rating)}</span>` : '';
          html += `
            <div class="log-entry">
              <div class="log-header-row">
                <span class="time">${timeStr}${starsDisplay}</span>
                <div class="action-btns">
                  <button class="btn-icon" onclick="editLog(${l.id})">✏️</button>
                  <button class="btn-icon" onclick="deleteLog(${l.id})">🗑️</button>
                </div>
              </div>
              <div style="margin-top: 4px;">${emojiDisplay}<strong>${l.note}</strong></div>
              <div>${(l.tags || []).map(tg => `<span class="tag">${tg}</span>`).join('')}</div>
            </div>
          `;
        });
        html += `</div>`;
      }
    }
  }
  container.innerHTML = html;
}

async function exportCSV(onlyFiltered = false) {
  const logsToExport = onlyFiltered ? getFilteredLogs() : getLogs();
  if (logsToExport.length === 0) return alert('No data to export.');

  let csv = "EventTimestamp,RecordedTimestamp,Rating,Emoji,Tags,Note\n";
  logsToExport.forEach(l => {
    const recorded = l.created_at || l.timestamp;
    const rating = l.rating || '';
    const emoji = l.emoji || '';
    const tags = (l.tags || []).join(' ');
    csv += `"${l.timestamp}","${recorded}","${rating}","${emoji}","${tags}","${l.note.replace(/"/g, '""')}"\n`;
  });

  const prefix = onlyFiltered ? 'filtered_logs' : 'main_tracker_export';
  const fileName = `${prefix}_${new Date().toISOString().slice(0,10)}.csv`;
  triggerShareOrDownload(csv, fileName);
}
