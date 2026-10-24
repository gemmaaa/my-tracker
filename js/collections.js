/* Collections Module with Custom Types, Deduplicated Tags & Prefix Bar */

const DEFAULT_COLLECTION_TYPES = ['Movie', 'Book', 'TV Series'];

function getCustomCollectionTypes() {
  return JSON.parse(localStorage.getItem('custom_col_types') || '[]');
}

function getAllCollectionTypes() {
  return [...DEFAULT_COLLECTION_TYPES, ...getCustomCollectionTypes()];
}

function getCollectionItems() {
  let items = JSON.parse(localStorage.getItem('my_pwa_collections') || 'null');
  
  // If no collections exist yet, check if old media logs exist
  if (!items) {
    const legacyMedia = localStorage.getItem('my_pwa_media');
    if (legacyMedia) {
      items = JSON.parse(legacyMedia);
      // Migrate them over to the new collections key
      localStorage.setItem('my_pwa_collections', JSON.stringify(items));
    } else {
      items = [];
    }
  }
  return items;
}

function populateCollectionTypeDropdown() {
  const select = document.getElementById('colType');
  const currentVal = select.value;
  const types = getAllCollectionTypes();
  select.innerHTML = types.map(t => `<option value="${t}">${t}</option>`).join('');

  if (types.includes(currentVal)) select.value = currentVal;
  select.onchange = onColTypeChange;
  onColTypeChange();
}

function onColTypeChange() {
  const currentVal = document.getElementById('colType').value;
  const btnDelete = document.getElementById('btnDeleteCustomType');
  const customTypes = getCustomCollectionTypes();
  if (customTypes.includes(currentVal)) {
    btnDelete.style.display = 'block';
  } else {
    btnDelete.style.display = 'none';
  }
}

function promptAddCustomType() {
  const name = prompt('Enter new Collection Type name (e.g. Podcast, Video Game, Board Game):');
  if (!name || !name.trim()) return;
  const cleanName = name.trim();
  const allTypes = getAllCollectionTypes();

  if (allTypes.map(t => t.toLowerCase()).includes(cleanName.toLowerCase())) {
    return alert('This collection type already exists.');
  }

  const customTypes = getCustomCollectionTypes();
  customTypes.push(cleanName);
  localStorage.setItem('custom_col_types', JSON.stringify(customTypes));
  populateCollectionTypeDropdown();
  document.getElementById('colType').value = cleanName;
  onColTypeChange();
  if (typeof renderStats === 'function') renderStats();
}

function removeCurrentCustomType() {
  const currentType = document.getElementById('colType').value;
  const customTypes = getCustomCollectionTypes();
  if (!customTypes.includes(currentType)) return;

  const items = getCollectionItems();
  const usageCount = items.filter(i => i.type === currentType).length;

  if (usageCount > 0) {
    alert(`This collection type has been used ${usageCount} time(s). Please remove or reassign those records before deleting this collection type.`);
    return;
  }

  if (confirm(`Are you sure you want to delete the "${currentType}" collection type?`)) {
    const updated = customTypes.filter(t => t !== currentType);
    localStorage.setItem('custom_col_types', JSON.stringify(updated));
    populateCollectionTypeDropdown();
    if (typeof renderStats === 'function') renderStats();
  }
}

function appendColQuickTag(tagStr) {
  const input = document.getElementById('colTags');
  const existing = cleanTags(input.value);
  if (!existing.includes(tagStr.toLowerCase())) {
    existing.push(tagStr.toLowerCase());
  }
  input.value = existing.join(' ') + ' ';
  updatePrefixTagSuggestions(input, 'colQuickTagBar', appendColQuickTag);
}

function setColRating(val) {
  document.getElementById('selectedColRating').value = val;
  const stars = document.querySelectorAll('#colStarRating .star');
  stars.forEach((s, idx) => {
    if (idx < val) s.classList.add('active');
    else s.classList.remove('active');
  });
}

function toggleCollectionForm() {
  const card = document.getElementById('collectionFormCard');
  card.style.display = (card.style.display === 'none') ? 'block' : 'none';
  if (card.style.display === 'block') {
    updatePrefixTagSuggestions(document.getElementById('colTags'), 'colQuickTagBar', appendColQuickTag);
  }
}

