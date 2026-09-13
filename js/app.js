/**
 * PK MATRIX - Perfect Keyboard Template Manager Application
 * Logika Utama: LocalStorage CRUD, Pencarian Canggih, 1-Tap Copy, Haptic Feedback, Backup/Restore
 */

(function () {
  'use strict';

  // Storage Keys
  const STORAGE_KEY = 'PK_VAULT_TEMPLATES';
  const STATS_KEY = 'PK_VAULT_STATS';

  // Application State
  const state = {
    templates: [],
    filteredTemplates: [],
    activeCategory: 'all',
    searchQuery: '',
    sortBy: 'default',
    totalCopiedCount: 0,
    pageSize: 30,
    currentPage: 1,
    pendingDeleteId: null,
    activeVariableTemplate: null
  };

  // DOM Elements Cache
  const elements = {
    // Header & Stats
    headerTotalCount: document.getElementById('header-total-count'),
    btnStats: document.getElementById('btn-stats'),
    btnSettings: document.getElementById('btn-settings'),
    btnAddHeader: document.getElementById('btn-add-header'),

    // Search
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),

    // Categories
    categoriesContainer: document.getElementById('categories-container'),
    countAll: document.getElementById('count-all'),
    countPinned: document.getElementById('count-pinned'),
    countEvent: document.getElementById('count-event'),
    countAudit: document.getElementById('count-audit'),
    countPendamping: document.getElementById('count-pendamping'),
    countPihak3: document.getElementById('count-pihak3'),

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

    // Delete Modal
    modalDelete: document.getElementById('modal-delete'),
    deletePreviewTrigger: document.getElementById('delete-preview-trigger'),
    deletePreviewContent: document.getElementById('delete-preview-content'),
    btnCloseDelete: document.getElementById('btn-close-delete'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),

    // Toast
    toast: document.getElementById('toast'),
    toastTitle: document.getElementById('toast-title'),
    toastSubtitle: document.getElementById('toast-subtitle')
  };

  // Toast Timer
  let toastTimeout = null;

  // =========================================================================
  // Initial Data Loading & Persistence
  // =========================================================================
  function initData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        state.templates = JSON.parse(stored);
      } else if (window.DEFAULT_TEMPLATES && Array.isArray(window.DEFAULT_TEMPLATES)) {
        state.templates = [...window.DEFAULT_TEMPLATES];
        saveTemplates();
      } else {
        state.templates = [];
      }

      const storedStats = localStorage.getItem(STATS_KEY);
      if (storedStats) {
        const stats = JSON.parse(storedStats);
        state.totalCopiedCount = stats.totalCopiedCount || 0;
      }
    } catch (e) {
      console.error('Gagal memuat data dari localStorage, menggunakan data default:', e);
      if (window.DEFAULT_TEMPLATES) {
        state.templates = [...window.DEFAULT_TEMPLATES];
      }
    }

    updateCategoryCounts();
    applyFilters();
  }

  function saveTemplates() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.templates));
      updateCategoryCounts();
    } catch (e) {
      console.error('Gagal menyimpan ke localStorage:', e);
      showToast('Gagal menyimpan data!', 'Kapasitas penyimpanan browser penuh.', 'error');
    }
  }

  function saveStats() {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify({
        totalCopiedCount: state.totalCopiedCount
      }));
    } catch (e) {
      console.error('Gagal menyimpan stats:', e);
    }
  }

  // =========================================================================
  // Filter & Search Logic
  // =========================================================================
  function updateCategoryCounts() {
    const total = state.templates.length;
    let pinned = 0, event = 0, audit = 0, pendamping = 0, pihak3 = 0;

    state.templates.forEach(t => {
      if (t.isPinned) pinned++;
      if (t.category === 'Khusus Event') event++;
      else if (t.category === 'PK Anti Audit') audit++;
      else if (t.category === 'PK Pendamping') pendamping++;
      else if (t.category === 'Pihak Ke-3') pihak3++;
    });

    if (elements.headerTotalCount) elements.headerTotalCount.textContent = total;
    if (elements.countAll) elements.countAll.textContent = total;
    if (elements.countPinned) elements.countPinned.textContent = pinned;
    if (elements.countEvent) elements.countEvent.textContent = event;
    if (elements.countAudit) elements.countAudit.textContent = audit;
    if (elements.countPendamping) elements.countPendamping.textContent = pendamping;
    if (elements.countPihak3) elements.countPihak3.textContent = pihak3;

    // Also update settings stats
    if (elements.statTotal) elements.statTotal.textContent = total;
    if (elements.statCopied) elements.statCopied.textContent = state.totalCopiedCount;
    if (elements.statPinned) elements.statPinned.textContent = pinned;
  }

  function applyFilters() {
    const query = state.searchQuery.trim().toLowerCase();
    const cat = state.activeCategory;

    let result = state.templates.filter(item => {
      // Category filter
      if (cat === 'pinned' && !item.isPinned) return false;
      if (cat !== 'all' && cat !== 'pinned' && item.category !== cat) return false;

      // Search filter
      if (query) {
        const triggerMatch = (item.trigger || '').toLowerCase().includes(query);
        const contentMatch = (item.content || '').toLowerCase().includes(query);
        const nameMatch = (item.name || '').toLowerCase().includes(query);
        return triggerMatch || contentMatch || nameMatch;
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

    // Highlight search match in text if query exists
    let displayContent = escapeHtml(item.content);
    let displayTrigger = escapeHtml(item.trigger);

    if (state.searchQuery.trim()) {
      const q = escapeRegExp(state.searchQuery.trim());
      const regex = new RegExp(`(${q})`, 'gi');
      displayContent = displayContent.replace(regex, '<mark>$1</mark>');
      displayTrigger = displayTrigger.replace(regex, '<mark>$1</mark>');
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
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.templates, null, 2));
    const now = new Date().toISOString().slice(0, 10);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PK_Vault_Backup_${now}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Backup Diunduh! ✓', 'File JSON tersimpan di perangkat Anda.');
  }

  function importBackup(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          state.templates = importedData;
          saveTemplates();
          applyFilters();
          elements.modalSettings.style.display = 'none';
          showToast('Data Berhasil Dipulihkan! ✓', `${importedData.length} template dimuat.`);
        } else {
          alert('Format file JSON tidak valid!');
        }
      } catch (err) {
        alert('Gagal membaca file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  function resetToOriginal() {
    const confirmReset = confirm('PERINGATAN: Seluruh perubahan dan template baru Anda akan dikembalikan ke data awal bawaan file XML (397 template). Lanjutkan?');
    if (!confirmReset) return;

    if (window.DEFAULT_TEMPLATES && Array.isArray(window.DEFAULT_TEMPLATES)) {
      state.templates = JSON.parse(JSON.stringify(window.DEFAULT_TEMPLATES));
      saveTemplates();
      applyFilters();
      elements.modalSettings.style.display = 'none';
      showToast('Data Direset ke Bawaan XML! ✓', '397 template dipulihkan.');
    } else {
      alert('Data default tidak ditemukan!');
    }
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
  // Event Listeners Setup
  // =========================================================================
  function setupEvents() {
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
    elements.btnCopyVariable.addEventListener('click', copyVariableResult);
    elements.btnCloseVariable.addEventListener('click', () => elements.modalVariable.style.display = 'none');
    elements.btnCancelVariable.addEventListener('click', () => elements.modalVariable.style.display = 'none');

    // Add / Edit Modal Events
    elements.btnAddHeader.addEventListener('click', openAddModal);
    elements.btnFabAdd.addEventListener('click', openAddModal);
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

    // Settings Modal Events
    elements.btnSettings.addEventListener('click', () => {
      updateCategoryCounts();
      elements.modalSettings.style.display = 'flex';
    });
    elements.btnStats.addEventListener('click', () => {
      updateCategoryCounts();
      elements.modalSettings.style.display = 'flex';
    });
    elements.btnCloseSettings.addEventListener('click', () => elements.modalSettings.style.display = 'none');
    elements.btnExportJson.addEventListener('click', exportBackup);
    elements.fileImportJson.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        importBackup(e.target.files[0]);
      }
    });
    elements.btnResetOriginal.addEventListener('click', resetToOriginal);

    // Close Modals when clicking on backdrop
    [elements.modalTemplate, elements.modalVariable, elements.modalSettings, elements.modalDelete].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
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
  // Initialize Application
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initData();
    setupEvents();
  });

})();
