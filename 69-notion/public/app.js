// API Base URL
const API_URL = 'http://localhost:3000/api';

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
  initializeEditor();
  loadTheme();
  loadTags();
  loadPages();
  setupEventListeners();
});

// Initialize Quill Editor
function initializeEditor() {
  const toolbarOptions = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ];

  quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Start writing...',
    modules: {
      toolbar: toolbarOptions
    }
  });

  // Custom image handler
  quill.getModule('toolbar').addHandler('image', handleImageUpload);

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
    if (e.target.id === 'moveModal') {
      hideMoveModal();
    }
  });

  document.getElementById('tagModal').addEventListener('click', (e) => {
    if (e.target.id === 'tagModal') {
      hideTagModal();
    }
  });

  document.getElementById('versionsModal').addEventListener('click', (e) => {
    if (e.target.id === 'versionsModal') {
      hideVersionsModal();
    }
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

// Load all pages from API
async function loadPages() {
  try {
    showLoading(true);

    // Build query string based on current filter
    let url = `${API_URL}/pages`;
    const params = new URLSearchParams();

    if (currentFilter === 'templates') {
      params.append('template', 'true');
    } else if (currentFilter === 'tag' && currentTagFilter) {
      params.append('tag', currentTagFilter);
    }

    if (params.toString()) {
      url += '?' + params.toString();
    }

    const response = await fetch(url);
    const data = await response.json();
    pages = data.pages;

    renderPagesList();
    renderTemplatesList();

    // Load first page if exists
    if (pages.length > 0 && !currentPage) {
      loadPage(pages[0].id);
    } else if (pages.length === 0) {
      showWelcomeScreen();
    }

    showLoading(false);
  } catch (error) {
    console.error('Error loading pages:', error);
    showToast('Failed to load pages', 'error');
    showLoading(false);
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
      const icon = toggle.querySelector('i');

      children.classList.toggle('collapsed');
      toggle.classList.toggle('collapsed');
    });
  }

  return div;
}

// Load specific page
async function loadPage(pageId) {
  try {
    const response = await fetch(`${API_URL}/pages/${pageId}`);
    const data = await response.json();
    currentPage = data.page;

    // Update UI
    document.getElementById('pageTitle').value = currentPage.title;
    quill.root.innerHTML = currentPage.content || '';
    updateLastEdited();

    // Update cover and icon
    const coverImg = document.getElementById('pageCover');
    const iconLarge = document.getElementById('pageIconLarge');

    if (currentPage.cover_image) {
      coverImg.src = currentPage.cover_image;
      coverImg.style.display = 'block';
    } else {
      coverImg.style.display = 'none';
    }

    if (currentPage.icon) {
      iconLarge.textContent = currentPage.icon;
      iconLarge.style.display = 'block';
    } else {
      iconLarge.style.display = 'none';
    }

    // Update template button
    const templateBtn = document.getElementById('templateBtnText');
    if (currentPage.is_template) {
      templateBtn.textContent = 'Remove from Templates';
    } else {
      templateBtn.textContent = 'Save as Template';
    }

    // Render tags
    renderPageTags();

    // Show editor, hide welcome
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('editorContainer').style.display = 'flex';

    // Update sidebar
    updateActivePage();

  } catch (error) {
    console.error('Error loading page:', error);
    showToast('Failed to load page', 'error');
  }
}

// Create new page
async function createNewPage() {
  try {
    const response = await fetch(`${API_URL}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Untitled',
        content: ''
      })
    });

    const data = await response.json();
    pages.push(data.page);
    renderPagesList();
    loadPage(data.page.id);
    showToast('Page created', 'success');
  } catch (error) {
    console.error('Error creating page:', error);
    showToast('Failed to create page', 'error');
  }
}

// Save current page
async function savePage() {
  if (!currentPage) return;

  try {
    const content = quill.root.innerHTML;
    const title = document.getElementById('pageTitle').value;

    await fetch(`${API_URL}/pages/${currentPage.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });

    currentPage.title = title;
    currentPage.content = content;
    currentPage.updated_at = Date.now();

    updatePageInSidebar(currentPage);
    updateLastEdited();
  } catch (error) {
    console.error('Error saving page:', error);
    showToast('Failed to save page', 'error');
  }
}

