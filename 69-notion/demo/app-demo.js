// Static Demo Version - Uses localStorage instead of backend API

// State
let pages = [];
let currentPage = null;
let quill = null;
let saveTimeout = null;
let selectedMoveParent = null;
let allTags = [];
let currentFilter = 'all';
let currentTagFilter = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeStorage();
  initializeEditor();
  loadTheme();
  loadTags();
  loadPages();
  setupEventListeners();
});

// Initialize localStorage with sample data
function initializeStorage() {
  if (!localStorage.getItem('notion_pages')) {
    const samplePages = [
      {
        id: generateId(),
        title: 'Welcome to Notion Clone',
        content: '<h1>Getting Started</h1><p>This is a static demo version that uses localStorage to store your data.</p><p>Try creating new pages, organizing them hierarchically, and exploring all the features!</p>',
        parent_id: null,
        position: 0,
        created_at: Date.now(),
        updated_at: Date.now(),
        is_template: false,
        tags: [],
        icon: '📝',
        cover_image: null
      }
    ];
    localStorage.setItem('notion_pages', JSON.stringify(samplePages));
    localStorage.setItem('notion_tags', JSON.stringify([]));
    localStorage.setItem('notion_versions', JSON.stringify([]));
    localStorage.setItem('notion_preferences', JSON.stringify({ theme: 'light' }));
  }
}

// Initialize Quill Editor
function initializeEditor() {
  const toolbarOptions = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link'],
    ['clean']
  ];

  quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Start writing...',
    modules: {
      toolbar: toolbarOptions
    }
  });

  // Auto-save on content change
  quill.on('text-change', () => {
    if (currentPage) {
      debouncedSave();
    }
  });
}

// Setup Event Listeners
function setupEventListeners() {
  // New page buttons
  document.getElementById('btnNewPage').addEventListener('click', createNewPage);
  document.getElementById('btnWelcomeNewPage').addEventListener('click', createNewPage);

  // Page title
  document.getElementById('pageTitle').addEventListener('input', (e) => {
    if (currentPage) {
      currentPage.title = e.target.value;
      debouncedSave();
      updatePageInSidebar(currentPage);
    }
  });

  // Action buttons
  document.getElementById('btnDuplicate').addEventListener('click', duplicateCurrentPage);
  document.getElementById('btnDelete').addEventListener('click', deleteCurrentPage);
  document.getElementById('btnMove').addEventListener('click', showMoveModal);
  document.getElementById('btnTemplate').addEventListener('click', toggleTemplate);
  document.getElementById('btnVersions').addEventListener('click', showVersionsModal);

  // Export dropdown
  document.getElementById('btnExport').addEventListener('click', toggleExportMenu);
  document.getElementById('exportMarkdown').addEventListener('click', exportAsMarkdown);
  document.getElementById('exportHTML').addEventListener('click', exportAsHTML);

  // Tags
  document.getElementById('btnAddTag').addEventListener('click', showTagModal);
  document.getElementById('btnCreateTag').addEventListener('click', createTag);
  document.getElementById('closeTagModal').addEventListener('click', hideTagModal);
  document.getElementById('closeTagModalBtn').addEventListener('click', hideTagModal);

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Filter dropdown
  document.getElementById('filterBtn').addEventListener('click', toggleFilterMenu);
  document.querySelectorAll('.filter-menu-item[data-filter]').forEach(item => {
    item.addEventListener('click', function() {
      setFilter(this.dataset.filter);
    });
  });
  document.getElementById('filterByTagItem').addEventListener('click', showTagFilterMenu);

  // Move modal
  document.getElementById('closeMoveModal').addEventListener('click', hideMoveModal);
  document.getElementById('cancelMove').addEventListener('click', hideMoveModal);
  document.getElementById('confirmMove').addEventListener('click', confirmMove);

  // Search
  document.getElementById('searchInput').addEventListener('input', handleSearch);

  // Sidebar toggle
  document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);

  // Version history modal
  document.getElementById('closeVersionsModal').addEventListener('click', hideVersionsModal);
  document.getElementById('closeVersionsModalBtn').addEventListener('click', hideVersionsModal);

  // Close modals on background click
  document.getElementById('moveModal').addEventListener('click', (e) => {
    if (e.target.id === 'moveModal') hideMoveModal();
  });

  document.getElementById('tagModal').addEventListener('click', (e) => {
    if (e.target.id === 'tagModal') hideTagModal();
  });

  document.getElementById('versionsModal').addEventListener('click', (e) => {
    if (e.target.id === 'versionsModal') hideVersionsModal();
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.export-dropdown')) {
      document.getElementById('exportMenu').classList.remove('show');
    }
    if (!e.target.closest('.filter-dropdown')) {
      document.getElementById('filterMenu').classList.remove('show');
    }
  });
}

