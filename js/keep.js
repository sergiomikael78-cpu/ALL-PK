/**
 * KEEP VAULT - Visual Notes & Media Knowledge Base (Google Keep Style)
 * Fitur: Masonry Grid / List View, 12 Warna Kartu, Lampiran Gambar, Link Preview, 
 * 1-Tap Fast Copy, Pencarian Instan, Pinning, Modal Editor Berwarna, Cloud Sync RTDB.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'PK_KEEP_DATA';
  const VIEW_MODE_KEY = 'PK_KEEP_VIEW_MODE';

  // Bersihkan cache peninggalan proyek lama
  try {
    localStorage.removeItem('PK_KEEP_NOTES');
  } catch (e) {}

  // State
  const keepState = {
    notes: [],
    filteredNotes: [],
    searchQuery: '',
    activeLabel: 'all',
    activeColor: 'all',
    viewMode: localStorage.getItem(VIEW_MODE_KEY) || 'grid', // 'grid' | 'list'
    activeEditId: null,
    pendingDeleteId: null,
    quickNoteColor: 'default',
    quickNotePinned: false,
    quickNoteImage: null,
    activeModalMode: 'view', // 'view' | 'edit'
    inNoteSearch: ''
  };

  // Color Palette Definitions (12 Google Keep Dark Aesthetic Themes)
  const KEEP_COLORS = [
    { id: 'default', name: 'Obsidian Dark', hex: '#12192b', border: '#273756' },
    { id: 'amber', name: 'Amber Brown', hex: '#4a2800', border: '#78350f' },
    { id: 'purple', name: 'Royal Amethyst', hex: '#3c1f5c', border: '#6b21a8' },
    { id: 'wine', name: 'Ruby Wine', hex: '#5c1d2e', border: '#9f1239' },
    { id: 'blue', name: 'Ocean Navy', hex: '#1a3b5c', border: '#1e40af' },
    { id: 'teal', name: 'Deep Teal', hex: '#134e4a', border: '#0f766e' },
    { id: 'green', name: 'Forest Emerald', hex: '#1b4332', border: '#15803d' },
    { id: 'charcoal', name: 'Charcoal Slate', hex: '#262f3e', border: '#475569' },
    { id: 'rust', name: 'Rust Bronze', hex: '#552914', border: '#854d0e' },
    { id: 'indigo', name: 'Midnight Indigo', hex: '#262959', border: '#4338ca' },
    { id: 'rose', name: 'Velvet Rose', hex: '#4c1d38', border: '#831843' },
    { id: 'dark', name: 'Core Pitch', hex: '#0a0e17', border: '#1e293b' }
  ];

  // DOM Elements Cache
  const els = {};

  function cacheElements() {
    els.viewKeep = document.getElementById('view-keep');
    els.keepCountBadge = document.getElementById('tab-keep-count');
    els.keepHeaderTotal = document.getElementById('keep-header-total');
    els.keepSearchInput = document.getElementById('keep-search-input');
    els.btnClearKeepSearch = document.getElementById('btn-clear-keep-search');
    els.keepLabelsContainer = document.getElementById('keep-labels-container');
    els.btnToggleView = document.getElementById('btn-toggle-keep-view');
    els.btnToggleColorFilter = document.getElementById('btn-toggle-color-filter');
    els.colorFilterBar = document.getElementById('keep-color-filter-bar');
    els.keepResultText = document.getElementById('keep-results-count-text');

    // Quick Note Bar (Modular Response Creator)
    els.quickNoteCollapsed = document.getElementById('quick-note-collapsed');
    els.quickNoteExpanded = document.getElementById('quick-note-expanded');
    els.quickTitleInput = document.getElementById('quick-note-title');
    els.quickContentInput = document.getElementById('quick-note-content');
    els.quickResponsesContainer = document.getElementById('quick-responses-container');
    els.btnAddQuickResponse = document.getElementById('btn-add-quick-response');
    els.quickImageInput = document.getElementById('quick-image-file');
    els.quickImagePreview = document.getElementById('quick-image-preview');
    els.quickImagePreviewImg = document.getElementById('quick-image-preview-img');
    els.btnRemoveQuickImage = document.getElementById('btn-remove-quick-image');
    els.quickCategorySelect = document.getElementById('quick-note-category');
    els.quickColorPalette = document.getElementById('quick-color-palette');
    els.btnQuickPin = document.getElementById('btn-quick-pin');
    els.btnSaveQuickNote = document.getElementById('btn-save-quick-note');
    els.btnCloseQuickNote = document.getElementById('btn-close-quick-note');
    els.btnAddQuickImage = document.getElementById('btn-add-quick-image');

    // Grid Containers
    els.pinnedSection = document.getElementById('keep-pinned-section');
    els.pinnedGrid = document.getElementById('keep-pinned-grid');
    els.othersSection = document.getElementById('keep-others-section');
    els.othersGrid = document.getElementById('keep-others-grid');
    els.emptyState = document.getElementById('keep-empty-state');
    els.btnResetKeepFilters = document.getElementById('btn-reset-keep-filters');

    // Edit Modal & Modular Response Cards Studio
    els.modalKeepNote = document.getElementById('modal-keep-note');
    els.modalNoteContent = document.getElementById('modal-keep-note-sheet');
    els.modalModeTabs = document.getElementById('modal-mode-tabs');
    els.btnModeView = document.getElementById('btn-mode-view');
    els.btnModeEdit = document.getElementById('btn-mode-edit');
    els.modalViewContainer = document.getElementById('modal-view-container');
    els.modalEditContainer = document.getElementById('modal-edit-container');
    els.modalDisplayTitle = document.getElementById('modal-display-title');
    els.modalResponsesBadge = document.getElementById('modal-responses-badge');

    // In-Note Search
    els.inNoteSearchWrapper = document.getElementById('in-note-search-wrapper');
    els.inNoteSearchInput = document.getElementById('in-note-search-input');
    els.btnClearInNoteSearch = document.getElementById('btn-clear-in-note-search');

    // Response Containers
    els.keepResponseCardsList = document.getElementById('keep-response-cards-list');
    els.keepEditableResponsesContainer = document.getElementById('keep-editable-responses-container');
    els.btnAddResponseCard = document.getElementById('btn-add-response-card');

    // Header & Meta Fields
    els.editNoteTitle = document.getElementById('edit-note-title');
    els.editNoteContent = document.getElementById('edit-note-content');
    els.editNoteCategory = document.getElementById('edit-note-category');
    els.editNoteColorPalette = document.getElementById('edit-note-color-palette');
    els.editNotePinBtn = document.getElementById('btn-edit-note-pin');
    els.editNoteDate = document.getElementById('edit-note-date');
    els.btnCloseEditNote = document.getElementById('btn-close-edit-note');

    // Compact Collapsible Image Box
    els.editNoteImageWrap = document.getElementById('edit-note-image-wrap');
    els.editNoteImage = document.getElementById('edit-note-image');
    els.btnToggleImageCollapse = document.getElementById('btn-toggle-image-collapse');
    els.labelToggleImage = document.getElementById('label-toggle-image');
    els.btnZoomModalImage = document.getElementById('btn-zoom-modal-image');
    els.compactImageContent = document.getElementById('compact-image-content');
    els.btnRemoveEditImage = document.getElementById('btn-remove-edit-image');
    els.editImageFileInput = document.getElementById('edit-image-file');
    els.btnAddEditImage = document.getElementById('btn-add-edit-image');

    // Footer Actions
    els.footerViewActions = document.getElementById('footer-view-actions');
    els.footerEditActions = document.getElementById('footer-edit-actions');
    els.btnCopyAllResponses = document.getElementById('btn-copy-all-responses');
    els.btnFooterEditMode = document.getElementById('btn-footer-edit-mode');
    els.btnCancelEditMode = document.getElementById('btn-cancel-edit-mode');
    els.btnSaveEditNote = document.getElementById('btn-save-edit-note');
    els.btnDeleteEditNote = document.getElementById('btn-delete-edit-note');

    // Lightbox
    els.modalLightbox = document.getElementById('modal-keep-lightbox');
    els.lightboxImage = document.getElementById('keep-lightbox-image');
    els.lightboxCaption = document.getElementById('keep-lightbox-caption');
    els.btnCloseLightbox = document.getElementById('btn-close-lightbox');
  }

  // =========================================================================
  // Initial Data & Persistence
  // =========================================================================
  function initKeepData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        keepState.notes = JSON.parse(stored);
        // Ensure every note has a clean responses array (clean legacy dashed lines)
        keepState.notes.forEach(note => {
          if (!note.responses || !Array.isArray(note.responses) || note.responses.length === 0) {
            note.responses = getNoteResponses(note);
          }
        });
      } else if (window.DEFAULT_KEEP_NOTES && Array.isArray(window.DEFAULT_KEEP_NOTES)) {
        keepState.notes = JSON.parse(JSON.stringify(window.DEFAULT_KEEP_NOTES));
        saveKeepNotes(false);
      } else {
        keepState.notes = [];
      }
    } catch (e) {
      console.error('Gagal memuat catatan KEEP dari localStorage:', e);
      if (window.DEFAULT_KEEP_NOTES) {
        keepState.notes = JSON.parse(JSON.stringify(window.DEFAULT_KEEP_NOTES));
      }
    }

    updateLabelsCounts();
    applyKeepFilters();
  }

  function saveKeepNotes(pushToCloud = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keepState.notes));
      updateLabelsCounts();
      if (pushToCloud) {
        syncKeepToCloud();
      }
    } catch (e) {
      console.error('Gagal menyimpan KEEP notes:', e);
      showGlobalToast('Penyimpanan Penuh!', 'Gambar berukuran terlalu besar untuk memori browser.', 'error');
    }
  }

  // Cloud Sync Integration
  function syncKeepToCloud() {
    try {
      if (window.FirebaseSync && typeof window.FirebaseSync.syncKeepNotes === 'function') {
        window.FirebaseSync.syncKeepNotes(keepState.notes);
      }
    } catch (e) {
      console.warn('Sync keep to cloud deferred:', e);
    }
  }

  // =========================================================================
  // Filtering & Search
  // =========================================================================
  function updateLabelsCounts() {
    const total = keepState.notes.length;
    let pinnedCount = 0;
    const catCounts = {
      all: total,
      pinned: 0,
      Event: 0,
      Promo: 0,
      Kendala: 0,
      Deposit: 0,
      SOP: 0,
      Tutorial: 0
    };

    keepState.notes.forEach(note => {
      if (note.isPinned) {
        pinnedCount++;
        catCounts.pinned++;
      }
      if (note.category && catCounts[note.category] !== undefined) {
        catCounts[note.category]++;
      }
    });

    if (els.keepCountBadge) els.keepCountBadge.textContent = total;
    if (els.keepHeaderTotal) els.keepHeaderTotal.textContent = total;

    // Update label pill counts
    if (els.keepLabelsContainer) {
      const pills = els.keepLabelsContainer.querySelectorAll('[data-keep-label]');
      pills.forEach(pill => {
        const lbl = pill.dataset.keepLabel;
        const countSpan = pill.querySelector('.pill-count');
        if (countSpan && catCounts[lbl] !== undefined) {
          countSpan.textContent = catCounts[lbl];
        }
      });
    }
  }

  function applyKeepFilters() {
    const query = keepState.searchQuery.trim().toLowerCase();
    const lbl = keepState.activeLabel;
    const col = keepState.activeColor;

    let result = keepState.notes.filter(note => {
      // Label filter
      if (lbl === 'pinned' && !note.isPinned) return false;
      if (lbl !== 'all' && lbl !== 'pinned' && note.category !== lbl) return false;

      // Color filter
      if (col !== 'all' && (note.color || 'default') !== col) return false;

      // Search filter
      if (query) {
        const titleMatch = (note.title || '').toLowerCase().includes(query);
        const contentMatch = (note.content || '').toLowerCase().includes(query);
        const catMatch = (note.category || '').toLowerCase().includes(query);
        const linkMatch = Array.isArray(note.links) && note.links.some(l => l.toLowerCase().includes(query));
        return titleMatch || contentMatch || catMatch || linkMatch;
      }

      return true;
    });

    keepState.filteredNotes = result;
    renderKeepNotes();
  }

  // =========================================================================
  // Rendering Notes Grid (Pinned & Others)
  // =========================================================================
  function renderKeepNotes() {
    const total = keepState.filteredNotes.length;
    const totalAll = keepState.notes.length;

    // Update result info
    if (els.keepResultText) {
      if (keepState.searchQuery || keepState.activeLabel !== 'all' || keepState.activeColor !== 'all') {
        els.keepResultText.textContent = `Menampilkan ${total} dari ${totalAll} catatan KEEP`;
      } else {
        els.keepResultText.textContent = `Menampilkan ${total} catatan`;
      }
    }

    // Empty state
    if (total === 0) {
      if (els.pinnedSection) els.pinnedSection.style.display = 'none';
      if (els.othersSection) els.othersSection.style.display = 'none';
      if (els.emptyState) els.emptyState.style.display = 'block';
      return;
    } else {
      if (els.emptyState) els.emptyState.style.display = 'none';
    }

    const pinnedNotes = keepState.filteredNotes.filter(n => n.isPinned);
    const otherNotes = keepState.filteredNotes.filter(n => !n.isPinned);

    // Apply view mode class
    const viewClass = keepState.viewMode === 'list' ? 'keep-view-list' : 'keep-view-grid';
    if (els.pinnedGrid) els.pinnedGrid.className = `keep-masonry-grid ${viewClass}`;
    if (els.othersGrid) els.othersGrid.className = `keep-masonry-grid ${viewClass}`;

    // Render Pinned section
    if (pinnedNotes.length > 0) {
      if (els.pinnedSection) els.pinnedSection.style.display = 'block';
      if (els.pinnedGrid) {
        els.pinnedGrid.innerHTML = pinnedNotes.map(n => createNoteCardHtml(n)).join('');
      }
    } else {
      if (els.pinnedSection) els.pinnedSection.style.display = 'none';
    }

    // Render Others section
    if (otherNotes.length > 0) {
      if (els.othersSection) els.othersSection.style.display = 'block';
      // Hide title "CATATAN LAINNYA" if there are no pinned notes
      const othersTitle = els.othersSection.querySelector('.keep-section-title');
      if (othersTitle) {
        othersTitle.style.display = pinnedNotes.length > 0 ? 'flex' : 'none';
      }
      if (els.othersGrid) {
        els.othersGrid.innerHTML = otherNotes.map(n => createNoteCardHtml(n)).join('');
      }
    } else {
      if (els.othersSection) els.othersSection.style.display = 'none';
    }
  }

  function getNoteResponses(note) {
    if (!note) return [];
    if (Array.isArray(note.responses) && note.responses.length > 0) {
      return note.responses.map(r => String(r).trim()).filter(Boolean);
    }
    if (!note.content) return [];
    // Cleanly split without leaving dashed lines (---, ===, ***)
    const rawBlocks = note.content.split(/(?:\r?\n\s*[-=_*]{3,}\s*\r?\n|\r?\n\s*\r?\n+)/);
    const responses = [];
    rawBlocks.forEach(b => {
      const cleaned = b.replace(/^[ \t]*[-=_*]{3,}[ \t]*$/gm, '').trim();
      if (cleaned) responses.push(cleaned);
    });
    return responses.length > 0 ? responses : (note.content.trim() ? [note.content.trim()] : []);
  }

  function createNoteCardHtml(note) {
    const colorId = note.color || 'default';
    const hasImage = !!note.image;
    const isPinned = !!note.isPinned;
    const responses = getNoteResponses(note);
    const responseCount = responses.length;

    // Highlight search match
    let displayTitle = escapeHtml(note.title || '');
    // Preview: first response if available, or clean text (NEVER with dashed lines)
    const previewRaw = responseCount > 0 ? responses[0] : (note.content || '');
    let displayContent = formatNoteContent(previewRaw);

    if (keepState.searchQuery.trim()) {
      const q = escapeRegExp(keepState.searchQuery.trim());
      const regex = new RegExp(`(${q})`, 'gi');
      displayTitle = displayTitle.replace(regex, '<mark>$1</mark>');
      displayContent = displayContent.replace(regex, '<mark>$1</mark>');
    }

    // Extract URLs for link preview chips
    const links = note.links || extractUrls(note.content || '');
    const linkChips = links.map(url => {
      const domain = getDomainFromUrl(url);
      return `
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="keep-link-chip" title="Buka ${escapeHtml(url)}" onclick="event.stopPropagation();">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          <span class="chip-text">${escapeHtml(domain)}</span>
        </a>
      `;
    }).join('');

    // Response count badge and extra hint
    const responseBadgeHtml = responseCount > 1
      ? `<span class="keep-card-badge response-count-badge" title="Terdapat ${responseCount} respon individual">⚡ ${responseCount} Respon</span>`
      : '';

    const moreResponsesHint = responseCount > 1
      ? `<div class="card-more-responses-hint">+${responseCount - 1} respon lainnya (klik kartu)</div>`
      : '';

    return `
      <article class="keep-card keep-color-${colorId} ${isPinned ? 'is-pinned' : ''}" data-keep-id="${note.id}">
        ${hasImage ? `
          <div class="keep-card-image-box" data-action="view-image" data-keep-id="${note.id}" title="Klik untuk memperbesar gambar">
            <img src="${note.image}" alt="${escapeHtml(note.title || 'Gambar Catatan')}" class="keep-card-img" loading="lazy" />
            <div class="img-zoom-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            </div>
          </div>
        ` : ''}

        <div class="keep-card-header">
          <div class="keep-card-title-group" data-action="open-edit" data-keep-id="${note.id}">
            ${note.category ? `<span class="keep-card-badge cat-badge cat-keep-${note.category.toLowerCase()}">${escapeHtml(note.category)}</span>` : ''}
            ${responseBadgeHtml}
            ${displayTitle ? `<h3 class="keep-card-title">${displayTitle}</h3>` : ''}
          </div>
          <button class="btn-keep-pin ${isPinned ? 'pinned' : ''}" data-action="toggle-pin" data-keep-id="${note.id}" title="${isPinned ? 'Lepas Sematan' : 'Sematkan Catatan'}">
            ${isPinned ? '★' : '☆'}
          </button>
        </div>

        <div class="keep-card-body" data-action="open-edit" data-keep-id="${note.id}">
          <div class="keep-text-content">${displayContent}</div>
          ${moreResponsesHint}
          ${linkChips ? `<div class="keep-links-row">${linkChips}</div>` : ''}
        </div>

        <div class="keep-card-footer">
          <button class="btn-keep-copy" data-action="copy-note" data-keep-id="${note.id}" title="Salin seluruh respon catatan ini">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>SALIN</span>
          </button>

          <div class="keep-card-actions">
            <!-- Quick Color Palette Button -->
            <div class="color-picker-dropdown-wrapper">
              <button class="btn-card-icon btn-color-picker" data-action="open-card-palette" data-keep-id="${note.id}" title="Ubah warna kartu">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
              </button>
              <div class="card-color-popover" id="color-popover-${note.id}" style="display: none;">
                ${renderColorSwatchesHtml(note.id, note.color)}
              </div>
            </div>

            <!-- Edit Button -->
            <button class="btn-card-icon" data-action="open-edit" data-keep-id="${note.id}" title="Buka / Edit Catatan">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>

            <!-- Delete Button -->
            <button class="btn-card-icon btn-delete" data-action="delete-note" data-keep-id="${note.id}" title="Hapus Catatan">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderColorSwatchesHtml(noteId, currentColor = 'default') {
    return KEEP_COLORS.map(c => `
      <button 
        type="button" 
        class="swatch-btn ${c.id === currentColor ? 'is-selected' : ''}" 
        style="background-color: ${c.hex}; border-color: ${c.border};" 
        data-action="select-card-color" 
        data-keep-id="${noteId}" 
        data-color="${c.id}" 
        title="${c.name}"
      ></button>
    `).join('');
  }

  // =========================================================================
  // Quick Note Creator Handling
  // =========================================================================
  function setupQuickNote() {
    // Click collapsed to expand
    if (els.quickNoteCollapsed) {
      els.quickNoteCollapsed.addEventListener('click', expandQuickNote);
    }

    // Close expanded
    if (els.btnCloseQuickNote) {
      els.btnCloseQuickNote.addEventListener('click', collapseQuickNote);
    }

    // Add Response block button in Quick Creator
    if (els.btnAddQuickResponse) {
      els.btnAddQuickResponse.addEventListener('click', () => addQuickResponseItem(''));
    }

    // Delete Response block delegation in Quick Creator
    if (els.quickResponsesContainer) {
      els.quickResponsesContainer.addEventListener('click', (e) => {
        const btnDel = e.target.closest('[data-action="delete-quick-resp"]');
        if (!btnDel) return;

        const item = btnDel.closest('.quick-response-item');
        if (!item) return;

        const allItems = els.quickResponsesContainer.querySelectorAll('.quick-response-item');
        if (allItems.length <= 1) {
          const ta = item.querySelector('textarea');
          if (ta) ta.value = '';
          return;
        }

        item.remove();
        reindexQuickResponses();
      });
    }

    // Pin toggle
    if (els.btnQuickPin) {
      els.btnQuickPin.addEventListener('click', () => {
        keepState.quickNotePinned = !keepState.quickNotePinned;
        els.btnQuickPin.classList.toggle('pinned', keepState.quickNotePinned);
        els.btnQuickPin.textContent = keepState.quickNotePinned ? '★' : '☆';
      });
    }

    // Color Swatches in Quick Note
    if (els.quickColorPalette) {
      els.quickColorPalette.innerHTML = KEEP_COLORS.map(c => `
        <button 
          type="button" 
          class="swatch-btn ${c.id === 'default' ? 'is-selected' : ''}" 
          style="background-color: ${c.hex}; border-color: ${c.border};" 
          data-color="${c.id}" 
          title="${c.name}"
        ></button>
      `).join('');

      els.quickColorPalette.addEventListener('click', (e) => {
        const btn = e.target.closest('.swatch-btn');
        if (!btn) return;
        const col = btn.dataset.color;
        keepState.quickNoteColor = col;
        els.quickColorPalette.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');

        // Apply background style to expanded creator
        const colObj = KEEP_COLORS.find(c => c.id === col) || KEEP_COLORS[0];
        els.quickNoteExpanded.style.backgroundColor = colObj.hex;
        els.quickNoteExpanded.style.borderColor = colObj.border;
      });
    }

    // Image upload in Quick Note
    if (els.btnAddQuickImage && els.quickImageInput) {
      els.btnAddQuickImage.addEventListener('click', () => {
        els.quickImageInput.click();
      });

      els.quickImageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          readFileAsBase64(e.target.files[0], (dataUrl) => {
            keepState.quickNoteImage = dataUrl;
            if (els.quickImagePreviewImg) els.quickImagePreviewImg.src = dataUrl;
            if (els.quickImagePreview) els.quickImagePreview.style.display = 'block';
          });
        }
      });
    }

    if (els.btnRemoveQuickImage) {
      els.btnRemoveQuickImage.addEventListener('click', () => {
        keepState.quickNoteImage = null;
        if (els.quickImageInput) els.quickImageInput.value = '';
        if (els.quickImagePreview) els.quickImagePreview.style.display = 'none';
        if (els.quickImagePreviewImg) els.quickImagePreviewImg.src = '';
      });
    }

    // Save Quick Note
    if (els.btnSaveQuickNote) {
      els.btnSaveQuickNote.addEventListener('click', saveQuickNote);
    }
  }

  function addQuickResponseItem(initialText = '') {
    if (!els.quickResponsesContainer) return;
    const items = els.quickResponsesContainer.querySelectorAll('.quick-response-item');
    const newIdx = items.length;

    const div = document.createElement('div');
    div.className = 'quick-response-item';
    div.dataset.index = newIdx;
    div.innerHTML = `
      <div class="quick-response-item-header">
        <span class="quick-response-badge">⚡ RESPON ${String(newIdx + 1).padStart(2, '0')}</span>
        <button type="button" class="btn-quick-delete-resp" data-action="delete-quick-resp" title="Hapus respon ini">✕ Hapus</button>
      </div>
      <textarea class="quick-response-textarea" rows="2" placeholder="Tuliskan respon kalimat berikutnya...">${escapeHtml(initialText)}</textarea>
    `;

    els.quickResponsesContainer.appendChild(div);
    reindexQuickResponses();

    const ta = div.querySelector('textarea');
    if (ta) ta.focus();
  }

  function reindexQuickResponses() {
    if (!els.quickResponsesContainer) return;
    const items = els.quickResponsesContainer.querySelectorAll('.quick-response-item');
    items.forEach((item, idx) => {
      item.dataset.index = idx;
      const badge = item.querySelector('.quick-response-badge');
      if (badge) badge.textContent = `⚡ RESPON ${String(idx + 1).padStart(2, '0')}`;
      const delBtn = item.querySelector('.btn-quick-delete-resp');
      if (delBtn) {
        delBtn.style.display = items.length > 1 ? 'inline-block' : 'none';
      }
    });
  }

  function expandQuickNote() {
    if (els.quickNoteCollapsed) els.quickNoteCollapsed.style.display = 'none';
    if (els.quickNoteExpanded) {
      els.quickNoteExpanded.style.display = 'block';
      if (els.quickTitleInput) els.quickTitleInput.focus();
    }
  }

  function collapseQuickNote() {
    if (els.quickNoteCollapsed) els.quickNoteCollapsed.style.display = 'flex';
    if (els.quickNoteExpanded) {
      els.quickNoteExpanded.style.display = 'none';
    }
    resetQuickNoteForm();
  }

  function resetQuickNoteForm() {
    if (els.quickTitleInput) els.quickTitleInput.value = '';
    if (els.quickCategorySelect) els.quickCategorySelect.value = 'Event';
    if (els.quickImageInput) els.quickImageInput.value = '';
    if (els.quickImagePreview) els.quickImagePreview.style.display = 'none';
    if (els.quickImagePreviewImg) els.quickImagePreviewImg.src = '';
    keepState.quickNoteColor = 'default';
    keepState.quickNotePinned = false;
    keepState.quickNoteImage = null;

    if (els.quickResponsesContainer) {
      els.quickResponsesContainer.innerHTML = `
        <div class="quick-response-item" data-index="0">
          <div class="quick-response-item-header">
            <span class="quick-response-badge">⚡ RESPON 01</span>
            <button type="button" class="btn-quick-delete-resp" data-action="delete-quick-resp" title="Hapus respon ini" style="display: none;">✕ Hapus</button>
          </div>
          <textarea class="quick-response-textarea" rows="2" placeholder="Tuliskan kalimat atau jawaban respon pertama..."></textarea>
        </div>
      `;
    }

    if (els.btnQuickPin) {
      els.btnQuickPin.classList.remove('pinned');
      els.btnQuickPin.textContent = '☆';
    }

    if (els.quickNoteExpanded) {
      els.quickNoteExpanded.style.backgroundColor = '';
      els.quickNoteExpanded.style.borderColor = '';
    }

    if (els.quickColorPalette) {
      els.quickColorPalette.querySelectorAll('.swatch-btn').forEach(b => {
        b.classList.toggle('is-selected', b.dataset.color === 'default');
      });
    }
  }

  function saveQuickNote() {
    const title = els.quickTitleInput ? els.quickTitleInput.value.trim() : '';

    // Collect responses from all quick-response-textarea elements
    const responses = [];
    if (els.quickResponsesContainer) {
      const textareas = els.quickResponsesContainer.querySelectorAll('.quick-response-textarea');
      textareas.forEach(ta => {
        const val = ta.value.trim();
        if (val) {
          // If user pasted multi-paragraph or dashed text inside a box, clean it up cleanly
          const rawBlocks = val.split(/(?:\r?\n\s*[-=_*]{3,}\s*\r?\n|\r?\n\s*\r?\n+)/);
          rawBlocks.forEach(b => {
            const cleaned = b.replace(/^[ \t]*[-=_*]{3,}[ \t]*$/gm, '').trim();
            if (cleaned) responses.push(cleaned);
          });
        }
      });
    }

    if (!title && responses.length === 0 && !keepState.quickNoteImage) {
      showGlobalToast('Catatan Kosong', 'Tuliskan judul, respon kalimat, atau lampirkan gambar.');
      collapseQuickNote();
      return;
    }

    const newNote = {
      id: 'keep_' + Date.now(),
      title: title,
      content: responses.join('\n\n'),
      responses: responses,
      category: els.quickCategorySelect ? (els.quickCategorySelect.value || 'Event') : 'Event',
      color: keepState.quickNoteColor || 'default',
      isPinned: keepState.quickNotePinned,
      image: keepState.quickNoteImage || null,
      links: extractUrls(responses.join('\n\n')),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      copyCount: 0
    };

    keepState.notes.unshift(newNote);
    saveKeepNotes(true);
    applyKeepFilters();
    collapseQuickNote();
    showGlobalToast('Catatan Disimpan! ✓', title || 'Catatan baru ditambahkan ke KEEP.');
  }

  // =========================================================================
  // Edit / Detail Modal Handling (Modular Response Cards Studio)
  // =========================================================================
  let currentEditColor = 'default';
  let currentEditPinned = false;
  let currentEditImage = null;

  function openEditModal(noteId, initialMode = 'view') {
    const note = keepState.notes.find(n => n.id === noteId);
    if (!note) return;

    keepState.activeEditId = noteId;
    keepState.inNoteSearch = '';
    currentEditColor = note.color || 'default';
    currentEditPinned = !!note.isPinned;
    currentEditImage = note.image || null;

    // Reset In-Note Search input
    if (els.inNoteSearchInput) els.inNoteSearchInput.value = '';
    if (els.btnClearInNoteSearch) els.btnClearInNoteSearch.style.display = 'none';

    // Set header fields
    if (els.editNoteCategory) els.editNoteCategory.value = note.category || 'Event';
    if (els.editNoteTitle) els.editNoteTitle.value = note.title || '';

    // Date
    if (els.editNoteDate) {
      const d = note.updatedAt ? new Date(note.updatedAt) : new Date();
      els.editNoteDate.textContent = `Diedit ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
    }

    // Pin
    if (els.editNotePinBtn) {
      els.editNotePinBtn.classList.toggle('pinned', currentEditPinned);
      els.editNotePinBtn.textContent = currentEditPinned ? '★' : '☆';
    }

    // Image Setup with Collapsible state
    if (currentEditImage) {
      if (els.editNoteImage) els.editNoteImage.src = currentEditImage;
      if (els.editNoteImageWrap) els.editNoteImageWrap.style.display = 'block';
      if (els.compactImageContent) els.compactImageContent.classList.remove('is-folded');
      if (els.labelToggleImage) els.labelToggleImage.textContent = 'Lipat Gambar ▲';
    } else {
      if (els.editNoteImageWrap) els.editNoteImageWrap.style.display = 'none';
      if (els.editNoteImage) els.editNoteImage.src = '';
    }

    // Color Swatches in modal
    renderModalColorPalette(currentEditColor);
    applyModalColorTheme(currentEditColor);

    // Switch to initial mode (view / edit)
    switchModalMode(initialMode || 'view');

    if (els.modalKeepNote) els.modalKeepNote.style.display = 'flex';
  }

  function switchModalMode(mode) {
    keepState.activeModalMode = mode;

    if (mode === 'view') {
      if (els.btnModeView) els.btnModeView.classList.add('active');
      if (els.btnModeEdit) els.btnModeEdit.classList.remove('active');
      if (els.modalViewContainer) els.modalViewContainer.style.display = 'block';
      if (els.modalEditContainer) els.modalEditContainer.style.display = 'none';
      if (els.footerViewActions) els.footerViewActions.style.display = 'flex';
      if (els.footerEditActions) els.footerEditActions.style.display = 'none';
      renderModalResponseCards();
    } else {
      if (els.btnModeEdit) els.btnModeEdit.classList.add('active');
      if (els.btnModeView) els.btnModeView.classList.remove('active');
      if (els.modalEditContainer) els.modalEditContainer.style.display = 'block';
      if (els.modalViewContainer) els.modalViewContainer.style.display = 'none';
      if (els.footerEditActions) els.footerEditActions.style.display = 'flex';
      if (els.footerViewActions) els.footerViewActions.style.display = 'none';
      renderEditableResponses();
    }
  }

  function renderModalResponseCards() {
    if (!els.keepResponseCardsList) return;
    const note = keepState.notes.find(n => n.id === keepState.activeEditId);
    if (!note) return;

    if (els.modalDisplayTitle) {
      els.modalDisplayTitle.textContent = note.title || 'Tanpa Judul';
    }

    const responses = getNoteResponses(note);
    if (els.modalResponsesBadge) {
      els.modalResponsesBadge.textContent = `${responses.length} Respon`;
    }

    // Toggle in-note search visibility (show if more than 1 response)
    if (els.inNoteSearchWrapper) {
      els.inNoteSearchWrapper.style.display = responses.length > 1 ? 'flex' : 'none';
    }

    const q = (keepState.inNoteSearch || '').trim();
    const qLower = q.toLowerCase();

    const filtered = responses.map((text, idx) => ({ text, originalIndex: idx }))
      .filter(item => !qLower || item.text.toLowerCase().includes(qLower));

    if (filtered.length === 0) {
      els.keepResponseCardsList.innerHTML = `
        <div class="empty-response-msg" style="text-align:center; padding: 24px; color: var(--text-muted); font-size: 13px;">
          Tidak ada respon yang cocok dengan pencarian "<b>${escapeHtml(q)}</b>"
        </div>
      `;
      return;
    }

    els.keepResponseCardsList.innerHTML = filtered.map(item => {
      let displayText = escapeHtml(item.text);
      if (q) {
        const regex = new RegExp(`(${escapeRegExp(q)})`, 'gi');
        displayText = displayText.replace(regex, '<mark>$1</mark>');
      }
      displayText = displayText.replace(/\n/g, '<br>');

      return `
        <div class="modular-response-card" data-response-index="${item.originalIndex}" title="Klik kartu untuk salin respon ini">
          <div class="card-badge-row">
            <span class="badge-response-index">⚡ RESPON ${String(item.originalIndex + 1).padStart(2, '0')}</span>
            <span class="response-char-count">${item.text.length} karakter</span>
            <button type="button" class="btn-copy-bubble" data-action="copy-single-response" data-response-index="${item.originalIndex}" title="Salin respon ini">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>SALIN</span>
            </button>
          </div>
          <div class="response-card-text">${displayText}</div>
        </div>
      `;
    }).join('');
  }

  function renderEditableResponses() {
    if (!els.keepEditableResponsesContainer) return;
    const note = keepState.notes.find(n => n.id === keepState.activeEditId);
    if (!note) return;

    if (els.editNoteTitle) {
      els.editNoteTitle.value = note.title || '';
    }

    let responses = getNoteResponses(note);
    if (responses.length === 0) {
      responses = [''];
    }

    els.keepEditableResponsesContainer.innerHTML = responses.map((text, idx) => `
      <div class="editable-response-item" data-item-index="${idx}">
        <div class="editable-item-header">
          <span class="editable-item-index">⚡ RESPON ${String(idx + 1).padStart(2, '0')}</span>
          <button type="button" class="btn-delete-response-item" data-action="delete-response-block" title="Hapus kotak respon ini">
            ✕ Hapus
          </button>
        </div>
        <textarea class="editable-response-textarea" rows="3" placeholder="Tuliskan kalimat respon...">${escapeHtml(text)}</textarea>
      </div>
    `).join('');
  }

  function reindexEditableResponseItems() {
    if (!els.keepEditableResponsesContainer) return;
    const items = els.keepEditableResponsesContainer.querySelectorAll('.editable-response-item');
    items.forEach((item, idx) => {
      item.dataset.itemIndex = idx;
      const badge = item.querySelector('.editable-item-index');
      if (badge) badge.textContent = `⚡ RESPON ${String(idx + 1).padStart(2, '0')}`;
    });
  }

  function addEditableResponseItem(initialText = '') {
    if (!els.keepEditableResponsesContainer) return;
    const items = els.keepEditableResponsesContainer.querySelectorAll('.editable-response-item');
    const newIdx = items.length;

    const div = document.createElement('div');
    div.className = 'editable-response-item';
    div.dataset.itemIndex = newIdx;
    div.innerHTML = `
      <div class="editable-item-header">
        <span class="editable-item-index">⚡ RESPON ${String(newIdx + 1).padStart(2, '0')}</span>
        <button type="button" class="btn-delete-response-item" data-action="delete-response-block" title="Hapus kotak respon ini">
          ✕ Hapus
        </button>
      </div>
      <textarea class="editable-response-textarea" rows="3" placeholder="Tuliskan kalimat respon...">${escapeHtml(initialText)}</textarea>
    `;

    els.keepEditableResponsesContainer.appendChild(div);
    const textarea = div.querySelector('textarea');
    if (textarea) {
      textarea.focus();
      textarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function handleSingleResponseCopy(index, cardEl) {
    const note = keepState.notes.find(n => n.id === keepState.activeEditId);
    if (!note) return;

    const responses = getNoteResponses(note);
    const text = responses[index];
    if (!text) return;

    // Increment copy count
    note.copyCount = (note.copyCount || 0) + 1;
    saveKeepNotes(false);

    // Copy to clipboard with title
    copyTextWithFeedback(text, `Respon #${index + 1}: ${note.title || 'Catatan'}`);

    // Visual feedback on card
    if (cardEl) {
      cardEl.classList.add('copied-glow');
      const bubble = cardEl.querySelector('.btn-copy-bubble');
      if (bubble) {
        const originalHtml = bubble.innerHTML;
        bubble.innerHTML = '<span>✓ TERSALIN</span>';
        bubble.style.background = 'var(--cyber-emerald)';
        bubble.style.color = '#02160f';
        setTimeout(() => {
          bubble.innerHTML = originalHtml;
          bubble.style.background = '';
          bubble.style.color = '';
        }, 1500);
      }
      setTimeout(() => {
        cardEl.classList.remove('copied-glow');
      }, 1200);
    }
  }

  function copyAllNoteResponses() {
    const note = keepState.notes.find(n => n.id === keepState.activeEditId);
    if (!note) return;

    const responses = getNoteResponses(note);
    if (responses.length === 0) return;

    const fullText = responses.join('\n\n');
    copyTextWithFeedback(fullText, `Semua Respon (${responses.length}) - ${note.title || 'Catatan'}`);
  }

  function renderModalColorPalette(activeColor) {
    if (!els.editNoteColorPalette) return;
    els.editNoteColorPalette.innerHTML = KEEP_COLORS.map(c => `
      <button 
        type="button" 
        class="swatch-btn ${c.id === activeColor ? 'is-selected' : ''}" 
        style="background-color: ${c.hex}; border-color: ${c.border};" 
        data-color="${c.id}" 
        title="${c.name}"
      ></button>
    `).join('');
  }

  function applyModalColorTheme(colorId) {
    const col = KEEP_COLORS.find(c => c.id === colorId) || KEEP_COLORS[0];
    if (els.modalNoteContent) {
      els.modalNoteContent.style.backgroundColor = col.hex;
      els.modalNoteContent.style.borderColor = col.border;
    }
  }

  function setupEditModal() {
    // Mode Switcher Tabs
    if (els.btnModeView) {
      els.btnModeView.addEventListener('click', () => switchModalMode('view'));
    }
    if (els.btnModeEdit) {
      els.btnModeEdit.addEventListener('click', () => switchModalMode('edit'));
    }
    if (els.btnFooterEditMode) {
      els.btnFooterEditMode.addEventListener('click', () => switchModalMode('edit'));
    }
    if (els.btnCancelEditMode) {
      els.btnCancelEditMode.addEventListener('click', () => switchModalMode('view'));
    }

    // Close Modal
    if (els.btnCloseEditNote) {
      els.btnCloseEditNote.addEventListener('click', closeEditModal);
    }

    // Save Changes
    if (els.btnSaveEditNote) {
      els.btnSaveEditNote.addEventListener('click', saveEditModal);
    }

    // Copy All Responses
    if (els.btnCopyAllResponses) {
      els.btnCopyAllResponses.addEventListener('click', copyAllNoteResponses);
    }

    // Add Response Card Button
    if (els.btnAddResponseCard) {
      els.btnAddResponseCard.addEventListener('click', () => addEditableResponseItem(''));
    }

    // In-Note Live Search
    if (els.inNoteSearchInput) {
      els.inNoteSearchInput.addEventListener('input', (e) => {
        keepState.inNoteSearch = e.target.value;
        if (els.btnClearInNoteSearch) {
          els.btnClearInNoteSearch.style.display = e.target.value ? 'flex' : 'none';
        }
        renderModalResponseCards();
      });
    }

    if (els.btnClearInNoteSearch) {
      els.btnClearInNoteSearch.addEventListener('click', () => {
        keepState.inNoteSearch = '';
        if (els.inNoteSearchInput) els.inNoteSearchInput.value = '';
        els.btnClearInNoteSearch.style.display = 'none';
        renderModalResponseCards();
      });
    }

    // Compact Image Controls
    if (els.btnToggleImageCollapse && els.compactImageContent) {
      els.btnToggleImageCollapse.addEventListener('click', () => {
        const isFolded = els.compactImageContent.classList.toggle('is-folded');
        if (els.labelToggleImage) {
          els.labelToggleImage.textContent = isFolded ? 'Buka Gambar ▼' : 'Lipat Gambar ▲';
        }
      });
    }

    if (els.btnZoomModalImage) {
      els.btnZoomModalImage.addEventListener('click', () => {
        if (keepState.activeEditId) openLightbox(keepState.activeEditId);
      });
    }

    // Dynamic Edit Responses Container Delegation (Delete Block)
    if (els.keepEditableResponsesContainer) {
      els.keepEditableResponsesContainer.addEventListener('click', (e) => {
        const btnDelete = e.target.closest('[data-action="delete-response-block"]');
        if (!btnDelete) return;

        const item = btnDelete.closest('.editable-response-item');
        if (!item) return;

        const allItems = els.keepEditableResponsesContainer.querySelectorAll('.editable-response-item');
        if (allItems.length <= 1) {
          const ta = item.querySelector('textarea');
          if (ta) ta.value = '';
          return;
        }

        item.remove();
        reindexEditableResponseItems();
      });
    }

    // Response Cards List Click Delegation (1-Tap Fast Copy)
    if (els.keepResponseCardsList) {
      els.keepResponseCardsList.addEventListener('click', (e) => {
        const card = e.target.closest('.modular-response-card');
        if (!card) return;

        const index = parseInt(card.dataset.responseIndex, 10);
        if (isNaN(index)) return;

        handleSingleResponseCopy(index, card);
      });
    }

    // Pin Toggle in Modal
    if (els.editNotePinBtn) {
      els.editNotePinBtn.addEventListener('click', () => {
        currentEditPinned = !currentEditPinned;
        els.editNotePinBtn.classList.toggle('pinned', currentEditPinned);
        els.editNotePinBtn.textContent = currentEditPinned ? '★' : '☆';
      });
    }

    // Color Swatches in Modal
    if (els.editNoteColorPalette) {
      els.editNoteColorPalette.addEventListener('click', (e) => {
        const btn = e.target.closest('.swatch-btn');
        if (!btn) return;
        const col = btn.dataset.color;
        currentEditColor = col;
        els.editNoteColorPalette.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        applyModalColorTheme(col);
      });
    }

    // Image Upload in Modal
    if (els.btnAddEditImage && els.editImageFileInput) {
      els.btnAddEditImage.addEventListener('click', () => {
        els.editImageFileInput.click();
      });

      els.editImageFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          readFileAsBase64(e.target.files[0], (dataUrl) => {
            currentEditImage = dataUrl;
            if (els.editNoteImage) els.editNoteImage.src = dataUrl;
            if (els.editNoteImageWrap) els.editNoteImageWrap.style.display = 'block';
            if (els.compactImageContent) els.compactImageContent.classList.remove('is-folded');
            if (els.labelToggleImage) els.labelToggleImage.textContent = 'Lipat Gambar ▲';
          });
        }
      });
    }

    // Remove Image in Modal
    if (els.btnRemoveEditImage) {
      els.btnRemoveEditImage.addEventListener('click', () => {
        currentEditImage = null;
        if (els.editImageFileInput) els.editImageFileInput.value = '';
        if (els.editNoteImageWrap) els.editNoteImageWrap.style.display = 'none';
        if (els.editNoteImage) els.editNoteImage.src = '';
      });
    }

    // Delete Note in Modal
    if (els.btnDeleteEditNote) {
      els.btnDeleteEditNote.addEventListener('click', () => {
        if (!keepState.activeEditId) return;
        const confirmDel = confirm('Hapus catatan ini secara permanen dari KEEP?');
        if (confirmDel) {
          deleteNoteById(keepState.activeEditId);
          closeEditModal();
        }
      });
    }
  }

  function closeEditModal() {
    if (els.modalKeepNote) els.modalKeepNote.style.display = 'none';
    keepState.activeEditId = null;
    keepState.inNoteSearch = '';
    currentEditImage = null;
    if (els.modalNoteContent) {
      els.modalNoteContent.style.backgroundColor = '';
      els.modalNoteContent.style.borderColor = '';
    }
  }

  function saveEditModal() {
    if (!keepState.activeEditId) return;
    const note = keepState.notes.find(n => n.id === keepState.activeEditId);
    if (!note) return;

    const title = els.editNoteTitle ? els.editNoteTitle.value.trim() : '';

    // Collect responses from editable textareas
    const responses = [];
    if (els.keepEditableResponsesContainer) {
      const textareas = els.keepEditableResponsesContainer.querySelectorAll('.editable-response-textarea');
      textareas.forEach(ta => {
        const val = ta.value.trim();
        if (val) responses.push(val);
      });
    }

    if (!title && responses.length === 0 && !currentEditImage) {
      showGlobalToast('Catatan Kosong', 'Tuliskan judul atau minimal satu kalimat respon.');
      return;
    }

    note.title = title;
    note.responses = responses;
    note.content = responses.join('\n\n');
    note.category = els.editNoteCategory ? (els.editNoteCategory.value || 'Event') : 'Event';
    note.color = currentEditColor;
    note.isPinned = currentEditPinned;
    note.image = currentEditImage;
    note.links = extractUrls(note.content);
    note.updatedAt = new Date().toISOString();

    saveKeepNotes(true);
    applyKeepFilters();

    // Switch back to view mode and show feedback
    switchModalMode('view');
    showGlobalToast('Perubahan Disimpan! ✓', note.title || 'Respon diperbarui.');
  }

  function deleteNoteById(noteId) {
    const idx = keepState.notes.findIndex(n => n.id === noteId);
    if (idx !== -1) {
      const removed = keepState.notes.splice(idx, 1)[0];
      saveKeepNotes(true);
      applyKeepFilters();
      showGlobalToast('Catatan Dihapus', removed.title || 'Catatan dihapus dari KEEP.');
    }
  }

  // =========================================================================
  // Clipboard Copy Action
  // =========================================================================
  async function copyTextWithFeedback(text, title) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([40]);
      }

      showGlobalToast('Tersalin ke Clipboard! ✓', title);
    } catch (e) {
      console.error('Copy failed:', e);
      showGlobalToast('Gagal Menyalin', 'Izin clipboard ditolak browser.', 'error');
    }
  }

  function handleNoteCardCopy(noteId) {
    const note = keepState.notes.find(n => n.id === noteId);
    if (!note) return;

    const text = note.content || note.title || '';
    if (!text) return;

    note.copyCount = (note.copyCount || 0) + 1;
    saveKeepNotes(false);
    copyTextWithFeedback(text, note.title || 'Catatan KEEP');
  }

  // =========================================================================
  // Lightbox Image Viewer
  // =========================================================================
  function openLightbox(noteId) {
    const note = keepState.notes.find(n => n.id === noteId);
    if (!note || !note.image) return;

    if (els.lightboxImage) els.lightboxImage.src = note.image;
    if (els.lightboxCaption) els.lightboxCaption.textContent = note.title || 'Lampiran Gambar';
    if (els.modalLightbox) els.modalLightbox.style.display = 'flex';
  }

  function closeLightbox() {
    if (els.modalLightbox) els.modalLightbox.style.display = 'none';
  }

  // =========================================================================
  // Color Popover for Cards
  // =========================================================================
  function toggleCardColorPopover(noteId, e) {
    e.stopPropagation();
    const popover = document.getElementById(`color-popover-${noteId}`);
    if (!popover) return;

    // Close all other popovers
    document.querySelectorAll('.card-color-popover').forEach(p => {
      if (p !== popover) p.style.display = 'none';
    });

    popover.style.display = popover.style.display === 'none' ? 'grid' : 'none';
  }

  function changeNoteColor(noteId, colorId) {
    const note = keepState.notes.find(n => n.id === noteId);
    if (!note) return;

    note.color = colorId;
    note.updatedAt = new Date().toISOString();
    saveKeepNotes(true);
    applyKeepFilters();
  }

  // =========================================================================
  // Event Delegations
  // =========================================================================
  function setupDelegations() {
    // Card clicks
    const handleGridClick = (e) => {
      const target = e.target;

      // Check specific action buttons first
      const btnAction = target.closest('[data-action]');
      if (!btnAction) return;

      const action = btnAction.dataset.action;
      const noteId = btnAction.dataset.keepId;

      if (action === 'copy-note') {
        handleNoteCardCopy(noteId);
      } else if (action === 'toggle-pin') {
        const note = keepState.notes.find(n => n.id === noteId);
        if (note) {
          note.isPinned = !note.isPinned;
          saveKeepNotes(true);
          applyKeepFilters();
        }
      } else if (action === 'open-edit') {
        openEditModal(noteId);
      } else if (action === 'delete-note') {
        const confirmDel = confirm('Hapus catatan ini dari KEEP?');
        if (confirmDel) deleteNoteById(noteId);
      } else if (action === 'open-card-palette') {
        toggleCardColorPopover(noteId, e);
      } else if (action === 'select-card-color') {
        const col = btnAction.dataset.color;
        changeNoteColor(noteId, col);
      } else if (action === 'view-image') {
        openLightbox(noteId);
      }
    };

    if (els.pinnedGrid) els.pinnedGrid.addEventListener('click', handleGridClick);
    if (els.othersGrid) els.othersGrid.addEventListener('click', handleGridClick);

    // Close card color popovers when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.color-picker-dropdown-wrapper')) {
        document.querySelectorAll('.card-color-popover').forEach(p => p.style.display = 'none');
      }
    });

    // Search Input
    if (els.keepSearchInput) {
      els.keepSearchInput.addEventListener('input', (e) => {
        keepState.searchQuery = e.target.value;
        if (els.btnClearKeepSearch) {
          els.btnClearKeepSearch.style.display = e.target.value ? 'flex' : 'none';
        }
        applyKeepFilters();
      });
    }

    if (els.btnClearKeepSearch) {
      els.btnClearKeepSearch.addEventListener('click', () => {
        keepState.searchQuery = '';
        els.keepSearchInput.value = '';
        els.btnClearKeepSearch.style.display = 'none';
        els.keepSearchInput.focus();
        applyKeepFilters();
      });
    }

    // Label Filter Pills
    if (els.keepLabelsContainer) {
      els.keepLabelsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('[data-keep-label]');
        if (!pill) return;

        els.keepLabelsContainer.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        keepState.activeLabel = pill.dataset.keepLabel;
        applyKeepFilters();
      });
    }

    // Color Filter Bar
    if (els.colorFilterBar) {
      // Build swatches inside color filter bar
      els.colorFilterBar.innerHTML = `
        <button class="color-filter-chip active" data-color="all">Semua Warna</button>
        ${KEEP_COLORS.map(c => `
          <button class="color-filter-dot" data-color="${c.id}" style="background-color: ${c.hex}; border-color: ${c.border};" title="${c.name}"></button>
        `).join('')}
      `;

      els.colorFilterBar.addEventListener('click', (e) => {
        const target = e.target.closest('[data-color]');
        if (!target) return;

        els.colorFilterBar.querySelectorAll('[data-color]').forEach(el => el.classList.remove('active'));
        target.classList.add('active');

        keepState.activeColor = target.dataset.color;
        applyKeepFilters();
      });
    }

    if (els.btnToggleColorFilter && els.colorFilterBar) {
      els.btnToggleColorFilter.addEventListener('click', () => {
        const isHidden = els.colorFilterBar.style.display === 'none' || !els.colorFilterBar.style.display;
        els.colorFilterBar.style.display = isHidden ? 'flex' : 'none';
        els.btnToggleColorFilter.classList.toggle('active', isHidden);
      });
    }

    // Toggle View Mode (Grid vs List)
    if (els.btnToggleView) {
      updateViewModeButton();
      els.btnToggleView.addEventListener('click', () => {
        keepState.viewMode = keepState.viewMode === 'grid' ? 'list' : 'grid';
        localStorage.setItem(VIEW_MODE_KEY, keepState.viewMode);
        updateViewModeButton();
        renderKeepNotes();
      });
    }

    // Reset Filters
    if (els.btnResetKeepFilters) {
      els.btnResetKeepFilters.addEventListener('click', () => {
        keepState.searchQuery = '';
        keepState.activeLabel = 'all';
        keepState.activeColor = 'all';
        if (els.keepSearchInput) els.keepSearchInput.value = '';
        if (els.btnClearKeepSearch) els.btnClearKeepSearch.style.display = 'none';

        if (els.keepLabelsContainer) {
          els.keepLabelsContainer.querySelectorAll('.cat-pill').forEach(p => {
            p.classList.toggle('active', p.dataset.keepLabel === 'all');
          });
        }
        if (els.colorFilterBar) {
          els.colorFilterBar.querySelectorAll('[data-color]').forEach(el => {
            el.classList.toggle('active', el.dataset.color === 'all');
          });
        }
        applyKeepFilters();
      });
    }

    // Lightbox modal close
    if (els.btnCloseLightbox) els.btnCloseLightbox.addEventListener('click', closeLightbox);
    if (els.modalLightbox) {
      els.modalLightbox.addEventListener('click', (e) => {
        if (e.target === els.modalLightbox) closeLightbox();
      });
    }

    // Edit note modal backdrop click
    if (els.modalKeepNote) {
      els.modalKeepNote.addEventListener('click', (e) => {
        if (e.target === els.modalKeepNote) closeEditModal();
      });
    }
  }

  function updateViewModeButton() {
    if (!els.btnToggleView) return;
    const isList = keepState.viewMode === 'list';
    els.btnToggleView.title = isList ? 'Ubah ke Tampilan Grid' : 'Ubah ke Tampilan Baris (List)';
    els.btnToggleView.innerHTML = isList ? `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ` : `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
      </svg>
    `;
  }

  // =========================================================================
  // Helpers
  // =========================================================================
  function formatNoteContent(text) {
    if (!text) return '';
    const escaped = escapeHtml(text);
    return escaped.replace(/\n/g, '<br>');
  }

  function extractUrls(text) {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? Array.from(new Set(matches)) : [];
  }

  function getDomainFromUrl(url) {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  function readFileAsBase64(file, callback) {
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function showGlobalToast(title, subtitle, type = 'success') {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastSubtitle = document.getElementById('toast-subtitle');
    if (!toast) return;

    if (toastTitle) toastTitle.textContent = title;
    if (toastSubtitle) toastSubtitle.textContent = subtitle || '';

    toast.className = `toast toast-${type} toast-show`;
    toast.style.display = 'flex';

    if (window._toastTimeout) clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => {
        toast.style.display = 'none';
      }, 300);
    }, 2800);
  }

  // =========================================================================
  // Public Interface & Initialization
  // =========================================================================
  window.KeepManager = {
    init: function () {
      cacheElements();
      initKeepData();
      setupQuickNote();
      setupEditModal();
      setupDelegations();
    },
    getNotes: function () {
      return keepState.notes;
    },
    setNotes: function (newNotes, pushToCloud = false) {
      if (Array.isArray(newNotes)) {
        keepState.notes = newNotes;
        saveKeepNotes(pushToCloud);
        applyKeepFilters();
      }
    },
    refresh: function () {
      updateLabelsCounts();
      applyKeepFilters();
    },
    openAddModal: function () {
      expandQuickNote();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.KeepManager.init();
  });

})();
