// API Base URL
const API_URL = 'http://localhost:3000/api';

// State
let pages = [];
let currentPage = null;
let quill = null;
let saveTimeout = null;
let selectedMoveParent = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeEditor();
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

  // Move modal
  document.getElementById('closeMoveModal').addEventListener('click', hideMoveModal);
  document.getElementById('cancelMove').addEventListener('click', hideMoveModal);
  document.getElementById('confirmMove').addEventListener('click', confirmMove);

  // Search
  document.getElementById('searchInput').addEventListener('input', handleSearch);

  // Sidebar toggle
  document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);

  // Close modal on background click
  document.getElementById('moveModal').addEventListener('click', (e) => {
    if (e.target.id === 'moveModal') {
      hideMoveModal();
    }
  });
}

// Load all pages from API
async function loadPages() {
  try {
    showLoading(true);
    const response = await fetch(`${API_URL}/pages`);
    const data = await response.json();
    pages = data.pages;

    renderPagesList();

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

// Update last edited every minute
setInterval(() => {
  if (currentPage) {
    updateLastEdited();
  }
}, 60000);