// Debounced save
function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(savePage, 1000);
}

// Duplicate current page
async function duplicateCurrentPage() {
  if (!currentPage) return;

  try {
    const response = await fetch(`${API_URL}/pages/${currentPage.id}/duplicate`, {
      method: 'POST'
    });

    const data = await response.json();
    pages.push(data.page);
    renderPagesList();
    loadPage(data.page.id);
    showToast('Page duplicated', 'success');
  } catch (error) {
    console.error('Error duplicating page:', error);
    showToast('Failed to duplicate page', 'error');
  }
}

// Delete current page
async function deleteCurrentPage() {
  if (!currentPage) return;

  if (!confirm(`Are you sure you want to delete "${currentPage.title}"? This will also delete any child pages.`)) {
    return;
  }

  try {
    await fetch(`${API_URL}/pages/${currentPage.id}`, {
      method: 'DELETE'
    });

    // Remove from pages array
    pages = pages.filter(p => p.id !== currentPage.id && p.parent_id !== currentPage.id);

    // Load another page or show welcome
    if (pages.length > 0) {
      loadPage(pages[0].id);
    } else {
      currentPage = null;
      showWelcomeScreen();
    }

    renderPagesList();
    showToast('Page deleted', 'success');
  } catch (error) {
    console.error('Error deleting page:', error);
    showToast('Failed to delete page', 'error');
  }
}

// Show move modal
function showMoveModal() {
  if (!currentPage) return;

  const modal = document.getElementById('moveModal');
  const listContainer = document.getElementById('movePagesList');

  // Build page list excluding current page and its children
  const validPages = pages.filter(p => {
    if (p.id === currentPage.id) return false;
    // Check if it's a child of current page
    let parent = pages.find(pp => pp.id === p.parent_id);
    while (parent) {
      if (parent.id === currentPage.id) return false;
      parent = pages.find(pp => pp.id === parent.parent_id);
    }
    return true;
  });

  listContainer.innerHTML = validPages.map(p => `
    <div class="move-option" data-parent="${p.id}">
      <i class="fas fa-file-alt"></i>
      <span>${escapeHtml(p.title)}</span>
    </div>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.move-option').forEach(opt => {
    opt.addEventListener('click', function() {
      document.querySelectorAll('.move-option').forEach(o => o.classList.remove('selected'));
      this.classList.add('selected');
      selectedMoveParent = this.dataset.parent;
    });
  });

  // Select current parent
  selectedMoveParent = currentPage.parent_id || 'null';
  const currentOption = listContainer.querySelector(`[data-parent="${selectedMoveParent}"]`);
  if (currentOption) {
    currentOption.classList.add('selected');
  } else {
    document.querySelector('[data-parent="null"]').classList.add('selected');
  }

  modal.classList.add('show');
}

// Hide move modal
function hideMoveModal() {
  document.getElementById('moveModal').classList.remove('show');
  selectedMoveParent = null;
}

// Confirm move
async function confirmMove() {
  if (!currentPage || selectedMoveParent === undefined) return;

  try {
    const parentId = selectedMoveParent === 'null' ? null : selectedMoveParent;

    await fetch(`${API_URL}/pages/${currentPage.id}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent_id: parentId,
        position: 0
      })
    });

    // Reload pages
    await loadPages();
    showToast('Page moved', 'success');
    hideMoveModal();
  } catch (error) {
    console.error('Error moving page:', error);
    showToast('Failed to move page', 'error');
  }
}

