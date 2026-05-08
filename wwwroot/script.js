// ─── STATE ───────────────────────────────────────────────
let allModels = [];
let filteredModels = [];
let cart = JSON.parse(localStorage.getItem('ms_cart') || '[]');
let visibleCount = 12;
const PAGE_SIZE = 12;

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    fetchMenus();
    fetchCategories();
    fetchModels();
    renderCartBadge();
    initUserAuth();
});

function initUserAuth() {
    const userStr = localStorage.getItem('user');
    const userAuthIcon = document.getElementById('userAuthIcon');
    const userDropdown = document.getElementById('userDropdown');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userGreeting = document.getElementById('userGreeting');
    const userMenuContainer = document.getElementById('userMenuContainer');

    if (userStr && userAuthIcon && userMenuContainer) {
        try {
            const user = JSON.parse(userStr);
            if (user && user.fullName) {
                const initial = user.fullName.charAt(0).toUpperCase();
                userAuthIcon.innerHTML = `<span style="font-weight:800; font-size:1.1rem; color:var(--gold); display:flex; align-items:center; justify-content:center; width:100%; height:100%;">${initial}</span>`;
                userAuthIcon.href = "javascript:void(0)";
                
                if(userGreeting && userNameDisplay) {
                    userGreeting.style.display = 'block';
                    userNameDisplay.innerText = user.fullName;
                }
                
                userMenuContainer.onclick = (e) => {
                    // Chỉ toggle dropdown nếu click vào icon hoặc tên, không phải các link bên trong dropdown
                    if (!userDropdown.contains(e.target)) {
                        e.preventDefault();
                        e.stopPropagation();
                        userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
                    }
                };
                
                document.addEventListener('click', (e) => {
                    if (!userMenuContainer.contains(e.target)) {
                        if(userDropdown) userDropdown.style.display = 'none';
                    }
                });
            }
        } catch(e) {
            console.error("Invalid user data in localStorage");
        }
    }
}

function handleLogout() {
    localStorage.removeItem('user');
    window.location.reload();
}