// Generate unique ID
function generateId() {
  return 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Load all pages from localStorage
function loadPages() {
  const stored = localStorage.getItem('notion_pages');
  let allPages = stored ? JSON.parse(stored) : [];

  // Apply filters
  if (currentFilter === 'templates') {
    pages = allPages.filter(p => p.is_template);
  } else if (currentFilter === 'tag' && currentTagFilter) {
    pages = allPages.filter(p => {
      return p.tags && p.tags.some(t => t.name === currentTagFilter);
    });
  } else {
    pages = allPages;
  }

  renderPagesList();
  renderTemplatesList(allPages);

  // Load first page if exists
  if (pages.length > 0 && !currentPage) {
    loadPage(pages[0].id);
  } else if (pages.length === 0) {
    showWelcomeScreen();
  }
}

// Render pages list in sidebar
function renderPagesList() {
  const container = document.getElementById('pagesList');

  if (pages.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-file-alt"></i>
        <p>No pages yet</p>
        <p class="empty-hint">Click "New Page" to get started</p>
      </div>
    `;
    return;
  }

  // Build hierarchical structure
  const rootPages = pages.filter(p => !p.parent_id);
  const pageMap = {};
  pages.forEach(p => {
    pageMap[p.id] = { ...p, children: [] };
  });

  pages.forEach(p => {
    if (p.parent_id && pageMap[p.parent_id]) {
      pageMap[p.parent_id].children.push(pageMap[p.id]);
    }
  });

  // Sort by position
  const sortByPosition = (a, b) => a.position - b.position;
  rootPages.sort(sortByPosition);
  Object.values(pageMap).forEach(p => p.children.sort(sortByPosition));

  // Render
  container.innerHTML = '';
  rootPages.forEach(page => {
    container.appendChild(createPageElement(pageMap[page.id]));
  });

  // Initialize drag and drop
  initDragAndDrop();
}

// Create page element
function createPageElement(page, level = 0) {
  const div = document.createElement('div');
  div.className = 'page-group';
  div.dataset.pageId = page.id;

  const hasChildren = page.children && page.children.length > 0;

  div.innerHTML = `
    <div class="page-item ${currentPage && currentPage.id === page.id ? 'active' : ''}"
         data-page-id="${page.id}"
         draggable="true"
         style="padding-left: ${10 + level * 24}px">
      ${hasChildren ? `<span class="page-toggle"><i class="fas fa-chevron-down"></i></span>` : '<span class="page-toggle"></span>'}
      <span class="page-icon"><i class="fas fa-file-alt"></i></span>
      <span class="page-title-text">${escapeHtml(page.title)}</span>
    </div>
    ${hasChildren ? `<div class="page-children">${page.children.map(child => createPageElement(child, level + 1).outerHTML).join('')}</div>` : ''}
  `;

  // Event listeners
  const pageItem = div.querySelector('.page-item');
  pageItem.addEventListener('click', () => loadPage(page.id));

  if (hasChildren) {
    const toggle = div.querySelector('.page-toggle');
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const children = div.querySelector('.page-children');
      children.classList.toggle('collapsed');
      toggle.classList.toggle('collapsed');
    });
  }

  return div;
}

// Load specific page
function loadPage(pageId) {
  const stored = localStorage.getItem('notion_pages');
  const allPages = stored ? JSON.parse(stored) : [];
  currentPage = allPages.find(p => p.id === pageId);

  if (!currentPage) return;

  // Update UI
  document.getElementById('pageTitle').value = currentPage.title;
  quill.root.innerHTML = currentPage.content || '';
  updateLastEdited();

  // Update template button
  const templateBtn = document.getElementById('templateBtnText');
  templateBtn.textContent = currentPage.is_template ? 'Remove from Templates' : 'Save as Template';

  // Render tags
  renderPageTags();

  // Show editor, hide welcome
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('editorContainer').style.display = 'flex';

  // Update sidebar
  updateActivePage();
}

// Create new page
function createNewPage() {
  const newPage = {
    id: generateId(),
    title: 'Untitled',
    content: '',
    parent_id: null,
    position: pages.length,
    created_at: Date.now(),
    updated_at: Date.now(),
    is_template: false,
    tags: [],
    icon: null,
    cover_image: null
  };

  const stored = localStorage.getItem('notion_pages');
  const allPages = stored ? JSON.parse(stored) : [];
  allPages.push(newPage);
  localStorage.setItem('notion_pages', JSON.stringify(allPages));

  pages.push(newPage);
  renderPagesList();
  loadPage(newPage.id);
  showToast('Page created', 'success');
}

// Save current page
function savePage() {
  if (!currentPage) return;

  const content = quill.root.innerHTML;
  const title = document.getElementById('pageTitle').value;

  // Save version before updating
  saveVersion(currentPage.id, currentPage.title, currentPage.content);

  currentPage.title = title;
  currentPage.content = content;
  currentPage.updated_at = Date.now();

  const stored = localStorage.getItem('notion_pages');
  const allPages = stored ? JSON.parse(stored) : [];
  const index = allPages.findIndex(p => p.id === currentPage.id);
  if (index !== -1) {
    allPages[index] = currentPage;
    localStorage.setItem('notion_pages', JSON.stringify(allPages));
  }

  updatePageInSidebar(currentPage);
  updateLastEdited();
}

// Debounced save
function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(savePage, 1000);
}

// Duplicate current page
function duplicateCurrentPage() {
  if (!currentPage) return;

  const duplicate = {
    ...currentPage,
    id: generateId(),
    title: currentPage.title + ' (Copy)',
    created_at: Date.now(),
    updated_at: Date.now()
  };

  const stored = localStorage.getItem('notion_pages');
  const allPages = stored ? JSON.parse(stored) : [];
  allPages.push(duplicate);
  localStorage.setItem('notion_pages', JSON.stringify(allPages));

  pages.push(duplicate);
  renderPagesList();
  loadPage(duplicate.id);
  showToast('Page duplicated', 'success');
}

// Delete current page
function deleteCurrentPage() {
  if (!currentPage) return;

  if (!confirm(`Are you sure you want to delete "${currentPage.title}"?`)) {
    return;
  }

  const stored = localStorage.getItem('notion_pages');
  const allPages = stored ? JSON.parse(stored) : [];
  const filtered = allPages.filter(p => p.id !== currentPage.id);
  localStorage.setItem('notion_pages', JSON.stringify(filtered));

  pages = pages.filter(p => p.id !== currentPage.id);

  if (pages.length > 0) {
    loadPage(pages[0].id);
  } else {
    currentPage = null;
    showWelcomeScreen();
  }

  renderPagesList();
  showToast('Page deleted', 'success');
}

// Show/hide move modal
function showMoveModal() {
  if (!currentPage) return;
  const modal = document.getElementById('moveModal');
  const listContainer = document.getElementById('movePagesList');

  const validPages = pages.filter(p => p.id !== currentPage.id);

  listContainer.innerHTML = `
    <div class="move-option selected" data-parent="null">
      <i class="fas fa-home"></i>
      <span>Workspace (root)</span>
    </div>
    ${validPages.map(p => `
      <div class="move-option" data-parent="${p.id}">
        <i class="fas fa-file-alt"></i>
        <span>${escapeHtml(p.title)}</span>
      </div>
    `).join('')}
  `;

  document.querySelectorAll('.move-option').forEach(opt => {
    opt.addEventListener('click', function() {
      document.querySelectorAll('.move-option').forEach(o => o.classList.remove('selected'));
      this.classList.add('selected');
      selectedMoveParent = this.dataset.parent;
    });
  });

  selectedMoveParent = currentPage.parent_id || 'null';
  modal.classList.add('show');
}

function hideMoveModal() {
  document.getElementById('moveModal').classList.remove('show');
}

function confirmMove() {
  if (!currentPage) return;

  currentPage.parent_id = selectedMoveParent === 'null' ? null : selectedMoveParent;

  const stored = localStorage.getItem('notion_pages');
  const allPages = stored ? JSON.parse(stored) : [];
  const index = allPages.findIndex(p => p.id === currentPage.id);
  if (index !== -1) {
    allPages[index] = currentPage;
    localStorage.setItem('notion_pages', JSON.stringify(allPages));
  }

  loadPages();
  showToast('Page moved', 'success');
  hideMoveModal();
}

// Initialize drag and drop
function initDragAndDrop() {
  const pagesList = document.getElementById('pagesList');

  new Sortable(pagesList, {
    animation: 150,
    handle: '.page-item',
    draggable: '.page-group',
    ghostClass: 'dragging',
    onEnd: function(evt) {
      const pageId = evt.item.dataset.pageId;
      const newPosition = evt.newIndex;

      const stored = localStorage.getItem('notion_pages');
      const allPages = stored ? JSON.parse(stored) : [];
      const page = allPages.find(p => p.id === pageId);
      if (page) {
        page.position = newPosition;
        localStorage.setItem('notion_pages', JSON.stringify(allPages));
      }
    }
  });
}

// Handle search
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const pageItems = document.querySelectorAll('.page-item');

  pageItems.forEach(item => {
    const text = item.querySelector('.page-title-text').textContent.toLowerCase();
    const group = item.closest('.page-group');

    if (text.includes(query)) {
      group.style.display = '';
    } else {
      group.style.display = 'none';
    }
  });
}

// Update active page in sidebar
function updateActivePage() {
  document.querySelectorAll('.page-item').forEach(item => {
    item.classList.remove('active');
  });

  if (currentPage) {
    const activeItem = document.querySelector(`[data-page-id="${currentPage.id}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }
}

// Update page in sidebar
function updatePageInSidebar(page) {
  const pageElement = document.querySelector(`[data-page-id="${page.id}"] .page-title-text`);
  if (pageElement) {
    pageElement.textContent = page.title;
  }
}

// Update last edited time
function updateLastEdited() {
  if (!currentPage) return;

  const now = Date.now();
  const diff = now - currentPage.updated_at;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let text;
  if (days > 0) text = `${days} day${days > 1 ? 's' : ''} ago`;
  else if (hours > 0) text = `${hours} hour${hours > 1 ? 's' : ''} ago`;
  else if (minutes > 0) text = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  else text = 'just now';

  document.getElementById('lastEdited').textContent = `Last edited ${text}`;
}

// Show welcome screen
function showWelcomeScreen() {
  document.getElementById('welcomeScreen').style.display = 'flex';
  document.getElementById('editorContainer').style.display = 'none';
}

// Toggle sidebar
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// Show toast notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'error' ? 'fa-exclamation-circle' :
               type === 'success' ? 'fa-check-circle' : 'fa-info-circle';

  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== THEME MANAGEMENT =====

function loadTheme() {
  const stored = localStorage.getItem('notion_preferences');
  const prefs = stored ? JSON.parse(stored) : { theme: 'light' };
  applyTheme(prefs.theme);
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  const icon = document.getElementById('themeIcon');
  const text = document.getElementById('themeText');

  if (theme === 'dark') {
    icon.className = 'fas fa-sun theme-toggle-icon';
    text.textContent = 'Light Mode';
  } else {
    icon.className = 'fas fa-moon theme-toggle-icon';
    text.textContent = 'Dark Mode';
  }
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  applyTheme(newTheme);

  const stored = localStorage.getItem('notion_preferences');
  const prefs = stored ? JSON.parse(stored) : {};
  prefs.theme = newTheme;
  localStorage.setItem('notion_preferences', JSON.stringify(prefs));
}

// ===== EXPORT FUNCTIONS =====

function toggleExportMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('exportMenu');
  menu.classList.toggle('show');
}

function exportAsMarkdown() {
  if (!currentPage) return;

  let markdown = `# ${currentPage.title}\n\n`;
  markdown += currentPage.content
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  downloadFile(`${currentPage.title}.md`, markdown, 'text/markdown');
  document.getElementById('exportMenu').classList.remove('show');
  showToast('Exported as Markdown', 'success');
}

function exportAsHTML() {
  if (!currentPage) return;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${currentPage.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    p { line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${currentPage.title}</h1>
  ${currentPage.content}
</body>
</html>`;

  downloadFile(`${currentPage.title}.html`, html, 'text/html');
  document.getElementById('exportMenu').classList.remove('show');
  showToast('Exported as HTML', 'success');
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== TAG MANAGEMENT =====

function loadTags() {
  const stored = localStorage.getItem('notion_tags');
  allTags = stored ? JSON.parse(stored) : [];
}

function showTagModal() {
  const modal = document.getElementById('tagModal');
  renderTagList();
  modal.classList.add('show');
}

function hideTagModal() {
  document.getElementById('tagModal').classList.remove('show');
}

function renderTagList() {
  const container = document.getElementById('tagList');

  if (allTags.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No tags yet. Create one below!</p>';
    return;
  }

  container.innerHTML = allTags.map(tag => {
    const isAssigned = currentPage && currentPage.tags && currentPage.tags.some(t => t.id === tag.id);

    return `
      <div class="tag-item">
        <span class="tag" style="background-color: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40;">
          ${escapeHtml(tag.name)}
        </span>
        <div class="tag-actions">
          <button class="tag-action-btn ${isAssigned ? 'assigned' : ''}"
                  onclick="togglePageTag('${tag.id}')"
                  title="${isAssigned ? 'Remove from page' : 'Add to page'}">
            <i class="fas ${isAssigned ? 'fa-check' : 'fa-plus'}"></i>
          </button>
          <button class="tag-action-btn delete"
                  onclick="deleteTag('${tag.id}')"
                  title="Delete tag">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function createTag() {
  const nameInput = document.getElementById('newTagName');
  const colorInput = document.getElementById('newTagColor');
  const name = nameInput.value.trim();
  const color = colorInput.value;

  if (!name) {
    showToast('Tag name is required', 'error');
    return;
  }

  const newTag = {
    id: generateId(),
    name,
    color,
    created_at: Date.now()
  };

  allTags.push(newTag);
  localStorage.setItem('notion_tags', JSON.stringify(allTags));

  renderTagList();
  nameInput.value = '';
  colorInput.value = '#808080';
  showToast('Tag created', 'success');
}

function deleteTag(tagId) {
  if (!confirm('Delete this tag? It will be removed from all pages.')) {
    return;
  }

  allTags = allTags.filter(t => t.id !== tagId);
  localStorage.setItem('notion_tags', JSON.stringify(allTags));

  // Remove from all pages
  const stored = localStorage.getItem('notion_pages');
  const allPages = stored ? JSON.parse(stored) : [];
  allPages.forEach(page => {
    if (page.tags) {
      page.tags = page.tags.filter(t => t.id !== tagId);
    }
  });
  localStorage.setItem('notion_pages', JSON.stringify(allPages));

  if (currentPage && currentPage.tags) {
    currentPage.tags = currentPage.tags.filter(t => t.id !== tagId);
  }

  renderTagList();
  renderPageTags();
  showToast('Tag deleted', 'success');
}

function togglePageTag(tagId) {
  if (!currentPage) return;

  const tag = allTags.find(t => t.id === tagId);
  if (!tag) return;

  const currentTags = currentPage.tags || [];
  const isAssigned = currentTags.some(t => t.id === tagId);

  if (isAssigned) {
    currentPage.tags = currentTags.filter(t => t.id !== tagId);
  } else {
    currentPage.tags = [...currentTags, tag];
  }

  const stored = localStorage.getItem('notion_pages');
  const allPages = stored ? JSON.parse(stored) : [];
  const index = allPages.findIndex(p => p.id === currentPage.id);
  if (index !== -1) {
    allPages[index] = currentPage;
    localStorage.setItem('notion_pages', JSON.stringify(allPages));
  }

  renderTagList();
  renderPageTags();
  showToast(isAssigned ? 'Tag removed' : 'Tag added', 'success');
}

function renderPageTags() {
  const container = document.getElementById('tagsContainer');

  if (!currentPage || !currentPage.tags || currentPage.tags.length === 0) {
    container.innerHTML = `
      <button class="tag-add-btn" id="btnAddTag">
        <i class="fas fa-plus"></i> Add Tag
      </button>
    `;
    document.getElementById('btnAddTag').addEventListener('click', showTagModal);
    return;
  }

  const tagsHTML = currentPage.tags.map(tag => `
    <span class="tag" style="background-color: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40;">
      ${escapeHtml(tag.name)}
      <button class="tag-remove" onclick="togglePageTag('${tag.id}')" title="Remove tag">
        <i class="fas fa-times"></i>
      </button>
    </span>
  `).join('');

  container.innerHTML = `
    ${tagsHTML}
    <button class="tag-add-btn" id="btnAddTag">
      <i class="fas fa-plus"></i>
    </button>
  `;

  document.getElementById('btnAddTag').addEventListener('click', showTagModal);
}

// ===== TEMPLATE MANAGEMENT =====

function toggleTemplate() {
  if (!currentPage) return;

  const newStatus = !currentPage.is_template;
  currentPage.is_template = newStatus;

  const stored = localStorage.getItem('notion_pages');
  const allPages = stored ? JSON.parse(stored) : [];
  const index = allPages.findIndex(p => p.id === currentPage.id);
  if (index !== -1) {
    allPages[index] = currentPage;
    localStorage.setItem('notion_pages', JSON.stringify(allPages));
  }

  const templateBtn = document.getElementById('templateBtnText');
  templateBtn.textContent = newStatus ? 'Remove from Templates' : 'Save as Template';

  loadPages();
  showToast(newStatus ? 'Saved as template' : 'Removed from templates', 'success');
}

function renderTemplatesList(allPages) {
  const templates = allPages.filter(p => p.is_template);
  const container = document.getElementById('templatesList');
  const section = document.getElementById('templatesSection');
  const badge = document.getElementById('templateCount');

  badge.textContent = templates.length;

  if (templates.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  container.innerHTML = templates.map(template => `
    <div class="template-item" data-page-id="${template.id}" onclick="loadPage('${template.id}')">
      <i class="fas fa-bookmark template-icon"></i>
      <span>${escapeHtml(template.title)}</span>
    </div>
  `).join('');
}

// ===== VERSION HISTORY =====

function saveVersion(pageId, title, content) {
  const stored = localStorage.getItem('notion_versions');
  const versions = stored ? JSON.parse(stored) : [];

  const version = {
    id: generateId(),
    page_id: pageId,
    title,
    content,
    created_at: Date.now()
  };

  versions.push(version);
  localStorage.setItem('notion_versions', JSON.stringify(versions));
}

function showVersionsModal() {
  if (!currentPage) return;

  const modal = document.getElementById('versionsModal');
  const listContainer = document.getElementById('versionList');

  const stored = localStorage.getItem('notion_versions');
  const allVersions = stored ? JSON.parse(stored) : [];
  const versions = allVersions.filter(v => v.page_id === currentPage.id);

  if (versions.length === 0) {
    listContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No previous versions</p>';
  } else {
    listContainer.innerHTML = versions.reverse().map(version => {
      const date = new Date(version.created_at);
      return `
        <div class="version-item">
          <div class="version-info">
            <div class="version-title">${escapeHtml(version.title)}</div>
            <div class="version-date">${date.toLocaleString()}</div>
          </div>
          <button class="btn-secondary" onclick="restoreVersion('${version.id}')">
            <i class="fas fa-undo"></i> Restore
          </button>
        </div>
      `;
    }).join('');
  }

  modal.classList.add('show');
}

function hideVersionsModal() {
  document.getElementById('versionsModal').classList.remove('show');
}

function restoreVersion(versionId) {
  if (!currentPage) return;

  if (!confirm('Restore this version? Your current changes will be saved as a new version.')) {
    return;
  }

  const stored = localStorage.getItem('notion_versions');
  const allVersions = stored ? JSON.parse(stored) : [];
  const version = allVersions.find(v => v.id === versionId);

  if (version) {
    // Save current state as version first
    saveVersion(currentPage.id, currentPage.title, currentPage.content);

    // Restore version
    currentPage.title = version.title;
    currentPage.content = version.content;
    currentPage.updated_at = Date.now();

    const storedPages = localStorage.getItem('notion_pages');
    const allPages = storedPages ? JSON.parse(storedPages) : [];
    const index = allPages.findIndex(p => p.id === currentPage.id);
    if (index !== -1) {
      allPages[index] = currentPage;
      localStorage.setItem('notion_pages', JSON.stringify(allPages));
    }

    // Update UI
    document.getElementById('pageTitle').value = currentPage.title;
    quill.root.innerHTML = currentPage.content || '';

    hideVersionsModal();
    showToast('Version restored', 'success');
  }
}

// ===== FILTER MANAGEMENT =====

function toggleFilterMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('filterMenu');
  menu.classList.toggle('show');
}

function setFilter(filter) {
  currentFilter = filter;
  currentTagFilter = null;

  const filterText = document.getElementById('filterText');
  document.querySelectorAll('.filter-menu-item').forEach(item => {
    item.classList.remove('active');
  });

  if (filter === 'all') {
    filterText.textContent = 'All Pages';
    document.querySelector('[data-filter="all"]').classList.add('active');
  } else if (filter === 'templates') {
    filterText.textContent = 'Templates Only';
    document.querySelector('[data-filter="templates"]').classList.add('active');
  }

  document.getElementById('filterMenu').classList.remove('show');
  loadPages();
}

function showTagFilterMenu() {
  if (allTags.length === 0) {
    showToast('No tags available. Create tags first!', 'info');
    return;
  }

  const tagItem = document.getElementById('filterByTagItem');

  const submenu = document.createElement('div');
  submenu.className = 'filter-submenu';
  submenu.innerHTML = allTags.map(tag => `
    <div class="filter-menu-item" onclick="setTagFilter('${tag.id}', '${escapeHtml(tag.name)}')">
      <span class="tag" style="background-color: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40;">
        ${escapeHtml(tag.name)}
      </span>
    </div>
  `).join('');

  const existing = tagItem.querySelector('.filter-submenu');
  if (existing) {
    existing.remove();
  } else {
    tagItem.appendChild(submenu);
  }
}

function setTagFilter(tagId, tagName) {
  currentFilter = 'tag';
  currentTagFilter = tagName;

  const filterText = document.getElementById('filterText');
  filterText.textContent = `Tag: ${tagName}`;

  document.getElementById('filterMenu').classList.remove('show');
  loadPages();
}

// Update last edited every minute
setInterval(() => {
  if (currentPage) {
    updateLastEdited();
  }
}, 60000);