async function fetchCollectionAutoInfo(title, type) {
  try {
    if (type === 'Book') {
      const res = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`);
      const data = await res.json();
      if (data.docs && data.docs.length > 0) {
        const doc = data.docs[0];
        const coverId = doc.cover_i;
        const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
        const summary = doc.first_sentence ? doc.first_sentence.join(' ') : (doc.author_name ? `By ${doc.author_name.join(', ')}` : null);
        return { coverUrl, summary };
      }
    }
  } catch (err) { console.log('API Fetch Error:', err); }
  return null;
}

async function saveCollectionItem() {
  const type = document.getElementById('colType').value;
  const title = document.getElementById('colTitle').value.trim();
  const author = document.getElementById('colAuthor').value.trim();
  const startDate = document.getElementById('colStartDate').value;
  const endDate = document.getElementById('colEndDate').value || null;
  const rating = parseInt(document.getElementById('selectedColRating').value || '0');
  const tagsInput = document.getElementById('colTags').value;
  const notes = document.getElementById('colNotes').value.trim();
  const editingId = document.getElementById('editingColId').value;

  if (!title) return alert(t('col_title_input') + ' is required.');

  const formattedTags = cleanTags(tagsInput);
  let apiData = null;
  if (!editingId && type === 'Book') {
    apiData = await fetchCollectionAutoInfo(title, type);
  }

  const items = getCollectionItems();

  if (editingId) {
    const idx = items.findIndex(i => i.id == editingId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], type, title, author, startDate, endDate, rating, tags: formattedTags, notes };
    }
  } else {
    items.unshift({
      id: Date.now(),
      type, title, author, startDate, endDate, rating, tags: formattedTags, notes,
      coverUrl: apiData ? apiData.coverUrl : null,
      summary: apiData ? apiData.summary : null
    });
  }

  localStorage.setItem('my_pwa_collections', JSON.stringify(items));
  cancelCollectionEdit();
  renderCollectionList();
}

function editCollectionItem(id) {
  const item = getCollectionItems().find(i => i.id == id);
  if (!item) return;

  document.getElementById('editingColId').value = item.id;
  document.getElementById('colType').value = item.type;
  document.getElementById('colTitle').value = item.title;
  document.getElementById('colAuthor').value = item.author || '';
  document.getElementById('colTags').value = (item.tags || []).join(' ') + ' ';
  document.getElementById('colNotes').value = item.notes || '';
  setColRating(item.rating || 0);
  onColTypeChange();

  if (item.startDate) document.getElementById('colStartDate').value = item.startDate.slice(0, 10);
  if (item.endDate) document.getElementById('colEndDate').value = item.endDate.slice(0, 10);
  else document.getElementById('colEndDate').value = '';

  document.getElementById('saveColBtn').innerText = t('col_update');
  document.getElementById('cancelColEditBtn').style.display = 'block';

  /* Isolated Editing View: Hide controls & feed */
  document.getElementById('collectionFormCard').style.display = 'block';
  document.getElementById('colControlsRow').style.display = 'none';
  document.getElementById('colFeedSearchWrapper').style.display = 'none';
  document.getElementById('collectionsContainer').style.display = 'none';

  updatePrefixTagSuggestions(document.getElementById('colTags'), 'colQuickTagBar', appendColQuickTag);
}

function cancelCollectionEdit() {
  document.getElementById('editingColId').value = '';
  document.getElementById('colTitle').value = '';
  document.getElementById('colAuthor').value = '';
  document.getElementById('colTags').value = '';
  document.getElementById('colNotes').value = '';
  document.getElementById('colEndDate').value = '';
  setColRating(0);
  document.getElementById('saveColBtn').innerText = t('col_save');
  document.getElementById('cancelColEditBtn').style.display = 'none';

  /* Restore normal feed mode */
  document.getElementById('collectionFormCard').style.display = 'none';
  document.getElementById('colControlsRow').style.display = 'flex';
  document.getElementById('colFeedSearchWrapper').style.display = 'block';
  document.getElementById('collectionsContainer').style.display = 'block';

  setCurrentDatetime();
}

function deleteCollectionItem(id) {
  if (!confirm('Delete this collection entry?')) return;
  localStorage.setItem('my_pwa_collections', JSON.stringify(getCollectionItems().filter(i => i.id != id)));
  renderCollectionList();
}

function toggleCollectionCardExpand(cardId) {
  const details = document.getElementById(`col-details-${cardId}`);
  if (details) details.style.display = (details.style.display === 'none') ? 'block' : 'none';
}

function renderCollectionList() {
  const items = getCollectionItems();
  const searchQuery = (document.getElementById('colSearchFilter').value || '').toLowerCase().trim();
  const container = document.getElementById('collectionsContainer');

  const filtered = items.filter(i => {
    if (!searchQuery) return true;
    return i.title.toLowerCase().includes(searchQuery) ||
           (i.author || '').toLowerCase().includes(searchQuery) ||
           (i.notes || '').toLowerCase().includes(searchQuery) ||
           (i.tags || []).some(tg => tg.toLowerCase().includes(searchQuery)) ||
           i.type.toLowerCase().includes(searchQuery);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p style="color:var(--subtext); margin-top:12px;">${t('no_matches')}</p>`;
    return;
  }

  container.innerHTML = filtered.map(i => {
    const stars = i.rating ? `<span style="color:#ffcc00; margin-left:6px;">${'★'.repeat(i.rating)}</span>` : '';
    const startStr = i.startDate ? new Date(i.startDate + 'T00:00:00').toLocaleDateString(currentLang, { month:'short', day:'numeric', year:'numeric' }) : '';
    const endStr = i.endDate ? new Date(i.endDate + 'T00:00:00').toLocaleDateString(currentLang, { month:'short', day:'numeric', year:'numeric' }) : 'Ongoing';
    const dateRange = startStr ? `${startStr} → ${endStr}` : '';
    const authorDisplay = i.author ? `<div style="font-size:12px; color:var(--subtext); font-style:italic;">By ${i.author}</div>` : '';

    return `
      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="toggleCollectionCardExpand(${i.id})">
          <span class="col-type-badge">${i.type}</span>
          <span style="font-size:11px; color:var(--subtext);">${dateRange}</span>
        </div>

        <div style="font-size:16px; font-weight:bold; margin-top:4px; cursor:pointer;" onclick="toggleCollectionCardExpand(${i.id})">
          ${i.title} ${stars}
        </div>
        ${authorDisplay}

        <div style="font-size:13px; margin-top:4px; color:var(--text);">${i.notes || ''}</div>
        <div>${(i.tags || []).map(tg => `<span class="tag">${tg}</span>`).join('')}</div>

        <div id="col-details-${i.id}" style="display:none; margin-top:10px; border-top:1px dashed var(--border); padding-top:8px;">
          ${i.coverUrl ? `<img src="${i.coverUrl}" class="col-cover-img" alt="Cover">` : ''}
          ${i.summary ? `<div style="font-size:12px; font-style:italic; margin-top:6px; color:var(--subtext);">${i.summary}</div>` : ''}
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
            <button class="btn-themed" style="width:auto; padding:4px 10px; font-size:12px;" onclick="editCollectionItem(${i.id})">✏️ Edit</button>
            <button class="btn-themed" style="width:auto; padding:4px 10px; font-size:12px; color:var(--danger);" onclick="deleteCollectionItem(${i.id})">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function exportCollectionsCSV() {
  const items = getCollectionItems();
  if (items.length === 0) return alert('No collections data to export.');

  let csv = "Type,Title,By,StartDate,EndDate,Rating,Tags,Notes,Summary\n";
  items.forEach(i => {
    const author = (i.author || '').replace(/"/g, '""');
    const tags = (i.tags || []).join(' ');
    const notes = (i.notes || '').replace(/"/g, '""');
    const summary = (i.summary || '').replace(/"/g, '""');
    csv += `"${i.type}","${i.title.replace(/"/g, '""')}","${author}","${i.startDate || ''}","${i.endDate || ''}","${i.rating || ''}","${tags}","${notes}","${summary}"\n`;
  });

  const fileName = `collections_export_${new Date().toISOString().slice(0,10)}.csv`;
  triggerShareOrDownload(csv, fileName);
}

function deleteCollectionsData() {
  if (confirm('FIRST WARNING: Are you sure you want to delete ALL Collections entries?')) {
    if (confirm('FINAL CONFIRMATION: Tap OK to clear all collections records.')) {
      localStorage.removeItem('my_pwa_collections');
      closeView('settingsView');
      renderCollectionList();
      alert('Collections data erased.');
    }
  }
}
