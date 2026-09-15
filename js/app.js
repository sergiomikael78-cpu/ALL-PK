/**
 * PK MATRIX - Perfect Keyboard Template Manager Application
 * Logika Utama: LocalStorage CRUD, Pencarian Canggih, 1-Tap Copy, Haptic Feedback, Backup/Restore
 */

(function () {
  'use strict';

  // Dynamic Storage Keys (Terisolasi per Workspace / User ID)
  function getTemplateStorageKey() {
    return window.WorkspaceManager ? window.WorkspaceManager.getStorageKey('TEMPLATES') : 'PK_MASTER_TEMPLATES';
  }
  function getStatsStorageKey() {
    return window.WorkspaceManager ? window.WorkspaceManager.getStorageKey('STATS') : 'PK_MASTER_STATS';
  }
  function getPkFirebasePath() {
    return window.WorkspaceManager ? window.WorkspaceManager.getFirebasePath('pk_templates') : 'pk_templates';
  }
  function getKeepFirebasePath() {
    return window.WorkspaceManager ? window.WorkspaceManager.getFirebasePath('keep_notes') : 'keep_notes';
  }

  // Application State
  const state = {
    templates: [],
    filteredTemplates: [],
    activeCategory: 'all',
    activeTab: 'pk', // 'pk' | 'keep'
    searchQuery: '',
    searchMode: 'all', // 'all' | 'trigger' | 'content'
    sortBy: 'default',
    totalCopiedCount: 0,
    pageSize: 30,
    currentPage: 1,
    pendingDeleteId: null,
    activeVariableTemplate: null,
    pendingXmlTemplates: [],
    cloudSync: {
      isConfigured: false,
      isConnected: false,
      db: null,
      status: 'local'
    }
  };

  // DOM Elements Cache
  const elements = {
    // Top Tabs Navigation
    tabBtnPk: document.getElementById('tab-btn-pk'),
    tabBtnKeep: document.getElementById('tab-btn-keep'),
    tabPkCount: document.getElementById('tab-pk-count'),
    tabKeepCount: document.getElementById('tab-keep-count'),
    pkHeaderControls: document.getElementById('pk-header-controls'),
    keepHeaderControls: document.getElementById('keep-header-controls'),
    viewPk: document.getElementById('view-pk'),
    viewKeep: document.getElementById('view-keep'),

    // User Profile Pill & XML Button
    btnUserProfile: document.getElementById('btn-user-profile'),
    headerUserName: document.getElementById('header-user-name'),
    btnOpenXml: document.getElementById('btn-open-xml'),

    // Header & Stats
    headerTotalCount: document.getElementById('header-total-count'),
    btnSettings: document.getElementById('btn-settings'),
    btnAddHeader: document.getElementById('btn-add-header'),
    syncIndicator: document.getElementById('sync-indicator'),
    syncStatusText: document.getElementById('sync-status-text'),

    // Search
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    searchModeContainer: document.getElementById('search-mode-container'),
    searchModePills: document.querySelectorAll('.search-mode-pill'),

    // Categories
    categoriesContainer: document.getElementById('categories-container'),
    countAll: document.getElementById('count-all'),
    countPinned: document.getElementById('count-pinned'),

    // Filter & Sort Bar
    resultsCountText: document.getElementById('results-count-text'),
    sortSelect: document.getElementById('sort-select'),

    // Main List
    mainContent: document.getElementById('main-content'),
    templatesGrid: document.getElementById('templates-grid'),
    emptyState: document.getElementById('empty-state'),
    btnResetFilters: document.getElementById('btn-reset-filters'),
    loadMoreContainer: document.getElementById('load-more-container'),
    btnLoadMore: document.getElementById('btn-load-more'),

    // FAB
    btnFabAdd: document.getElementById('btn-fab-add'),
    btnScrollTop: document.getElementById('btn-scroll-top'),

    // Template Modal (Add / Edit)
    modalTemplate: document.getElementById('modal-template'),
    formTemplate: document.getElementById('form-template'),
    modalTitle: document.getElementById('modal-title'),
    modalModeTag: document.getElementById('modal-mode-tag'),
    editTemplateId: document.getElementById('edit-template-id'),
    inputTrigger: document.getElementById('input-trigger'),
    selectCategory: document.getElementById('select-category'),
    inputContent: document.getElementById('input-content'),
    formCharCount: document.getElementById('form-char-count'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCancelModal: document.getElementById('btn-cancel-modal'),

    // Variable Replacer Modal
    modalVariable: document.getElementById('modal-variable'),
    varInputValue: document.getElementById('var-input-value'),
    varPreviewBox: document.getElementById('var-preview-box'),
    btnCloseVariable: document.getElementById('btn-close-variable'),
    btnCancelVariable: document.getElementById('btn-cancel-variable'),
    btnCopyVariable: document.getElementById('btn-copy-variable'),

    // Settings / Storage Modal
    modalSettings: document.getElementById('modal-settings'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    btnExportJson: document.getElementById('btn-export-json'),
    fileImportJson: document.getElementById('file-import-json'),
    btnResetOriginal: document.getElementById('btn-reset-original'),
    statTotal: document.getElementById('stat-total'),
    statCopied: document.getElementById('stat-copied'),
    statPinned: document.getElementById('stat-pinned'),

    // Cloud Sync Elements
    cloudBadgeStatus: document.getElementById('cloud-badge-status'),
    inputFirebaseUrl: document.getElementById('input-firebase-url'),
    inputFirebaseApiKey: document.getElementById('input-firebase-apikey'),
    btnSaveCloud: document.getElementById('btn-save-cloud'),
    btnSyncNow: document.getElementById('btn-sync-now'),
    btnDisconnectCloud: document.getElementById('btn-disconnect-cloud'),

    // Cloud Security & Sensor Elements
    cloudConfigLockedView: document.getElementById('cloud-config-locked-view'),
    cloudConfigUnlockedView: document.getElementById('cloud-config-unlocked-view'),
    btnShowUnlockCloud: document.getElementById('btn-show-unlock-cloud'),
    cloudUnlockPromptPanel: document.getElementById('cloud-unlock-prompt-panel'),
    inputUnlockCloudPassword: document.getElementById('input-unlock-cloud-password'),
    btnVerifyUnlockCloud: document.getElementById('btn-verify-unlock-cloud'),
    btnCancelUnlockCloud: document.getElementById('btn-cancel-unlock-cloud'),
    cloudUnlockErrMsg: document.getElementById('cloud-unlock-err-msg'),
    btnRelockCloud: document.getElementById('btn-relock-cloud'),
    btnSyncNowLocked: document.getElementById('btn-sync-now-locked'),

    // Delete Modal
    modalDelete: document.getElementById('modal-delete'),
    deletePreviewTrigger: document.getElementById('delete-preview-trigger'),
    deletePreviewContent: document.getElementById('delete-preview-content'),
    btnCloseDelete: document.getElementById('btn-close-delete'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),

    // User Auth Modal Elements
    modalAuth: document.getElementById('modal-auth'),
    btnCloseAuth: document.getElementById('btn-close-auth'),
    btnCancelAuth: document.getElementById('btn-cancel-auth'),
    authActiveView: document.getElementById('auth-active-view'),
    authDisplayUsername: document.getElementById('auth-display-username'),
    authCloudPath: document.getElementById('auth-cloud-path'),
    btnLogoutUser: document.getElementById('btn-logout-user'),
    btnCloseAuthActive: document.getElementById('btn-close-auth-active'),
    formAuthLogin: document.getElementById('form-auth-login'),
    authInputUserid: document.getElementById('auth-input-userid'),
    authInputPassword: document.getElementById('auth-input-password'),
    authRecentUsersBox: document.getElementById('auth-recent-users-box'),
    authRecentUsersList: document.getElementById('auth-recent-users-list'),

    // XML Modal Elements
    modalXml: document.getElementById('modal-xml'),
    btnCloseXml: document.getElementById('btn-close-xml'),
    xmlTabImport: document.getElementById('xml-tab-import'),
    xmlTabExport: document.getElementById('xml-tab-export'),
    xmlViewImport: document.getElementById('xml-view-import'),
    xmlViewExport: document.getElementById('xml-view-export'),
    btnMethodFile: document.getElementById('btn-method-file'),
    btnMethodPaste: document.getElementById('btn-method-paste'),
    xmlFileContainer: document.getElementById('xml-file-container'),
    xmlPasteContainer: document.getElementById('xml-paste-container'),
    xmlDropzone: document.getElementById('xml-dropzone'),
    xmlFileInput: document.getElementById('xml-file-input'),
    xmlSelectedFileName: document.getElementById('xml-selected-file-name'),
    xmlPasteTextarea: document.getElementById('xml-paste-textarea'),
    btnPasteClipboard: document.getElementById('btn-paste-clipboard'),
    btnParsePaste: document.getElementById('btn-parse-paste'),
    xmlPreviewCard: document.getElementById('xml-preview-card'),
    xmlPreviewCount: document.getElementById('xml-preview-count'),
    xmlTargetUser: document.getElementById('xml-target-user'),
    xmlPreviewCategories: document.getElementById('xml-preview-categories'),
    xmlPreviewSampleList: document.getElementById('xml-preview-sample-list'),
    btnXmlMerge: document.getElementById('btn-xml-merge'),
    btnXmlReplace: document.getElementById('btn-xml-replace'),
    xmlExportUser: document.getElementById('xml-export-user'),
    xmlExportCount: document.getElementById('xml-export-count'),
    btnDownloadXml: document.getElementById('btn-download-xml'),

    // Toast
    toast: document.getElementById('toast'),
    toastTitle: document.getElementById('toast-title'),
    toastSubtitle: document.getElementById('toast-subtitle')
  };

  // Toast Timer
  let toastTimeout = null;

  // =========================================================================
  // Initial Data Loading & Persistence (Isolated per Workspace)
  // =========================================================================
  function initData() {
    try {
      const stored = localStorage.getItem(getTemplateStorageKey());
      if (stored) {
        state.templates = JSON.parse(stored);
        // Auto-sanitize jika ada template yang tersimpan dengan artefak raw HTML/macro
        let needResave = false;
        state.templates.forEach(t => {
          if (t.content && (/^text#macro:/i.test(t.content) || /<html[\s\S]*?>/i.test(t.content))) {
            if (window.XmlEngine && typeof window.XmlEngine.cleanMacroContent === 'function') {
              t.content = window.XmlEngine.cleanMacroContent(t.content, t.trigger);
              t.charCount = t.content.length;
              needResave = true;
            }
          }
        });
        if (needResave) {
          saveTemplates(false);
        }
      } else if (window.DEFAULT_TEMPLATES && Array.isArray(window.DEFAULT_TEMPLATES)) {
        state.templates = [...window.DEFAULT_TEMPLATES];
        saveTemplates(false);
      } else {
        state.templates = [];
      }

      const storedStats = localStorage.getItem(getStatsStorageKey());
      if (storedStats) {
        const stats = JSON.parse(storedStats);
        state.totalCopiedCount = stats.totalCopiedCount || 0;
      } else {
        state.totalCopiedCount = 0;
      }
    } catch (e) {
      console.error('Gagal memuat data dari localStorage:', e);
      state.templates = [];
    }

    updateCategoryCounts();
    applyFilters();
  }

  function saveTemplates(pushToCloud = true) {
    try {
      localStorage.setItem(getTemplateStorageKey(), JSON.stringify(state.templates));
      updateCategoryCounts();
      if (pushToCloud) {
        syncChangeToCloud();
      }
    } catch (e) {
      console.error('Gagal menyimpan ke localStorage:', e);
      showToast('Gagal menyimpan data!', 'Kapasitas penyimpanan browser penuh.', 'error');
    }
  }

  function saveStats() {
    try {
      localStorage.setItem(getStatsStorageKey(), JSON.stringify({
        totalCopiedCount: state.totalCopiedCount
      }));
    } catch (e) {
      console.error('Gagal menyimpan stats:', e);
    }
  }

  // =========================================================================
  // Cloud Realtime Sync (Firebase)
  // =========================================================================
  function setSyncStatus(status, label) {
    state.cloudSync.status = status;
    const dot = elements.syncIndicator ? elements.syncIndicator.querySelector('.sync-dot') : null;
    if (dot) {
      dot.className = 'sync-dot';
      if (status === 'online') dot.classList.add('dot-online');
      else if (status === 'syncing') dot.classList.add('dot-syncing');
      else dot.classList.add('dot-local');
    }

    if (elements.syncStatusText) {
      elements.syncStatusText.textContent = label || (status === 'online' ? 'Cloud' : 'Lokal');
    }

    if (elements.cloudBadgeStatus) {
      elements.cloudBadgeStatus.className = 'badge-status-pill';
      if (status === 'online') {
        elements.cloudBadgeStatus.classList.add('pill-online');
        elements.cloudBadgeStatus.textContent = 'Cloud Terhubung (Realtime)';
      } else if (status === 'syncing') {
        elements.cloudBadgeStatus.classList.add('pill-syncing');
        elements.cloudBadgeStatus.textContent = 'Menyinkronkan...';
      } else {
        elements.cloudBadgeStatus.classList.add('pill-offline');
        elements.cloudBadgeStatus.textContent = 'Lokal (Offline)';
      }
    }
  }

  let dbRefListener = null;
  let dbKeepRefListener = null;

  function initCloudSync() {
    const config = window.getFirebaseConfig ? window.getFirebaseConfig() : null;
    if (!config || !config.databaseURL) {
      setSyncStatus('local', 'Lokal');
      if (elements.btnSyncNow) elements.btnSyncNow.style.display = 'none';
      if (elements.btnSyncNowLocked) elements.btnSyncNowLocked.style.display = 'none';
      if (elements.btnDisconnectCloud) elements.btnDisconnectCloud.style.display = 'none';
      return;
    }

    // Populate inputs if present
    if (elements.inputFirebaseUrl) elements.inputFirebaseUrl.value = config.databaseURL || '';
    if (elements.inputFirebaseApiKey && config.apiKey) elements.inputFirebaseApiKey.value = config.apiKey || '';

    try {
      if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK belum termuat atau diblokir.');
        setSyncStatus('local', 'SDK Offline');
        return;
      }

      setSyncStatus('syncing', 'Menghubungkan...');

      // Re-init or get app
      let app;
      if (!firebase.apps.length) {
        app = firebase.initializeApp({
          apiKey: config.apiKey || 'pk-matrix-key',
          databaseURL: config.databaseURL,
          projectId: config.projectId || 'pk-matrix'
        });
      } else {
        app = firebase.app();
      }

      const db = firebase.database(app);
      state.cloudSync.db = db;
      state.cloudSync.isConfigured = true;

      if (elements.btnSyncNow) elements.btnSyncNow.style.display = 'inline-flex';
      if (elements.btnSyncNowLocked) elements.btnSyncNowLocked.style.display = 'inline-flex';
      if (elements.btnDisconnectCloud) elements.btnDisconnectCloud.style.display = 'inline-flex';

      // Detach previous listeners if exist
      if (dbRefListener && state.cloudSync.attachedPkPath) {
        db.ref(state.cloudSync.attachedPkPath).off('value', dbRefListener);
      }
      if (dbKeepRefListener && state.cloudSync.attachedKeepPath) {
        db.ref(state.cloudSync.attachedKeepPath).off('value', dbKeepRefListener);
      }

      // Attach Realtime Listener for PK Templates (Isolated Workspace)
      const pkPath = getPkFirebasePath();
      state.cloudSync.attachedPkPath = pkPath;
      const tplRef = db.ref(pkPath);

      dbRefListener = (snapshot) => {
        const val = snapshot.val();
        if (val && Array.isArray(val) && val.length > 0) {
          state.templates = val;
          saveTemplates(false); // local only, don't echo back
          applyFilters();
          setSyncStatus('online', 'Cloud Aktif');
        } else if (val && Array.isArray(val) && val.length === 0) {
          state.templates = [];
          saveTemplates(false);
          applyFilters();
          setSyncStatus('online', 'Cloud Aktif (0 Template)');
        } else if (!val) {
          if (state.templates.length > 0) {
            seedCloudData();
          } else {
            setSyncStatus('online', 'Cloud Aktif (0 Template)');
          }
        }
      };

      tplRef.on('value', dbRefListener, (err) => {
        console.error('Firebase Realtime Database Error:', err);
        setSyncStatus('local', 'Koneksi Error');
        showToast('Koneksi Cloud Terputus', 'Periksa izin Rules di Firebase Console', 'error');
      });

      // Attach Realtime Listener for KEEP Notes (Isolated Workspace)
      const keepPath = getKeepFirebasePath();
      state.cloudSync.attachedKeepPath = keepPath;
      const keepRef = db.ref(keepPath);

      dbKeepRefListener = (snapshot) => {
        const val = snapshot.val();
        if (val && Array.isArray(val) && val.length > 0) {
          if (window.KeepManager && typeof window.KeepManager.setNotes === 'function') {
            window.KeepManager.setNotes(val, false);
          }
        } else if (!val) {
          const initialKeep = (window.DEFAULT_KEEP_NOTES && Array.isArray(window.DEFAULT_KEEP_NOTES)) ? window.DEFAULT_KEEP_NOTES : [];
          if (initialKeep.length > 0) {
            db.ref(keepPath).set(initialKeep);
          }
        }
      };
      keepRef.on('value', dbKeepRefListener);

      // Expose to window.FirebaseSync so KeepManager can push updates to cloud
      window.FirebaseSync = {
        syncKeepNotes: (notes) => {
          if (state.cloudSync.db) {
            state.cloudSync.db.ref(getKeepFirebasePath()).set(notes);
          }
        }
      };

    } catch (err) {
      console.error('Inisialisasi Firebase Cloud Sync gagal:', err);
      setSyncStatus('local', 'Lokal');
    }
  }

  function seedCloudData() {
    if (!state.cloudSync.db) return;
    const dataToSeed = state.templates.length > 0 ? state.templates : (window.DEFAULT_TEMPLATES || []);
    if (dataToSeed.length === 0) return;
    setSyncStatus('syncing', 'Mengunggah Data...');
    state.cloudSync.db.ref(getPkFirebasePath()).set(dataToSeed)
      .then(() => {
        setSyncStatus('online', 'Cloud Aktif');
        showToast('Cloud Berhasil Diinisialisasi! ✓', `${dataToSeed.length} template diunggah.`);
      })
      .catch((err) => {
        console.error('Gagal upload ke cloud:', err);
        setSyncStatus('local', 'Gagal Upload');
      });
  }

  function syncChangeToCloud() {
    if (!state.cloudSync.db) return;
    setSyncStatus('syncing', 'Menyimpan...');
    state.cloudSync.db.ref(getPkFirebasePath()).set(state.templates)
      .then(() => {
        setSyncStatus('online', 'Cloud Aktif');
      })
      .catch(err => {
        console.error('Gagal sync ke cloud:', err);
        setSyncStatus('local', 'Gagal Sync');
      });
  }

  // =========================================================================
  // Filter & Search Logic
  // =========================================================================
  function updateCategoryCounts() {
    const total = state.templates.length;
    let pinned = 0;

    state.templates.forEach(t => {
      if (t.isPinned) pinned++;
    });

    if (elements.headerTotalCount) elements.headerTotalCount.textContent = total;
    if (elements.tabPkCount) elements.tabPkCount.textContent = total;
    if (elements.countAll) elements.countAll.textContent = total;
    if (elements.countPinned) elements.countPinned.textContent = pinned;

    // Also update settings stats
    if (elements.statTotal) elements.statTotal.textContent = total;
    if (elements.statCopied) elements.statCopied.textContent = state.totalCopiedCount;
    if (elements.statPinned) elements.statPinned.textContent = pinned;
  }

  function setSearchMode(mode) {
    state.searchMode = mode;

    // Update active class on search mode pills
    if (elements.searchModePills) {
      elements.searchModePills.forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-mode') === mode);
      });
    }

    // Update placeholder & input styling
    if (elements.searchInput) {
      elements.searchInput.classList.remove('mode-trigger', 'mode-content');
      if (mode === 'trigger') {
        elements.searchInput.placeholder = '🎯 Cari kata trigger (contoh: limit/, baca/, Num 0)...';
        elements.searchInput.classList.add('mode-trigger');
      } else if (mode === 'content') {
        elements.searchInput.placeholder = '📝 Cari di dalam isi kalimat pesan CS...';
        elements.searchInput.classList.add('mode-content');
      } else {
        elements.searchInput.placeholder = 'Cari trigger (contoh: kode/, 2id/) atau kata...';
      }
      elements.searchInput.focus();
    }

    applyFilters();
  }

  function applyFilters() {
    const query = state.searchQuery.trim().toLowerCase();
    const cat = state.activeCategory;

    let result = state.templates.filter(item => {
      // Category filter
      if (cat === 'pinned' && !item.isPinned) return false;
      if (cat !== 'all' && cat !== 'pinned' && item.category !== cat) return false;

      // Search filter with Mode Support
      if (query) {
        if (state.searchMode === 'trigger') {
          // KHUSUS TRIGGER: Hanya cocokkan trigger / shortcut / hotkey
          const triggerMatch = (item.trigger || '').toLowerCase().includes(query);
          const nameMatch = (item.name || '').toLowerCase().includes(query);
          return triggerMatch || nameMatch;
        } else if (state.searchMode === 'content') {
          // KHUSUS ISI: Hanya cocokkan isi kalimat
          return (item.content || '').toLowerCase().includes(query);
        } else {
          // Mode Semua (Trigger, Isi Kalimat, Nama)
          const triggerMatch = (item.trigger || '').toLowerCase().includes(query);
          const contentMatch = (item.content || '').toLowerCase().includes(query);
          const nameMatch = (item.name || '').toLowerCase().includes(query);
          return triggerMatch || contentMatch || nameMatch;
        }
      }

      return true;
    });

    // Sorting
    result = sortTemplates(result, state.sortBy);

    state.filteredTemplates = result;
    state.currentPage = 1;

    renderTemplates();
  }

  function sortTemplates(list, sortType) {
    const arr = [...list];

    // Always sort pinned to top unless sorting by specific metric
    switch (sortType) {
      case 'trigger-asc':
        arr.sort((a, b) => (a.trigger || '').localeCompare(b.trigger || ''));
        break;
      case 'trigger-desc':
        arr.sort((a, b) => (b.trigger || '').localeCompare(a.trigger || ''));
        break;
      case 'most-copied':
        arr.sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0));
        break;
      case 'char-asc':
        arr.sort((a, b) => (a.content || '').length - (b.content || '').length);
        break;
      case 'char-desc':
        arr.sort((a, b) => (b.content || '').length - (a.content || '').length);
        break;
      case 'default':
      default:
        // Default file order, but with pinned items first!
        arr.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return (a.order || 0) - (b.order || 0);
        });
        break;
    }

    return arr;
  }

  // =========================================================================
  // Rendering
  // =========================================================================
  function renderTemplates() {
    const totalFiltered = state.filteredTemplates.length;
    const totalAll = state.templates.length;

    // Update Result Text
    if (state.searchQuery || state.activeCategory !== 'all') {
      elements.resultsCountText.textContent = `Menampilkan ${totalFiltered} dari ${totalAll} template`;
    } else {
      elements.resultsCountText.textContent = `Menampilkan ${totalFiltered} template`;
    }

    // Handle Empty State
    if (totalFiltered === 0) {
      elements.templatesGrid.innerHTML = '';
      elements.emptyState.style.display = 'block';
      elements.loadMoreContainer.style.display = 'none';
      return;
    } else {
      elements.emptyState.style.display = 'none';
    }

    // Progressive rendering pagination
    const itemsToShow = state.currentPage * state.pageSize;
    const visibleTemplates = state.filteredTemplates.slice(0, itemsToShow);

    // Build cards HTML
    const cardsHtml = visibleTemplates.map(item => createCardHtml(item)).join('');
    elements.templatesGrid.innerHTML = cardsHtml;

    // Show or hide Load More button
    if (itemsToShow < totalFiltered) {
      elements.loadMoreContainer.style.display = 'block';
      elements.btnLoadMore.querySelector('span').textContent = `Muat Lebih Banyak (${totalFiltered - itemsToShow} lagi)...`;
    } else {
      elements.loadMoreContainer.style.display = 'none';
    }
  }

  function createCardHtml(item) {
    const isHotkey = item.triggerType === 'hotkey';
    const isNone = item.triggerType === 'none' || !item.trigger || item.trigger === '-';
    
    let triggerClass = 'trigger-badge';
    if (isHotkey) triggerClass += ' hotkey-badge';
    else if (isNone) triggerClass += ' no-trigger';

    let catClass = 'cat-badge ';
    if (item.category === 'Khusus Event') catClass += 'cat-event';
    else if (item.category === 'PK Anti Audit') catClass += 'cat-audit';
    else if (item.category === 'PK Pendamping') catClass += 'cat-pendamping';
    else if (item.category === 'Pihak Ke-3') catClass += 'cat-pihak3';
    else catClass += 'cat-custom';

    // Highlight search match in text if query exists based on searchMode
    let displayContent = escapeHtml(item.content);
    let displayTrigger = escapeHtml(item.trigger);

    if (state.searchQuery.trim()) {
      const q = escapeRegExp(state.searchQuery.trim());
      const regex = new RegExp(`(${q})`, 'gi');

      if (state.searchMode === 'trigger') {
        // Hanya highlight trigger jika mode Khusus Trigger
        displayTrigger = displayTrigger.replace(regex, '<mark>$1</mark>');
      } else if (state.searchMode === 'content') {
        // Hanya highlight isi kalimat jika mode Khusus Isi
        displayContent = displayContent.replace(regex, '<mark>$1</mark>');
      } else {
        // Mode Semua: highlight keduanya
        displayContent = displayContent.replace(regex, '<mark>$1</mark>');
        displayTrigger = displayTrigger.replace(regex, '<mark>$1</mark>');
      }
    }

    // Check if template contains placeholder 'xxx' or 'XXX'
    const hasVariable = /\bxxx\b/i.test(item.content);

    return `
      <article class="template-card ${item.isPinned ? 'is-pinned' : ''}" data-id="${item.id}">
        <div class="card-header">
          <div class="trigger-group">
            <span class="${triggerClass}">${displayTrigger}</span>
            <span class="${catClass}">${escapeHtml(item.category)}</span>
          </div>
          <div class="card-header-controls">
            <button class="btn-pin ${item.isPinned ? 'pinned' : ''}" data-action="pin" data-id="${item.id}" title="${item.isPinned ? 'Lepas Favorit' : 'Jadikan Favorit'}">
              ${item.isPinned ? '★' : '☆'}
            </button>
          </div>
        </div>

        <div class="card-body" data-action="copy-card" data-id="${item.id}">
          <div class="sentence-text">${displayContent}</div>
        </div>

        <div class="card-smart-tools">
          ${hasVariable ? `
            <button class="btn-var-pill" data-action="open-variable" data-id="${item.id}" title="Ganti placeholder xxx secara instan">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              <span>Isi Variabel 'xxx'</span>
            </button>
          ` : ''}
          ${item.copyCount > 0 ? `
            <span class="copy-counter-tag">Disalin ${item.copyCount}x</span>
          ` : ''}
        </div>

        <div class="card-actions">
          <button class="btn-copy" data-action="copy" data-id="${item.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span class="btn-copy-label">SALIN</span>
          </button>

          <button class="btn-action-icon btn-action-edit" data-action="edit" data-id="${item.id}" title="Edit Template">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>

          <button class="btn-action-icon btn-action-delete" data-action="delete" data-id="${item.id}" title="Hapus Template">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </article>
    `;
  }

  // =========================================================================
  // Clipboard & Copy Action with Haptic
  // =========================================================================
  async function copyToClipboard(text, triggerName, cardElement, btnElement) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older Android or insecure context
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      // Android Haptic Vibration Feedback
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([35]);
        } catch (e) {
          // Ignore if vibration is denied by permission
        }
      }

      // Visual feedback on card & button
      if (cardElement) {
        cardElement.classList.add('copy-flash');
        setTimeout(() => cardElement.classList.remove('copy-flash'), 600);
      }

      if (btnElement) {
        btnElement.classList.add('copied-active');
        const label = btnElement.querySelector('.btn-copy-label');
        if (label) label.textContent = 'TER-SALIN! ✓';
        setTimeout(() => {
          btnElement.classList.remove('copied-active');
          if (label) label.textContent = 'SALIN';
        }, 1500);
      }

      showToast('Tersalin ke Clipboard! ✓', `Trigger: ${triggerName || 'Template'}`);
    } catch (err) {
      console.error('Gagal menyalin:', err);
      showToast('Gagal Menyalin!', 'Izinkan akses clipboard di browser Anda', 'error');
    }
  }

  function handleCopyAction(templateId, btnElement) {
    const item = state.templates.find(t => t.id === templateId);
    if (!item) return;

    const card = document.querySelector(`.template-card[data-id="${templateId}"]`);
    const targetBtn = btnElement || (card ? card.querySelector('.btn-copy') : null);

    copyToClipboard(item.content, item.trigger, card, targetBtn);

    // Update copy count
    item.copyCount = (item.copyCount || 0) + 1;
    state.totalCopiedCount++;
    saveStats();
    saveTemplates();

    // Update copy counter tag in card if visible
    if (card) {
      const counterTag = card.querySelector('.copy-counter-tag');
      if (counterTag) {
        counterTag.textContent = `Disalin ${item.copyCount}x`;
      }
    }
  }

  // =========================================================================
  // Toast System
  // =========================================================================
  function showToast(title, subtitle, type = 'success') {
    if (toastTimeout) clearTimeout(toastTimeout);

    elements.toastTitle.textContent = title;
    elements.toastSubtitle.textContent = subtitle;

    if (type === 'error') {
      elements.toast.style.borderColor = 'var(--cyber-rose)';
      elements.toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.8), 0 0 20px rgba(244,63,94,0.3)';
    } else {
      elements.toast.style.borderColor = 'var(--cyber-emerald)';
      elements.toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.8), var(--shadow-glow-emerald)';
    }

    elements.toast.style.display = 'flex';

    toastTimeout = setTimeout(() => {
      elements.toast.style.display = 'none';
    }, 2200);
  }

  // =========================================================================
  // Variable Replacer Tool
  // =========================================================================
  function openVariableModal(templateId) {
    const item = state.templates.find(t => t.id === templateId);
    if (!item) return;

    state.activeVariableTemplate = item;
    elements.varInputValue.value = '';
    updateVariablePreview();

    elements.modalVariable.style.display = 'flex';
    setTimeout(() => elements.varInputValue.focus(), 200);
  }

  function updateVariablePreview() {
    if (!state.activeVariableTemplate) return;

    const val = elements.varInputValue.value.trim() || 'xxx';
    const original = state.activeVariableTemplate.content;

    // Replace xxx or XXX with value
    const replaced = original.replace(/\bxxx\b/gi, val);
    
    // Highlight the replaced value
    const highlighted = escapeHtml(replaced).replace(
      new RegExp(escapeRegExp(val), 'gi'),
      '<mark>$&</mark>'
    );

    elements.varPreviewBox.innerHTML = highlighted;
  }

  function copyVariableResult() {
    if (!state.activeVariableTemplate) return;

    const val = elements.varInputValue.value.trim() || 'xxx';
    const original = state.activeVariableTemplate.content;
    const finalContent = original.replace(/\bxxx\b/gi, val);

    copyToClipboard(finalContent, state.activeVariableTemplate.trigger, null, null);
    elements.modalVariable.style.display = 'none';
  }

  // =========================================================================
  // CRUD: Add, Edit, Delete, Pin
  // =========================================================================
  function openAddModal() {
    elements.formTemplate.reset();
    elements.editTemplateId.value = '';
    elements.modalTitle.textContent = 'Tambah Template Baru';
    elements.modalModeTag.textContent = 'TAMBAH DATA';
    elements.formCharCount.textContent = '0 karakter';
    
    if (state.activeCategory !== 'all' && state.activeCategory !== 'pinned') {
      elements.selectCategory.value = state.activeCategory;
    }

    elements.modalTemplate.style.display = 'flex';
    setTimeout(() => elements.inputTrigger.focus(), 200);
  }

  function openEditModal(templateId) {
    const item = state.templates.find(t => t.id === templateId);
    if (!item) return;

    elements.editTemplateId.value = item.id;
    elements.inputTrigger.value = item.trigger;
    elements.selectCategory.value = item.category || 'Custom';
    elements.inputContent.value = item.content;
    elements.formCharCount.textContent = `${item.content.length} karakter`;

    elements.modalTitle.textContent = 'Edit Template';
    elements.modalModeTag.textContent = 'EDIT DATA';

    elements.modalTemplate.style.display = 'flex';
    setTimeout(() => elements.inputTrigger.focus(), 200);
  }

  function handleSaveTemplate(e) {
    e.preventDefault();

    const id = elements.editTemplateId.value;
    const trigger = elements.inputTrigger.value.trim();
    const category = elements.selectCategory.value;
    const content = elements.inputContent.value.trim();

    if (!trigger || !content) {
      alert('Harap isi Trigger dan Kalimat template!');
      return;
    }

    if (id) {
      // Edit mode
      const index = state.templates.findIndex(t => t.id === id);
      if (index !== -1) {
        state.templates[index] = {
          ...state.templates[index],
          trigger,
          triggerType: trigger.startsWith('Hotkey:') ? 'hotkey' : 'shortcut',
          category,
          content,
          charCount: content.length,
          updatedAt: new Date().toISOString()
        };
        showToast('Perubahan Disimpan! ✓', `Trigger: ${trigger}`);
      }
    } else {
      // Add mode
      const newId = `custom_${Date.now()}`;
      const newTemplate = {
        id: newId,
        order: 0,
        uid: newId,
        category,
        categoryCode: 'custom',
        file: 'custom',
        trigger,
        triggerType: 'shortcut',
        name: '',
        content,
        charCount: content.length,
        isPinned: false,
        copyCount: 0,
        createdAt: new Date().toISOString()
      };
      // Prepend to list
      state.templates.unshift(newTemplate);
      showToast('Template Baru Ditambahkan! ✓', `Trigger: ${trigger}`);
    }

    saveTemplates();
    applyFilters();
    elements.modalTemplate.style.display = 'none';

    // Scroll to the card
    if (!id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function togglePin(templateId) {
    const item = state.templates.find(t => t.id === templateId);
    if (!item) return;

    item.isPinned = !item.isPinned;
    saveTemplates();
    applyFilters();

    if (item.isPinned) {
      showToast('Disematkan ke Favorit ⭐', `Trigger: ${item.trigger}`);
    }
  }

  function openDeleteModal(templateId) {
    const item = state.templates.find(t => t.id === templateId);
    if (!item) return;

    state.pendingDeleteId = templateId;
    elements.deletePreviewTrigger.textContent = item.trigger;
    elements.deletePreviewContent.textContent = item.content;

    elements.modalDelete.style.display = 'flex';
  }

  function confirmDelete() {
    if (!state.pendingDeleteId) return;

    const id = state.pendingDeleteId;
    const index = state.templates.findIndex(t => t.id === id);
    if (index !== -1) {
      const deletedTrigger = state.templates[index].trigger;
      state.templates.splice(index, 1);
      saveTemplates();
      applyFilters();
      showToast('Template Dihapus', `Trigger: ${deletedTrigger}`, 'error');
    }

    state.pendingDeleteId = null;
    elements.modalDelete.style.display = 'none';
  }

  // =========================================================================
  // Settings, Export & Import
  // =========================================================================
  function exportBackup() {
    const keepNotes = (window.KeepManager && typeof window.KeepManager.getNotes === 'function') ? window.KeepManager.getNotes() : [];
    const payload = {
      version: 2,
      exportDate: new Date().toISOString(),
      pk_templates: state.templates,
      keep_notes: keepNotes
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const now = new Date().toISOString().slice(0, 10);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PK_Matrix_Keep_Backup_${now}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Backup Diunduh! ✓', `${state.templates.length} template & ${keepNotes.length} catatan KEEP tersimpan.`);
  }

  function importBackup(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const importedData = JSON.parse(e.target.result);
        let pkCount = 0;
        let keepCount = 0;

        if (Array.isArray(importedData)) {
          // Legacy format (array of templates)
          state.templates = importedData;
          saveTemplates();
          applyFilters();
          pkCount = importedData.length;
        } else if (importedData && typeof importedData === 'object') {
          // Version 2 format (object with pk_templates and keep_notes)
          if (Array.isArray(importedData.pk_templates)) {
            state.templates = importedData.pk_templates;
            saveTemplates();
            applyFilters();
            pkCount = importedData.pk_templates.length;
          }
          if (Array.isArray(importedData.keep_notes) && window.KeepManager) {
            window.KeepManager.setNotes(importedData.keep_notes, true);
            keepCount = importedData.keep_notes.length;
          }
        } else {
          alert('Format file JSON cadangan tidak dikenali!');
          return;
        }

        elements.modalSettings.style.display = 'none';
        showToast('Data Berhasil Dipulihkan! ✓', `${pkCount} template PK & ${keepCount} catatan KEEP dimuat.`);
      } catch (err) {
        alert('Gagal membaca file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  function resetToOriginal() {
    const confirmReset = confirm('PERINGATAN: Seluruh akun profil, template PK, dan catatan KEEP di localhost akan dihapus dan dikosongkan total (100% bersih). Lanjutkan?');
    if (!confirmReset) return;

    if (window.WorkspaceManager && typeof window.WorkspaceManager.clearAllLocalData === 'function') {
      window.WorkspaceManager.clearAllLocalData();
    }
    try {
      localStorage.clear();
    } catch (e) {}

    state.templates = [];
    state.filteredTemplates = [];
    applyFilters();

    if (window.KeepManager && typeof window.KeepManager.setNotes === 'function') {
      window.KeepManager.setNotes([], false);
    }

    elements.modalSettings.style.display = 'none';
    showToast('Localhost Bersih 100%! ✓', 'Semua data akun dan template telah dikosongkan.');

    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  // =========================================================================
  // Helper Utilities
  // =========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // =========================================================================
  // Tab Switching (PK Matrix vs KEEP Vault)
  // =========================================================================
  function switchTab(tabName) {
    state.activeTab = tabName;

    if (tabName === 'pk') {
      if (elements.tabBtnPk) elements.tabBtnPk.classList.add('active');
      if (elements.tabBtnKeep) elements.tabBtnKeep.classList.remove('active');
      if (elements.pkHeaderControls) elements.pkHeaderControls.style.display = 'block';
      if (elements.keepHeaderControls) elements.keepHeaderControls.style.display = 'none';
      if (elements.viewPk) elements.viewPk.style.display = 'block';
      if (elements.viewKeep) elements.viewKeep.style.display = 'none';
      if (elements.btnAddHeader) elements.btnAddHeader.querySelector('span').textContent = 'Tambah';
      if (elements.btnFabAdd) elements.btnFabAdd.title = 'Tambah Template Baru';
    } else if (tabName === 'keep') {
      if (elements.tabBtnKeep) elements.tabBtnKeep.classList.add('active');
      if (elements.tabBtnPk) elements.tabBtnPk.classList.remove('active');
      if (elements.pkHeaderControls) elements.pkHeaderControls.style.display = 'none';
      if (elements.keepHeaderControls) elements.keepHeaderControls.style.display = 'block';
      if (elements.viewPk) elements.viewPk.style.display = 'none';
      if (elements.viewKeep) elements.viewKeep.style.display = 'block';
      if (elements.btnAddHeader) elements.btnAddHeader.querySelector('span').textContent = '+ Catatan';
      if (elements.btnFabAdd) elements.btnFabAdd.title = 'Buat Catatan Baru';
      if (window.KeepManager && typeof window.KeepManager.refresh === 'function') {
        window.KeepManager.refresh();
      }
    }
  }

  // =========================================================================
  // Multi-User Workspace & Auth UI Logic
  // =========================================================================
  function updateHeaderUserPill() {
    if (!elements.btnUserProfile) return;
    const isLogged = window.WorkspaceManager && window.WorkspaceManager.isLoggedIn();
    if (isLogged) {
      const userDisplay = window.WorkspaceManager.getCurrentUserDisplay();
      if (elements.headerUserName) elements.headerUserName.textContent = userDisplay;
      elements.btnUserProfile.classList.add('is-logged-in');
    } else {
      if (elements.headerUserName) elements.headerUserName.textContent = 'Masuk';
      elements.btnUserProfile.classList.remove('is-logged-in');
    }
  }

  function openAuthModal() {
    if (!elements.modalAuth) return;
    const isLogged = window.WorkspaceManager && window.WorkspaceManager.isLoggedIn();

    if (isLogged) {
      // Tampilkan view aktif
      if (elements.authActiveView) elements.authActiveView.style.display = 'block';
      if (elements.formAuthLogin) elements.formAuthLogin.style.display = 'none';

      const userDisplay = window.WorkspaceManager.getCurrentUserDisplay();
      if (elements.authDisplayUsername) elements.authDisplayUsername.textContent = userDisplay;
      if (elements.authCloudPath) elements.authCloudPath.textContent = getPkFirebasePath();

      const copyTexts = elements.modalAuth.querySelectorAll('.copy-user-id-text');
      copyTexts.forEach(el => el.textContent = window.WorkspaceManager.getCurrentUser() || 'user');
    } else {
      // Tampilkan form login / pendaftaran
      if (elements.authActiveView) elements.authActiveView.style.display = 'none';
      if (elements.formAuthLogin) elements.formAuthLogin.style.display = 'block';

      if (elements.authInputUserid) {
        elements.authInputUserid.value = '';
        setTimeout(() => elements.authInputUserid.focus(), 300);
      }
      if (elements.authInputPassword) {
        elements.authInputPassword.value = window.WorkspaceManager ? window.WorkspaceManager.getMasterPassword() : '1';
      }

      renderRecentUsers();
    }

    elements.modalAuth.style.display = 'flex';
  }

  function renderRecentUsers() {
    if (!elements.authRecentUsersBox || !elements.authRecentUsersList) return;
    const list = window.WorkspaceManager ? window.WorkspaceManager.getRecentUsers() : [];

    if (list.length === 0) {
      elements.authRecentUsersBox.style.display = 'none';
      elements.authRecentUsersList.innerHTML = '';
      return;
    }

    elements.authRecentUsersBox.style.display = 'block';
    elements.authRecentUsersList.innerHTML = list.map(u => `
      <button type="button" class="recent-user-chip" data-user="${escapeHtml(u)}">
        <span class="chip-avatar">👤</span>
        <span class="chip-name">${escapeHtml(u.toUpperCase())}</span>
      </button>
    `).join('');

    // Bind chip clicks
    elements.authRecentUsersList.querySelectorAll('.recent-user-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = btn.getAttribute('data-user');
        if (elements.authInputUserid) elements.authInputUserid.value = u;
        if (elements.authInputPassword) elements.authInputPassword.value = '1';
      });
    });
  }

  function handleAuthSubmit(e) {
    if (e) e.preventDefault();
    const userId = elements.authInputUserid ? elements.authInputUserid.value.trim() : '';
    const pass = elements.authInputPassword ? elements.authInputPassword.value.trim() : '';

    if (!userId) {
      alert('Silakan masukkan User ID Anda!');
      return;
    }

    if (!window.WorkspaceManager) return;
    const result = window.WorkspaceManager.login(userId, pass);

    if (result.success) {
      elements.modalAuth.style.display = 'none';
      showToast('Ruang Kerja Dibuka! ✓', `Selamat datang, ${result.user.toUpperCase()}`);
    } else {
      alert(result.message);
    }
  }

  function handleAuthLogout() {
    if (!window.WorkspaceManager) return;
    const confirmLogout = confirm('Keluar dari ruang kerja ini? Anda dapat masuk kembali kapan saja dengan User ID & password.');
    if (!confirmLogout) return;

    window.WorkspaceManager.logout();
    showToast('Berhasil Keluar', 'Silakan masukkan User ID untuk ruang kerja baru.');
    openAuthModal();
  }

  // =========================================================================
  // Universal XML Engine UI Logic
  // =========================================================================
  function openXmlModal() {
    if (!elements.modalXml) return;

    // Pastikan user tahu target akun
    const userDisplay = window.WorkspaceManager ? window.WorkspaceManager.getCurrentUserDisplay() : 'DEFAULT';
    if (elements.xmlTargetUser) elements.xmlTargetUser.textContent = `Tujuan: ${userDisplay}`;
    if (elements.xmlExportUser) elements.xmlExportUser.textContent = userDisplay;
    if (elements.xmlExportCount) elements.xmlExportCount.textContent = `${state.templates.length} Template`;

    // Reset preview
    state.pendingXmlTemplates = [];
    if (elements.xmlPreviewCard) elements.xmlPreviewCard.style.display = 'none';
    if (elements.xmlSelectedFileName) {
      elements.xmlSelectedFileName.style.display = 'none';
      elements.xmlSelectedFileName.textContent = '';
    }
    if (elements.xmlPasteTextarea) elements.xmlPasteTextarea.value = '';

    // Default to Import tab & File method
    switchXmlTab('import');
    switchXmlMethod('file');

    elements.modalXml.style.display = 'flex';
  }

  function switchXmlTab(tab) {
    if (!elements.xmlTabImport || !elements.xmlTabExport) return;

    if (tab === 'export') {
      elements.xmlTabImport.classList.remove('active');
      elements.xmlTabExport.classList.add('active');
      if (elements.xmlViewImport) elements.xmlViewImport.style.display = 'none';
      if (elements.xmlViewExport) elements.xmlViewExport.style.display = 'block';

      // Update export count
      if (elements.xmlExportCount) elements.xmlExportCount.textContent = `${state.templates.length} Template`;
    } else {
      elements.xmlTabExport.classList.remove('active');
      elements.xmlTabImport.classList.add('active');
      if (elements.xmlViewExport) elements.xmlViewExport.style.display = 'none';
      if (elements.xmlViewImport) elements.xmlViewImport.style.display = 'block';
    }
  }

  function switchXmlMethod(method) {
    if (!elements.btnMethodFile || !elements.btnMethodPaste) return;

    if (method === 'paste') {
      elements.btnMethodFile.classList.remove('active');
      elements.btnMethodPaste.classList.add('active');
      if (elements.xmlFileContainer) elements.xmlFileContainer.style.display = 'none';
      if (elements.xmlPasteContainer) elements.xmlPasteContainer.style.display = 'block';
    } else {
      elements.btnMethodPaste.classList.remove('active');
      elements.btnMethodFile.classList.add('active');
      if (elements.xmlPasteContainer) elements.xmlPasteContainer.style.display = 'none';
      if (elements.xmlFileContainer) elements.xmlFileContainer.style.display = 'block';
    }
  }

  function processXmlString(xmlString, sourceLabel) {
    if (!window.XmlEngine) {
      alert('XmlEngine belum termuat.');
      return;
    }

    const result = window.XmlEngine.parse(xmlString, { defaultCategory: 'Custom', filename: sourceLabel });
    if (!result.success) {
      alert('Gagal memproses XML:\n' + result.error);
      return;
    }

    state.pendingXmlTemplates = result.templates;
    displayXmlPreview(result, sourceLabel);
  }

  function displayXmlPreview(result, sourceLabel) {
    if (!elements.xmlPreviewCard) return;

    elements.xmlPreviewCard.style.display = 'block';
    if (elements.xmlPreviewCount) {
      elements.xmlPreviewCount.textContent = `✓ ${result.totalCount} Template Terdeteksi (${sourceLabel || 'XML'})`;
    }

    // Categories badges
    if (elements.xmlPreviewCategories) {
      elements.xmlPreviewCategories.innerHTML = result.categories.map(c => 
        `<span class="xml-cat-pill">${escapeHtml(c)}</span>`
      ).join('');
    }

    // Sample items (up to 4 items)
    if (elements.xmlPreviewSampleList) {
      const sample = result.templates.slice(0, 4);
      elements.xmlPreviewSampleList.innerHTML = sample.map(item => `
        <div class="xml-preview-item">
          <div class="xml-item-top">
            <span class="trigger-badge ${item.triggerType === 'hotkey' ? 'hotkey-badge' : (item.triggerType === 'none' ? 'no-trigger' : '')}">${escapeHtml(item.trigger)}</span>
            <span class="cat-badge cat-custom">${escapeHtml(item.category)}</span>
          </div>
          <p class="xml-item-content">${escapeHtml(item.content.slice(0, 110))}${item.content.length > 110 ? '...' : ''}</p>
        </div>
      `).join('');

      if (result.templates.length > 4) {
        elements.xmlPreviewSampleList.innerHTML += `
          <div class="xml-more-hint">+ ${result.templates.length - 4} template lainnya siap diimpor...</div>
        `;
      }
    }

    // Scroll to preview
    elements.xmlPreviewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function importXmlMerge() {
    if (!state.pendingXmlTemplates || state.pendingXmlTemplates.length === 0) {
      alert('Tidak ada template yang siap diimpor.');
      return;
    }

    const count = state.pendingXmlTemplates.length;
    // Gabungkan ke depan daftar
    state.templates = [...state.pendingXmlTemplates, ...state.templates];
    saveTemplates(true);
    applyFilters();

    elements.modalXml.style.display = 'none';
    showToast('XML Berhasil Digabung! ✓', `${count} template ditambahkan ke akun Anda.`);
  }

  function importXmlReplace() {
    if (!state.pendingXmlTemplates || state.pendingXmlTemplates.length === 0) {
      alert('Tidak ada template yang siap diimpor.');
      return;
    }

    const count = state.pendingXmlTemplates.length;
    const confirmRep = confirm(`PERINGATAN: Seluruh template lama di akun Anda akan diganti dengan ${count} template dari XML ini. Lanjutkan?`);
    if (!confirmRep) return;

    state.templates = [...state.pendingXmlTemplates];
    saveTemplates(true);
    applyFilters();

    elements.modalXml.style.display = 'none';
    showToast('XML Berhasil Diimpor! ✓', `${count} template baru telah menggantikan data lama.`);
  }

  function exportXmlDownload() {
    if (!window.XmlEngine) return;
    if (state.templates.length === 0) {
      alert('Tidak ada template untuk diekspor!');
      return;
    }

    const xmlStr = window.XmlEngine.generate(state.templates);
    const user = window.WorkspaceManager ? window.WorkspaceManager.getCurrentUser() : 'vault';
    const now = new Date().toISOString().slice(0, 10);
    const filename = `PK_Export_${user}_${now}.xml`;

    window.XmlEngine.download(xmlStr, filename);
    showToast('File XML Diunduh! ✓', `${state.templates.length} template diekspor ke format Perfect Keyboard PC.`);
  }

  // =========================================================================
  // Event Listeners Setup
  // =========================================================================
  function setupEvents() {
    // Tab Switcher Events
    if (elements.tabBtnPk) elements.tabBtnPk.addEventListener('click', () => switchTab('pk'));
    if (elements.tabBtnKeep) elements.tabBtnKeep.addEventListener('click', () => switchTab('keep'));

    // Keyboard Shortcuts (Alt+1 for PK, Alt+2 for KEEP)
    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        switchTab('pk');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        switchTab('keep');
      }
    });

    // Search Events
    let searchDebounce = null;
    elements.searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      state.searchQuery = val;
      elements.btnClearSearch.style.display = val ? 'flex' : 'none';

      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        applyFilters();
      }, 150);
    });

    elements.btnClearSearch.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.btnClearSearch.style.display = 'none';
      applyFilters();
      elements.searchInput.focus();
    });

    // Search Mode Selection (Semua / Khusus Trigger / Khusus Isi)
    if (elements.searchModeContainer) {
      elements.searchModeContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.search-mode-pill');
        if (!pill) return;
        const mode = pill.getAttribute('data-mode');
        if (!mode || mode === state.searchMode) return;
        setSearchMode(mode);
      });
    }

    // Category Tabs
    elements.categoriesContainer.addEventListener('click', (e) => {
      const pill = e.target.closest('.cat-pill');
      if (!pill) return;

      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      state.activeCategory = pill.dataset.category;
      applyFilters();
    });

    // Sort Select
    elements.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      applyFilters();
    });

    // Reset Filters from Empty State
    elements.btnResetFilters.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      state.activeCategory = 'all';
      setSearchMode('all');
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      document.querySelector('.cat-pill[data-category="all"]').classList.add('active');
      elements.btnClearSearch.style.display = 'none';
      applyFilters();
    });

    // Load More
    elements.btnLoadMore.addEventListener('click', () => {
      state.currentPage++;
      renderTemplates();
    });

    // Card Actions Delegation (Copy, Edit, Delete, Pin, Variable)
    elements.templatesGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'copy') {
        handleCopyAction(id, btn);
      } else if (action === 'copy-card') {
        // Only trigger if not clicking inside an interactive element
        if (!e.target.closest('button')) {
          handleCopyAction(id, null);
        }
      } else if (action === 'edit') {
        openEditModal(id);
      } else if (action === 'delete') {
        openDeleteModal(id);
      } else if (action === 'pin') {
        togglePin(id);
      } else if (action === 'open-variable') {
        openVariableModal(id);
      }
    });

    // Variable Modal Events
    elements.varInputValue.addEventListener('input', updateVariablePreview);
    elements.varInputValue.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        copyVariableResult();
      }
    });
    elements.btnCopyVariable.addEventListener('click', copyVariableResult);
    elements.btnCloseVariable.addEventListener('click', () => elements.modalVariable.style.display = 'none');
    elements.btnCancelVariable.addEventListener('click', () => elements.modalVariable.style.display = 'none');

    // Add Action (Contextual for PK or KEEP)
    const handleContextualAdd = () => {
      if (state.activeTab === 'keep') {
        if (window.KeepManager && typeof window.KeepManager.openAddModal === 'function') {
          window.KeepManager.openAddModal();
        }
      } else {
        openAddModal();
      }
    };

    elements.btnAddHeader.addEventListener('click', handleContextualAdd);
    elements.btnFabAdd.addEventListener('click', handleContextualAdd);
    elements.btnCloseModal.addEventListener('click', () => elements.modalTemplate.style.display = 'none');
    elements.btnCancelModal.addEventListener('click', () => elements.modalTemplate.style.display = 'none');
    elements.formTemplate.addEventListener('submit', handleSaveTemplate);

    elements.inputContent.addEventListener('input', (e) => {
      elements.formCharCount.textContent = `${e.target.value.length} karakter`;
    });

    // Delete Modal Events
    elements.btnCloseDelete.addEventListener('click', () => elements.modalDelete.style.display = 'none');
    elements.btnCancelDelete.addEventListener('click', () => elements.modalDelete.style.display = 'none');
    elements.btnConfirmDelete.addEventListener('click', confirmDelete);

    // Helper to reset cloud config to locked state
    const resetCloudLockState = () => {
      if (elements.cloudConfigLockedView) elements.cloudConfigLockedView.style.display = 'block';
      if (elements.cloudConfigUnlockedView) elements.cloudConfigUnlockedView.style.display = 'none';
      if (elements.cloudUnlockPromptPanel) elements.cloudUnlockPromptPanel.style.display = 'none';
      if (elements.inputUnlockCloudPassword) elements.inputUnlockCloudPassword.value = '';
      if (elements.cloudUnlockErrMsg) elements.cloudUnlockErrMsg.style.display = 'none';
    };

    // Settings Modal Events
    if (elements.btnSettings) {
      elements.btnSettings.addEventListener('click', () => {
        updateCategoryCounts();
        resetCloudLockState();
        elements.modalSettings.style.display = 'flex';
      });
    }
    if (elements.btnCloseSettings) {
      elements.btnCloseSettings.addEventListener('click', () => {
        resetCloudLockState();
        elements.modalSettings.style.display = 'none';
      });
    }
    
    const btnSettingsOpenXml = document.getElementById('btn-settings-open-xml');
    if (btnSettingsOpenXml) {
      btnSettingsOpenXml.addEventListener('click', () => {
        elements.modalSettings.style.display = 'none';
        openXmlModal();
      });
    }

    elements.btnExportJson.addEventListener('click', exportBackup);
    elements.fileImportJson.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        importBackup(e.target.files[0]);
      }
    });
    elements.btnResetOriginal.addEventListener('click', resetToOriginal);

    // =========================================================================
    // User Profile / Auth Events
    // =========================================================================
    if (elements.btnUserProfile) {
      elements.btnUserProfile.addEventListener('click', openAuthModal);
    }
    if (elements.btnCloseAuth) {
      elements.btnCloseAuth.addEventListener('click', () => elements.modalAuth.style.display = 'none');
    }
    if (elements.btnCancelAuth) {
      elements.btnCancelAuth.addEventListener('click', () => elements.modalAuth.style.display = 'none');
    }
    if (elements.btnCloseAuthActive) {
      elements.btnCloseAuthActive.addEventListener('click', () => elements.modalAuth.style.display = 'none');
    }
    if (elements.formAuthLogin) {
      elements.formAuthLogin.addEventListener('submit', handleAuthSubmit);
    }
    if (elements.btnLogoutUser) {
      elements.btnLogoutUser.addEventListener('click', handleAuthLogout);
    }

    // =========================================================================
    // XML Engine Events
    // =========================================================================
    if (elements.btnOpenXml) {
      elements.btnOpenXml.addEventListener('click', openXmlModal);
    }
    if (elements.btnCloseXml) {
      elements.btnCloseXml.addEventListener('click', () => elements.modalXml.style.display = 'none');
    }
    if (elements.xmlTabImport) {
      elements.xmlTabImport.addEventListener('click', () => switchXmlTab('import'));
    }
    if (elements.xmlTabExport) {
      elements.xmlTabExport.addEventListener('click', () => switchXmlTab('export'));
    }
    if (elements.btnMethodFile) {
      elements.btnMethodFile.addEventListener('click', () => switchXmlMethod('file'));
    }
    if (elements.btnMethodPaste) {
      elements.btnMethodPaste.addEventListener('click', () => switchXmlMethod('paste'));
    }

    // File Dropzone & Input
    if (elements.xmlFileInput) {
      elements.xmlFileInput.addEventListener('change', (e) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (!file) return;

        if (elements.xmlSelectedFileName) {
          elements.xmlSelectedFileName.style.display = 'block';
          elements.xmlSelectedFileName.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
          processXmlString(evt.target.result, file.name);
        };
        reader.readAsText(file, 'utf-8');
      });
    }

    if (elements.xmlDropzone) {
      elements.xmlDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.xmlDropzone.classList.add('drag-over');
      });
      elements.xmlDropzone.addEventListener('dragleave', () => {
        elements.xmlDropzone.classList.remove('drag-over');
      });
      elements.xmlDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.xmlDropzone.classList.remove('drag-over');
        const file = e.dataTransfer.files ? e.dataTransfer.files[0] : null;
        if (file) {
          if (elements.xmlSelectedFileName) {
            elements.xmlSelectedFileName.style.display = 'block';
            elements.xmlSelectedFileName.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
          }
          const reader = new FileReader();
          reader.onload = (evt) => {
            processXmlString(evt.target.result, file.name);
          };
          reader.readAsText(file, 'utf-8');
        }
      });
    }

    // Paste & Clipboard
    if (elements.btnPasteClipboard) {
      elements.btnPasteClipboard.addEventListener('click', async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const clipText = await navigator.clipboard.readText();
            if (elements.xmlPasteTextarea) {
              elements.xmlPasteTextarea.value = clipText;
              showToast('Teks Ditempel', `${clipText.length} karakter.`);
            }
          } else {
            alert('Gunakan Ctrl+V / tempel manual pada kotak teks.');
          }
        } catch (e) {
          alert('Tidak dapat membaca clipboard otomatis. Silakan tempel (Ctrl+V) langsung ke kotak teks.');
        }
      });
    }

    if (elements.btnParsePaste) {
      elements.btnParsePaste.addEventListener('click', () => {
        const text = elements.xmlPasteTextarea ? elements.xmlPasteTextarea.value.trim() : '';
        if (!text) {
          alert('Silakan tempelkan teks XML terlebih dahulu!');
          return;
        }
        processXmlString(text, 'Teks Paste');
      });
    }

    // Merge & Replace Actions
    if (elements.btnXmlMerge) {
      elements.btnXmlMerge.addEventListener('click', importXmlMerge);
    }
    if (elements.btnXmlReplace) {
      elements.btnXmlReplace.addEventListener('click', importXmlReplace);
    }

    // Export Download Button
    if (elements.btnDownloadXml) {
      elements.btnDownloadXml.addEventListener('click', exportXmlDownload);
    }

    // Cloud Sync Settings Events
    if (elements.btnSaveCloud) {
      elements.btnSaveCloud.addEventListener('click', () => {
        const url = elements.inputFirebaseUrl.value.trim();
        const apiKey = elements.inputFirebaseApiKey ? elements.inputFirebaseApiKey.value.trim() : '';

        if (!url) {
          alert('Harap masukkan URL Firebase Realtime Database Anda!\nContoh: https://proyek-anda-default-rtdb.firebaseio.com');
          return;
        }

        // Clean up URL trailing slash if needed
        const cleanUrl = url.replace(/\/+$/, '');
        const config = {
          databaseURL: cleanUrl,
          apiKey: apiKey || 'pk-matrix-key'
        };

        try {
          localStorage.setItem('PK_FIREBASE_CONFIG', JSON.stringify(config));
          initCloudSync();
          showToast('Menghubungkan ke Cloud...', cleanUrl);
        } catch (e) {
          alert('Gagal menyimpan konfigurasi cloud: ' + e.message);
        }
      });
    }

    if (elements.btnSyncNow) {
      elements.btnSyncNow.addEventListener('click', () => {
        if (!state.cloudSync.db) {
          alert('Cloud belum terhubung!');
          return;
        }
        syncChangeToCloud();
        showToast('Sinkronisasi Dikirim! ✓', 'Data lokal diunggah ke cloud.');
      });
    }

    if (elements.btnDisconnectCloud) {
      elements.btnDisconnectCloud.addEventListener('click', () => {
        const confirmDisc = confirm('Putus koneksi cloud? Aplikasi akan beralih ke penyimpanan lokal (LocalStorage).');
        if (!confirmDisc) return;

        localStorage.removeItem('PK_FIREBASE_CONFIG');
        if (state.cloudSync.db && dbRefListener && state.cloudSync.attachedPkPath) {
          state.cloudSync.db.ref(state.cloudSync.attachedPkPath).off('value', dbRefListener);
        }
        state.cloudSync.db = null;
        state.cloudSync.isConfigured = false;
        elements.inputFirebaseUrl.value = '';
        if (elements.inputFirebaseApiKey) elements.inputFirebaseApiKey.value = '';
        if (elements.btnSyncNow) elements.btnSyncNow.style.display = 'none';
        if (elements.btnSyncNowLocked) elements.btnSyncNowLocked.style.display = 'none';
        if (elements.btnDisconnectCloud) elements.btnDisconnectCloud.style.display = 'none';
        setSyncStatus('local', 'Lokal');
        showToast('Koneksi Cloud Diputus', 'Sekarang berjalan dalam mode lokal.');
      });
    }

    // =========================================================================
    // Cloud Security Lock / Unlock with Password 'smj'
    // =========================================================================
    const CLOUD_ADMIN_PASSWORD = 'smj';

    if (elements.btnShowUnlockCloud) {
      elements.btnShowUnlockCloud.addEventListener('click', () => {
        if (elements.cloudUnlockPromptPanel) {
          elements.cloudUnlockPromptPanel.style.display = 'block';
          if (elements.inputUnlockCloudPassword) {
            elements.inputUnlockCloudPassword.value = '';
            setTimeout(() => elements.inputUnlockCloudPassword.focus(), 100);
          }
          if (elements.cloudUnlockErrMsg) elements.cloudUnlockErrMsg.style.display = 'none';
        }
      });
    }

    if (elements.btnCancelUnlockCloud) {
      elements.btnCancelUnlockCloud.addEventListener('click', () => {
        if (elements.cloudUnlockPromptPanel) elements.cloudUnlockPromptPanel.style.display = 'none';
        if (elements.cloudUnlockErrMsg) elements.cloudUnlockErrMsg.style.display = 'none';
      });
    }

    const verifyCloudUnlock = () => {
      if (!elements.inputUnlockCloudPassword) return;
      const pwd = elements.inputUnlockCloudPassword.value.trim();
      if (pwd === CLOUD_ADMIN_PASSWORD) {
        if (elements.cloudConfigLockedView) elements.cloudConfigLockedView.style.display = 'none';
        if (elements.cloudConfigUnlockedView) elements.cloudConfigUnlockedView.style.display = 'block';
        if (elements.cloudUnlockPromptPanel) elements.cloudUnlockPromptPanel.style.display = 'none';
        if (elements.cloudUnlockErrMsg) elements.cloudUnlockErrMsg.style.display = 'none';
        showToast('Akses Database Terbuka ✓', 'Konfigurasi Firebase dapat dilihat & diedit.');
      } else {
        if (elements.cloudUnlockErrMsg) {
          elements.cloudUnlockErrMsg.style.display = 'block';
          elements.cloudUnlockErrMsg.textContent = 'Password salah! Akses konfigurasi ditolak.';
        }
        elements.inputUnlockCloudPassword.select();
      }
    };

    if (elements.btnVerifyUnlockCloud) {
      elements.btnVerifyUnlockCloud.addEventListener('click', verifyCloudUnlock);
    }

    if (elements.inputUnlockCloudPassword) {
      elements.inputUnlockCloudPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          verifyCloudUnlock();
        }
      });
    }

    if (elements.btnRelockCloud) {
      elements.btnRelockCloud.addEventListener('click', () => {
        resetCloudLockState();
        showToast('Terkunci 🔒', 'Konfigurasi database kembali disensor & dilindungi.');
      });
    }

    if (elements.btnSyncNowLocked) {
      elements.btnSyncNowLocked.addEventListener('click', () => {
        if (!state.cloudSync.db) {
          alert('Cloud belum terhubung!');
          return;
        }
        syncChangeToCloud();
        showToast('Sinkronisasi Dikirim! ✓', 'Data lokal diunggah ke cloud.');
      });
    }

    // Close Modals when clicking on backdrop
    [
      elements.modalTemplate, 
      elements.modalVariable, 
      elements.modalSettings, 
      elements.modalDelete, 
      elements.modalAuth, 
      elements.modalXml
    ].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.style.display = 'none';
          }
        });
      }
    });

    // Scroll to Top Button
    window.addEventListener('scroll', () => {
      if (window.scrollY > 280) {
        elements.btnScrollTop.style.display = 'flex';
      } else {
        elements.btnScrollTop.style.display = 'none';
      }
    }, { passive: true });

    elements.btnScrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // =========================================================================
  // Workspace Manager Event Integration
  // =========================================================================
  if (window.WorkspaceManager && typeof window.WorkspaceManager.onAuthChange === 'function') {
    window.WorkspaceManager.onAuthChange((newUserId) => {
      updateHeaderUserPill();
      initData();
      initCloudSync();
      if (window.KeepManager && typeof window.KeepManager.reload === 'function') {
        window.KeepManager.reload();
      }
    });
  }

  // =========================================================================
  // Initialize Application
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    updateHeaderUserPill();
    initData();
    initCloudSync();
    setupEvents();

    // Jika belum login di browser ini, tampilkan prompt User ID ramah
    if (window.WorkspaceManager && !window.WorkspaceManager.isLoggedIn()) {
      setTimeout(() => {
        openAuthModal();
      }, 350);
    }
  });

})();
