/* App Lifecycle, Scroll-to-Top, Theme & Launch Preferences */

function handleScroll(containerEl) {
  const btn = document.getElementById(`topBtn-${containerEl.id}`);
  if (btn) {
    if (containerEl.scrollTop > 150) btn.style.display = 'block';
    else btn.style.display = 'none';
  }
}

window.onscroll = function() {
  const btn = document.getElementById('topBtn-body');
  if (btn) {
    if (window.scrollY > 150) btn.style.display = 'block';
    else btn.style.display = 'none';
  }
};

function scrollToTop(viewId) {
  document.getElementById(viewId).scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToWindowTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleEntryForm() {
  const card = document.getElementById('entryCard');
  card.style.display = (card.style.display === 'none') ? 'block' : 'none';
  if (card.style.display === 'block') {
    updatePrefixTagSuggestions(document.getElementById('tags'), 'quickTagBar', appendQuickTag);
  }
}

function openView(viewId) {
  document.getElementById(viewId).style.display = 'block';
  if (viewId === 'calendarView') renderCalendar();
  if (viewId === 'statsView') renderStats();
  if (viewId === 'collectionsView') renderCollectionList();
}

function closeView(viewId) {
  document.getElementById(viewId).style.display = 'none';
}

function changeTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('selected_theme', themeName);
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem('selected_theme') || 'lavender';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('themeSelect').value = savedTheme;
}

function changeDefaultView(val) {
  localStorage.setItem('default_view', val);
}

function loadDefaultViewSetting() {
  const saved = localStorage.getItem('default_view') || 'main';
  document.getElementById('defaultViewSelect').value = saved;
  if (saved === 'main_form') toggleEntryForm();
  else if (saved === 'collections') openView('collectionsView');
  else if (saved === 'collections_form') {
    openView('collectionsView');
    toggleCollectionForm();
  }
}

function getNowForInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function getTodayDateForInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function setCurrentDatetime() {
  document.getElementById('customDatetime').value = getNowForInput();
  document.getElementById('colStartDate').value = getTodayDateForInput();
}

async function triggerShareOrDownload(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'text/csv' })] })) {
    try {
      const file = new File([blob], fileName, { type: 'text/csv' });
      await navigator.share({ title: 'Quick Tracker Export', files: [file] });
    } catch (err) {
      if (err.name !== 'AbortError') fallbackDownload(blob, fileName);
    }
  } else {
    fallbackDownload(blob, fileName);
  }
}

function fallbackDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
}

/* Initialize Application */
document.addEventListener('DOMContentLoaded', () => {
  currentLang = detectUserLanguage();
  applyTranslations();
  loadSavedTheme();
  setCurrentDatetime();
  populateCollectionTypeDropdown();
  loadDefaultViewSetting();
  renderLogs();
  updatePrefixTagSuggestions(document.getElementById('tags'), 'quickTagBar', appendQuickTag);
});