async function fetchCategories() {
    try {
        const res = await fetch('/api/settings/categories');
        if (res.ok) {
            const categories = await res.json();
            const container = document.getElementById('homeCategoriesContainer');
            if (container && categories.length > 0) {
                container.innerHTML = categories.map(c => `
                    <div class="cat-banner-item" onclick="filterCategory('${c.filterValue}')">
                        <img src="${c.image}" alt="${c.title}">
                        <div class="cat-overlay">
                            <h3>${c.title}</h3>
                            <i class="fas fa-arrow-right"></i>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (e) {
        console.error("Error loading categories", e);
    }
}

async function fetchMenus() {
    try {
        const res = await fetch('/api/settings/menus');
        if (!res.ok) return;
        const menus = await res.json();
        const navUl = document.getElementById('dynamicNavLinks');
        if (!navUl || !menus.length) return;

        navUl.innerHTML = menus.map((m, i) => {
            const isFirst = i === 0;
            const filterId = m.id.replace('mo-hinh-', ''); // e.g., 'pvc' or 'resin' or 'trang-chu' (-> 'trang-chu')
            const catArg = filterId === 'trang-chu' ? 'all' : filterId;
            
            if (m.hasDropdown && m.items && m.items.length > 0) {
                return `
                    <li class="has-dropdown">
                        <a href="${m.href}" ${isFirst ? 'class="active"' : ''} onclick="filterCategory('${catArg}', this, '', '${m.href}')">${m.label} <i class="fas fa-caret-down"></i></a>
                        <ul class="dropdown-menu">
                            ${m.items.map(item => {
                                if (typeof item === 'object') {
                                    return `<li><a href="${item.href}" target="_blank"><i class="${item.icon || 'fas fa-link'}"></i> ${item.label}</a></li>`;
                                }
                                return `<li><a href="#" onclick="filterCategory('${catArg}', this, '${item}', '#')">${item}</a></li>`;
                            }).join('')}
                        </ul>
                    </li>`;
            }
            return `<li><a href="${m.href}" ${isFirst ? 'class="active"' : ''} onclick="filterCategory('${catArg}', this, '', '${m.href}')">${m.label}</a></li>`;
        }).join('');
    } catch (e) {
        console.error("Error loading menus", e);
    }
}

// ─── FETCH ALL MODELS ─────────────────────────────────────
async function fetchModels() {
    renderSkeletons();
    try {
        const res = await fetch('/api/models');
        if (!res.ok) throw new Error('API error');
        allModels = await res.json();
        filteredModels = [...allModels];
        
        const statTotal = document.getElementById('statTotal');
        if (statTotal) statTotal.textContent = allModels.length;
        
        renderProducts();
    } catch (e) {
        console.error("fetchModels error:", e);
        const grid = document.getElementById('productGrid');
        if (grid) {
            grid.innerHTML =
                `<p style="grid-column:1/-1;text-align:center;color:#e74c3c;padding:3rem">
                    <i class="fas fa-exclamation-triangle"></i> Không thể tải dữ liệu. Vui lòng thử lại.
                </p>`;
        }
    }
}

// ─── RENDER ───────────────────────────────────────────────
function renderProducts() {
    renderHomeSections();

    const grid = document.getElementById('productGrid');
    const count = document.getElementById('sectionCount');
    const wrap = document.getElementById('loadMoreWrap');

    if (!grid) return; // Exit if main grid is missing

    if (filteredModels.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#888;padding:3rem">Không tìm thấy sản phẩm nào.</p>`;
        if (count) count.textContent = '0 sản phẩm';
        if (wrap) wrap.style.display = 'none';
        return;
    }

    const toShow = filteredModels.slice(0, visibleCount);
    if (count) count.textContent = `${filteredModels.length} sản phẩm`;
    grid.innerHTML = toShow.map(m => cardHTML(m)).join('');
    if (wrap) wrap.style.display = filteredModels.length > visibleCount ? 'block' : 'none';
}

function renderHomeSections() {
    const newGrid = document.getElementById('newProductsGrid');
    const saleGrid = document.getElementById('saleProductsGrid');
    const bestGrid = document.getElementById('bestSellingGrid');

    if (newGrid) {
        let newModels = allModels.filter(m => m.isFeatured);
        if (newModels.length === 0) newModels = allModels.slice(0, 4); // Fallback
        newGrid.innerHTML = newModels.slice(0, 4).map(m => cardHTML(m)).join('');
    }

    if (saleGrid) {
        let saleModels = allModels.filter(m => m.isOnSale);
        if (saleModels.length === 0) saleModels = allModels.slice(4, 8); // Fallback
        saleGrid.innerHTML = saleModels.slice(0, 4).map(m => cardHTML(m)).join('');
    }

    if (bestGrid) {
        // Mock best selling logic (e.g. items with highest stock or highest price, or just a slice)
        let bestModels = [...allModels].sort((a, b) => b.price - a.price); // Fallback to highest price
        bestGrid.innerHTML = bestModels.slice(0, 4).map(m => cardHTML(m)).join('');
    }
}

function cardHTML(m) {
    const price = formatVND(m.price);
    const img = m.imageUrl || 'images/product1.png';
    const badgeHtml = m.isFeatured
        ? `<div class="badge featured">Featured</div>`
        : m.isOnSale ? `<div class="badge sale">Sale</div>` : '';
    const stockWarn = m.stock <= 3 ? `<p class="stock-low"><i class="fas fa-fire"></i> Còn ${m.stock} sản phẩm</p>` : '';

    return `
        <div class="product-card" onclick="openModal(${m.id})">
            <div class="card-image">
                <img src="${img}" alt="${m.name}" onerror="this.src='images/product1.png'">
                ${badgeHtml}
            </div>
            <div class="card-info">
                <h3>${m.name}</h3>
                <p class="brand">${m.brand}</p>
                <div class="card-bottom">
                    <span class="card-price">${price}</span>
                    <button class="btn-add" onclick="event.stopPropagation(); addToCart(${m.id})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                ${stockWarn}
            </div>
        </div>`;
}

function renderSkeletons() {
    document.getElementById('productGrid').innerHTML = Array(8).fill(`
        <div class="skeleton-card">
            <div class="skel-img"></div>
            <div class="skel-body">
                <div class="skel-line w80"></div>
                <div class="skel-line w50"></div>
                <div class="skel-line w40"></div>
            </div>
        </div>`).join('');
}

// ─── FILTER & SEARCH ──────────────────────────────────────
function filterCategory(cat, el, series = '', href = '#') {
    // Nếu href dẫn đến một trang .html thực tế (không phải # và không phải index.html), 
    // chúng ta cho phép chuyển trang bình thường mà không can thiệp JS.
    if (href !== '#' && href !== 'index.html' && href.endsWith('.html')) {
        return;
    }

    if (event) {
        // Chỉ chặn mặc định nếu là link filter (#) hoặc đang ở trang chủ và link là index.html
        const currentPath = window.location.pathname;
        const isHomePage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '';
        
        if (href === '#' || (href === 'index.html' && isHomePage)) {
            event.preventDefault();
        } else if (href === 'index.html' && !isHomePage) {
            // Nếu đang ở trang khác và bấm về Trang chủ, cứ để nó chuyển trang bình thường
            return;
        }
    }

    // Xóa active khỏi tất cả nav link
    document.querySelectorAll('.nav-links > li > a').forEach(a => a.classList.remove('active'));

    // Tìm thẻ <a> cấp cao nhất của li chứa element được click
    if (el) {
        const topLink = el.closest('.nav-links > li')?.querySelector(':scope > a');
        if (topLink) topLink.classList.add('active');
    }

    const titleMap = { 
        all: 'Tất Cả', 
        pvc: 'Mô Hình PVC', 
        resin: 'Mô Hình Resin',
        gundam: 'Gundam', 
        'xe-co': 'Xe Cô', 
        anime: 'Anime Figures', 
        figure: 'Figures' 
    };
    
    let displayTitle = titleMap[cat] || 'Sản Phẩm';
    if (series) displayTitle += ` - ${series}`;
    document.getElementById('sectionTitle').textContent = displayTitle;
    
    document.getElementById('searchInput').value = '';
    visibleCount = PAGE_SIZE;

    if (cat === 'all') {
        filteredModels = [...allModels];
    } else {
        filteredModels = allModels.filter(m => m.category === cat);
        if (series) {
            filteredModels = filteredModels.filter(m => m.series === series);
        }
    }
    
    renderProducts();
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

let searchTimer;
function handleSearch(q) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        visibleCount = PAGE_SIZE;
        filteredModels = allModels.filter(m =>
            m.name.toLowerCase().includes(q.toLowerCase()) ||
            m.brand.toLowerCase().includes(q.toLowerCase())
        );
        document.getElementById('sectionTitle').textContent = q ? `"${q}"` : 'Tất Cả';
        renderProducts();
    }, 300);
}

function handleSort(val) {
    visibleCount = PAGE_SIZE;
    if (val === 'price-asc') filteredModels.sort((a, b) => a.price - b.price);
    else if (val === 'price-desc') filteredModels.sort((a, b) => b.price - a.price);
    else if (val === 'name-asc') filteredModels.sort((a, b) => a.name.localeCompare(b.name));
    else filteredModels = allModels.filter(m => filteredModels.find(f => f.id === m.id)); // preserve filter
    renderProducts();
}

function loadMore() {
    visibleCount += PAGE_SIZE;
    renderProducts();
}

// ─── CART ─────────────────────────────────────────────────
function addToCart(modelId) {
    const model = allModels.find(m => m.id === modelId);
    if (!model) return;
    const existing = cart.find(c => c.id === modelId);
    if (existing) existing.qty++;
    else cart.push({ id: modelId, name: model.name, price: model.price, img: model.imageUrl || 'images/product1.png', qty: 1 });
    saveCart();
    renderCartBadge();
    showToast(`✅ Đã thêm "${model.name}" vào giỏ hàng`);
}

function addToCartQty(modelId, qty) {
    // Note: on product.html, allModels might be empty, so we must rely on currentModel if allModels is empty.
    let model = null;
    if (typeof allModels !== 'undefined' && allModels.length > 0) {
        model = allModels.find(m => m.id === modelId);
    } 
    if (!model && typeof currentModel !== 'undefined' && currentModel) {
        model = currentModel;
    }
    if (!model) return;

    const existing = cart.find(c => c.id === modelId);
    if (existing) existing.qty += qty;
    else cart.push({ id: modelId, name: model.name, price: model.price, img: model.imageUrl || 'images/product1.png', qty: qty });
    
    saveCart();
    renderCartBadge();
    showToast(`✅ Đã thêm ${qty} "${model.name}" vào giỏ hàng`);
    toggleCart(); // Open cart to show
}

function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    const isOpen = sidebar.classList.contains('open');
    if (!isOpen) renderCartSidebar();
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
}

