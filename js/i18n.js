/* Dedicated Translation Loader with Strict Fallback */
let currentLang = 'en';

function t(key) {
  const dict = window[`i18n_${currentLang}`] || window.i18n_en;
  return dict[key] || (window.i18n_en && window.i18n_en[key]) || key;
}

function detectUserLanguage() {
  const savedLang = localStorage.getItem('selected_lang');
  if (savedLang) return savedLang;
  const sysLang = (navigator.language || 'en').slice(0, 2);
  return ['es', 'ca'].includes(sysLang) ? sysLang : 'en';
}

function changeLanguage(lang) {
  currentLang = lang || 'en';
  localStorage.setItem('selected_lang', currentLang);
  applyTranslations();
  if (typeof renderLogs === 'function') renderLogs();
  if (typeof renderCollectionList === 'function') renderCollectionList();
}

function applyTranslations() {
  document.getElementById('langSelect').value = currentLang;

  const elementsMap = {
    'lbl-date': 'date',
    'lbl-rating': 'rating',
    'lbl-emoji': 'emoji',
    'lbl-details': 'details',
    'lbl-tags': 'tags',
    'lbl-settings-title': 'settings_title',
    'lbl-cal-title': 'cal_title',
    'lbl-stats-title': 'stats_title',
    'lbl-language': 'language',
    'lbl-theme': 'theme',
    'lbl-st-streak': 'streak',
    'lbl-st-total': 'totallogs',
    'lbl-st-avg': 'avgday',
    'lbl-st-peak': 'peakhour',
    'lbl-st-toptags': 'toptags',
    'lbl-st-charttitle': 'charttitle',
    'lbl-col-header': 'col_header',
    'lbl-col-type': 'col_type',
    'lbl-col-title-input': 'col_title_input',
    'lbl-col-by': 'col_by',
    'lbl-col-startdate': 'col_startdate',
    'lbl-col-enddate': 'col_enddate',
    'lbl-col-rating': 'col_rating',
    'lbl-col-tags': 'col_tags',
    'lbl-col-notes': 'col_notes',
    'lbl-col-stats-header': 'col_stats_header',
    'lbl-cst-total': 'cst_total',
    'lbl-cst-finished': 'cst_finished',
    'lbl-cst-avg': 'cst_avg',
    'lbl-cst-breakdown': 'cst_breakdown',
    'lbl-col-chart-title': 'col_chart_title',
    'lbl-top-rated-title': 'top_rated_title',
    'lbl-leg-main': 'leg_main',
    'lbl-leg-col': 'leg_col',
    'lbl-leg-both': 'leg_both',
    'lbl-opt-default': 'opt_default',
    'lbl-mgmt-main': 'mgmt_main',
    'btn-export-main': 'btn_export_main',
    'btn-delete-main': 'btn_delete_main',
    'lbl-mgmt-col': 'mgmt_col',
    'btn-export-col': 'btn_export_col',
    'btn-delete-col': 'btn_delete_col'
  };

  for (const [elId, tKey] of Object.entries(elementsMap)) {
    const el = document.getElementById(elId);
    if (el) el.innerText = t(tKey);
  }

  const noteInput = document.getElementById('note');
  if (noteInput) noteInput.placeholder = t('placeholder_note');

  const searchInput = document.getElementById('searchFilter');
  if (searchInput) searchInput.placeholder = t('placeholder_search');

  const colSearchInput = document.getElementById('colSearchFilter');
  if (colSearchInput) colSearchInput.placeholder = t('col_search');

  const isEditing = document.getElementById('editingId').value !== '';
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.innerText = isEditing ? t('update') : t('save');

  const isColEditing = document.getElementById('editingColId').value !== '';
  const saveColBtn = document.getElementById('saveColBtn');
  if (saveColBtn) saveColBtn.innerText = isColEditing ? t('col_update') : t('col_save');
}