// Initialize drag and drop
function initDragAndDrop() {
  const pagesList = document.getElementById('pagesList');

  new Sortable(pagesList, {
    animation: 150,
    handle: '.page-item',
    draggable: '.page-group',
    ghostClass: 'dragging',
    onEnd: async function(evt) {
      const pageId = evt.item.dataset.pageId;
      const newPosition = evt.newIndex;

      try {
        await fetch(`${API_URL}/pages/${pageId}/move`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parent_id: null,
            position: newPosition
          })
        });

        await loadPages();
      } catch (error) {
        console.error('Error reordering page:', error);
        showToast('Failed to reorder page', 'error');
        loadPages(); // Reload to reset
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

// Show/hide loading
function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
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

// Load theme from preferences
async function loadTheme() {
  try {
    const response = await fetch(`${API_URL}/preferences`);
    const data = await response.json();
    const theme = data.preferences.theme || 'light';
    applyTheme(theme);
  } catch (error) {
    console.error('Error loading theme:', error);
    applyTheme('light');
  }
}

// Apply theme
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

// Toggle theme
async function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  applyTheme(newTheme);

  try {
    await fetch(`${API_URL}/preferences/theme`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: newTheme })
    });
  } catch (error) {
    console.error('Error saving theme:', error);
    showToast('Failed to save theme preference', 'error');
  }
}

// ===== IMAGE UPLOAD =====

// Handle image upload
function handleImageUpload() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be less than 10MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      showLoading(true);
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.url) {
        // Insert image into editor
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', `http://localhost:3000${data.url}`);
        quill.setSelection(range.index + 1);
        showToast('Image uploaded', 'success');
      }

      showLoading(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Failed to upload image', 'error');
      showLoading(false);
    }
  };

  input.click();
}

// ===== EXPORT FUNCTIONS =====

// Toggle export menu
function toggleExportMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('exportMenu');
  menu.classList.toggle('show');
}

// Export as Markdown
function exportAsMarkdown() {
  if (!currentPage) return;
  window.location.href = `${API_URL}/pages/${currentPage.id}/export/markdown`;
  document.getElementById('exportMenu').classList.remove('show');
}

// Export as HTML
function exportAsHTML() {
  if (!currentPage) return;
  window.location.href = `${API_URL}/pages/${currentPage.id}/export/html`;
  document.getElementById('exportMenu').classList.remove('show');
}

// ===== TAG MANAGEMENT =====

// Load all tags
async function loadTags() {
  try {
    const response = await fetch(`${API_URL}/tags`);
    const data = await response.json();
    allTags = data.tags;
  } catch (error) {
    console.error('Error loading tags:', error);
  }
}

// Show tag modal
function showTagModal() {
  const modal = document.getElementById('tagModal');
  renderTagList();
  modal.classList.add('show');
}

// Hide tag modal
function hideTagModal() {
  document.getElementById('tagModal').classList.remove('show');
}

// Render tag list in modal
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

// Create new tag
async function createTag() {
  const nameInput = document.getElementById('newTagName');
  const colorInput = document.getElementById('newTagColor');
  const name = nameInput.value.trim();
  const color = colorInput.value;

  if (!name) {
    showToast('Tag name is required', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });

    const data = await response.json();
    allTags.push(data.tag);
    renderTagList();
    nameInput.value = '';
    colorInput.value = '#808080';
    showToast('Tag created', 'success');
  } catch (error) {
    console.error('Error creating tag:', error);
    showToast('Failed to create tag', 'error');
  }
}

// Delete tag
async function deleteTag(tagId) {
  if (!confirm('Delete this tag? It will be removed from all pages.')) {
    return;
  }

  try {
    await fetch(`${API_URL}/tags/${tagId}`, {
      method: 'DELETE'
    });

    allTags = allTags.filter(t => t.id !== tagId);
    if (currentPage && currentPage.tags) {
      currentPage.tags = currentPage.tags.filter(t => t.id !== tagId);
    }

    renderTagList();
    renderPageTags();
    showToast('Tag deleted', 'success');
  } catch (error) {
    console.error('Error deleting tag:', error);
    showToast('Failed to delete tag', 'error');
  }
}