function renderCartSidebar() {
    const container = document.getElementById('cartItems');
    const footer = document.getElementById('cartFooter');
    if (cart.length === 0) {
        container.innerHTML = `<div class="cart-empty"><i class="fas fa-box-open"></i><p>Giỏ hàng trống</p></div>`;
        footer.style.display = 'none';
        return;
    }
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-img"><img src="${item.img}" alt="${item.name}" onerror="this.src='images/product1.png'"></div>
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="price">${formatVND(item.price)}</div>
                <div class="cart-item-qty">
                    <button onclick="changeQty(${item.id}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty(${item.id}, 1)">+</button>
                </div>
            </div>
        </div>`).join('');
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    document.getElementById('cartTotal').textContent = formatVND(total);
    footer.style.display = 'block';
}

function changeQty(id, delta) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
    saveCart();
    renderCartBadge();
    renderCartSidebar();
}

function saveCart() { localStorage.setItem('ms_cart', JSON.stringify(cart)); }
function renderCartBadge() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    document.getElementById('cartBadge').textContent = total;
}

// ─── PRODUCT MODAL ────────────────────────────────────────
let _modalQty = 1;

async function openModal(id) {
    window.location.href = 'product.html?id=' + id;
}

function mdSwitchTab(btn, tabId) {
    document.querySelectorAll('.md-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.md-tab-content').forEach(c => c.style.display = 'none');
    btn.classList.add('active');
    document.getElementById(tabId).style.display = 'block';
}

function mdChangeQty(delta) {
    _modalQty = Math.max(1, _modalQty + delta);
    document.getElementById('mdQtyVal').textContent = _modalQty;
}

function addToCartQty(modelId, qty, modelData = null) {
    let model = modelData || allModels.find(m => m.id === modelId);
    if (!model) {
        // Nếu không có modelData và allModels chưa tải, ta thử tìm trong cart hoặc bỏ qua
        console.warn("Model not found in allModels, trying to use provided data...");
        return;
    }
    const existing = cart.find(c => c.id === modelId);
    if (existing) existing.qty += qty;
    else cart.push({ id: modelId, name: model.name, price: model.price, img: model.imageUrl || 'images/product1.png', qty });
    saveCart();
    renderCartBadge();
    showToast(`✅ Đã thêm ${qty}x "${model.name}" vào giỏ hàng`);
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('productModal').classList.remove('open');
}

// ─── TOAST ────────────────────────────────────────────────
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── UTILS ────────────────────────────────────────────────
function formatVND(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}