// Toggle tag on current page
async function togglePageTag(tagId) {
  if (!currentPage) return;

  const currentTags = currentPage.tags || [];
  const isAssigned = currentTags.some(t => t.id === tagId);

  let newTags;
  if (isAssigned) {
    newTags = currentTags.filter(t => t.id !== tagId).map(t => t.id);
  } else {
    newTags = [...currentTags.map(t => t.id), tagId];
  }

  try {
    const response = await fetch(`${API_URL}/pages/${currentPage.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: currentPage.title,
        content: currentPage.content,
        tags: newTags
      })
    });

    const data = await response.json();
    currentPage = data.page;
    renderTagList();
    renderPageTags();
    showToast(isAssigned ? 'Tag removed' : 'Tag added', 'success');
  } catch (error) {
    console.error('Error updating tags:', error);
    showToast('Failed to update tags', 'error');
  }
}

// Render page tags
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

// Toggle template status
async function toggleTemplate() {
  if (!currentPage) return;

  const newStatus = !currentPage.is_template;

  try {
    const response = await fetch(`${API_URL}/pages/${currentPage.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: currentPage.title,
        content: currentPage.content,
        is_template: newStatus
      })
    });

    const data = await response.json();
    currentPage = data.page;

    const templateBtn = document.getElementById('templateBtnText');
    templateBtn.textContent = newStatus ? 'Remove from Templates' : 'Save as Template';

    await loadPages();
    showToast(newStatus ? 'Saved as template' : 'Removed from templates', 'success');
  } catch (error) {
    console.error('Error updating template status:', error);
    showToast('Failed to update template status', 'error');
  }
}

// Render templates list
function renderTemplatesList() {
  const templates = pages.filter(p => p.is_template);
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

// Show version history modal
async function showVersionsModal() {
  if (!currentPage) return;

  const modal = document.getElementById('versionsModal');
  const listContainer = document.getElementById('versionList');

  try {
    const response = await fetch(`${API_URL}/pages/${currentPage.id}/versions`);
    const data = await response.json();
    const versions = data.versions;

    if (versions.length === 0) {
      listContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No previous versions</p>';
    } else {
      listContainer.innerHTML = versions.map(version => {
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
  } catch (error) {
    console.error('Error loading versions:', error);
    showToast('Failed to load version history', 'error');
  }
}

// Hide version history modal
function hideVersionsModal() {
  document.getElementById('versionsModal').classList.remove('show');
}

// Restore version
async function restoreVersion(versionId) {
  if (!currentPage) return;

  if (!confirm('Restore this version? Your current changes will be saved as a new version.')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/pages/${currentPage.id}/restore/${versionId}`, {
      method: 'POST'
    });

    const data = await response.json();
    currentPage = data.page;

    // Update UI
    document.getElementById('pageTitle').value = currentPage.title;
    quill.root.innerHTML = currentPage.content || '';

    hideVersionsModal();
    showToast('Version restored', 'success');
  } catch (error) {
    console.error('Error restoring version:', error);
    showToast('Failed to restore version', 'error');
  }
}

// ===== FILTER MANAGEMENT =====

// Toggle filter menu
function toggleFilterMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('filterMenu');
  menu.classList.toggle('show');
}

// Set filter
function setFilter(filter) {
  currentFilter = filter;
  currentTagFilter = null;

  // Update UI
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

// Show tag filter submenu
function showTagFilterMenu() {
  if (allTags.length === 0) {
    showToast('No tags available. Create tags first!', 'info');
    return;
  }

  const menu = document.getElementById('filterMenu');
  const tagItem = document.getElementById('filterByTagItem');

  // Create submenu
  const submenu = document.createElement('div');
  submenu.className = 'filter-submenu';
  submenu.innerHTML = allTags.map(tag => `
    <div class="filter-menu-item" onclick="setTagFilter('${tag.id}', '${escapeHtml(tag.name)}')">
      <span class="tag" style="background-color: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40;">
        ${escapeHtml(tag.name)}
      </span>
    </div>
  `).join('');

  // Remove existing submenu if any
  const existing = tagItem.querySelector('.filter-submenu');
  if (existing) {
    existing.remove();
  } else {
    tagItem.appendChild(submenu);
  }
}

// Set tag filter
function setTagFilter(tagId, tagName) {
  currentFilter = 'tag';
  currentTagFilter = tagName;

  // Update UI
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
