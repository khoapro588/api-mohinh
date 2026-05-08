// ─── STATE ───────────────────────────────────────────────
let adminModels = [];
let adminUsers = [];
let adminCategories = [];
let adminMenus = [];
let adminOrders = [];

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Check admin auth
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'auth.html';
        return;
    }
    
    const user = JSON.parse(userStr);
    if (user.role !== 'admin' && user.Role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    fetchAdminModels();
    fetchAdminUsers();
    fetchAdminCategories();
    fetchAdminMenus();
    fetchAdminOrders();
});

// ─── TABS ─────────────────────────────────────────────────
function switchTab(tabId, el) {
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    el.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');

    const titles = {
        'dashboard': 'Tổng Quan',
        'products': 'Quản Lý Sản Phẩm',
        'orders': 'Quản Lý Đơn Hàng',
        'users': 'Quản Lý Khách Hàng',
        'categories': 'Danh Mục Trang Chủ',
        'menus': 'Quản Lý Menu Navbar',
        'modelcats': 'Quản Lý Mô Hình PVC & Resin'
    };
    document.getElementById('pageTitle').textContent = titles[tabId] || tabId;
}

// ─── FETCH & RENDER ───────────────────────────────────────
async function fetchAdminModels() {
    try {
        const res = await fetch('/api/models');
        if (!res.ok) throw new Error('API error');
        adminModels = await res.json();
        
        // Update stats
        const dashTotal = document.getElementById('dashTotalProducts');
        if (dashTotal) dashTotal.textContent = adminModels.length;
        
        renderAdminTable();
        fetchDashboardStats();
    } catch (e) {
        showToast('Không thể tải dữ liệu sản phẩm!');
    }
}

async function fetchDashboardStats() {
    try {
        const res = await fetch('/api/orders/stats');
        if (!res.ok) throw new Error();
        const stats = await res.json();
        
        document.getElementById('dashRevenue').textContent = formatVND(stats.totalRevenue);
        document.getElementById('dashOrders').textContent = stats.totalOrders;
        document.getElementById('dashPending').textContent = stats.pendingOrders;
        document.getElementById('dashCustomers').textContent = stats.totalCustomers;
    } catch (e) {
        console.error("Error fetching stats", e);
    }
}

function renderAdminTable() {
    const tbody = document.getElementById('productTableBody');
    const filterCat = document.getElementById('filterCategory').value;
    const searchVal = document.getElementById('searchProduct').value.toLowerCase();

    let filtered = adminModels;
    if (filterCat) filtered = filtered.filter(m => m.category === filterCat);
    if (searchVal) filtered = filtered.filter(m => m.name.toLowerCase().includes(searchVal) || m.brand.toLowerCase().includes(searchVal));

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">Không tìm thấy sản phẩm nào.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(m => {
        let badge = '<span class="badge normal">Bình thường</span>';
        if (m.isFeatured) badge = '<span class="badge featured">Mới Về</span>';
        else if (m.isOnSale) badge = '<span class="badge sale">Sale Bão</span>';

        return `
            <tr>
                <td><img src="${m.imageUrl || 'images/product1.png'}" class="prod-img" onerror="this.src='images/product1.png'"></td>
                <td><strong>${m.name}</strong></td>
                <td style="text-transform: capitalize;">${m.category === 'pvc' ? 'Mô hình PVC' : 'Mô hình Resin'}</td>
                <td>${m.series || m.brand || '---'}</td>
                <td>${formatVND(m.price)}</td>
                <td>${m.stock}</td>
                <td>${badge}</td>
                <td>
                    <button class="action-btn edit" onclick="editProduct(${m.id})" title="Sửa"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteProduct(${m.id})" title="Xóa"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterAdminProducts() {
    renderAdminTable();
}

// ─── CRUD OPERATIONS ──────────────────────────────────────
function openProductModal(isEdit = false) {
    document.getElementById('modalTitle').textContent = isEdit ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới';
    document.getElementById('productModalOverlay').classList.add('open');
    document.getElementById('productModal').classList.add('open');
    if (!isEdit) {
        document.getElementById('productForm').reset();
        document.getElementById('prodId').value = '';
        updateSeriesDropdown();
    }
}

function updateSeriesDropdown(selectedValue = '') {
    const cat = document.getElementById('prodCategory').value;
    const seriesSelect = document.getElementById('prodSeries');
    seriesSelect.innerHTML = '<option value="">-- Chọn series --</option>';
    
    // Find matching items from menu config
    const menuId = cat === 'pvc' ? 'mo-hinh-pvc' : 'mo-hinh-resin';
    const menu = adminMenus.find(m => m.id === menuId);
    
    if (menu && menu.items) {
        menu.items.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item;
            opt.textContent = item;
            if (item === selectedValue) opt.selected = true;
            seriesSelect.appendChild(opt);
        });
    }
}

function closeProductModal() {
    document.getElementById('productModalOverlay').classList.remove('open');
    document.getElementById('productModal').classList.remove('open');
}

function editProduct(id) {
    const p = adminModels.find(m => m.id === id);
    if (!p) return;
    
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodBrand').value = p.brand;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodStock').value = p.stock;
    document.getElementById('prodImage').value = p.imageUrl || '';
    document.getElementById('prodFeatured').checked = p.isFeatured;
    document.getElementById('prodSale').checked = p.isOnSale;

    updateSeriesDropdown(p.series);
    openProductModal(true);
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('prodId').value;
    const isEdit = !!id;

    const payload = {
        name: document.getElementById('prodName').value,
        brand: document.getElementById('prodBrand').value,
        category: document.getElementById('prodCategory').value,
        series: document.getElementById('prodSeries').value,
        price: parseFloat(document.getElementById('prodPrice').value),
        stock: parseInt(document.getElementById('prodStock').value),
        imageUrl: document.getElementById('prodImage').value,
        isFeatured: document.getElementById('prodFeatured').checked,
        isOnSale: document.getElementById('prodSale').checked
    };

    if (isEdit) payload.id = parseInt(id);

    try {
        const url = isEdit ? `/api/models/${id}` : '/api/models';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('API error');
        
        showToast(isEdit ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
        closeProductModal();
        fetchAdminModels(); // Refresh list
    } catch (err) {
        showToast('Lỗi khi lưu sản phẩm!');
    }
});

async function deleteProduct(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) return;
    
    try {
        const res = await fetch(`/api/models/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('API error');
        showToast('Đã xóa sản phẩm!');
        fetchAdminModels();
    } catch (e) {
        showToast('Lỗi khi xóa!');
    }
}

// ─── USER CRUD OPERATIONS ─────────────────────────────────
async function fetchAdminUsers() {
    try {
        const res = await fetch('/api/accounts/users');
        if (!res.ok) throw new Error('API error');
        adminUsers = await res.json();
        renderAdminUsersTable();
    } catch (e) {
        console.error(e);
    }
}

function renderAdminUsersTable() {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    if (adminUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Chưa có người dùng nào.</td></tr>`;
        return;
    }

    tbody.innerHTML = adminUsers.map(u => {
        let roleBadge = u.role === 'admin' 
            ? '<span class="badge featured">Admin</span>' 
            : '<span class="badge normal">Customer</span>';
            
        let date = new Date(u.createdAt).toLocaleDateString('vi-VN');

        return `
            <tr>
                <td>#${u.id}</td>
                <td><strong>${u.fullName}</strong></td>
                <td>${u.email}</td>
                <td>${roleBadge}</td>
                <td>${date}</td>
                <td>
                    <button class="action-btn edit" onclick="editUser(${u.id})" title="Sửa"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteUser(${u.id})" title="Xóa"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function openUserModal(isEdit = false) {
    document.getElementById('userModalTitle').textContent = isEdit ? 'Chỉnh Sửa Người Dùng' : 'Thêm Người Dùng';
    document.getElementById('userModalOverlay').classList.add('open');
    document.getElementById('userModal').classList.add('open');
    if (!isEdit) {
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
    }
}

function closeUserModal() {
    document.getElementById('userModalOverlay').classList.remove('open');
    document.getElementById('userModal').classList.remove('open');
}

function editUser(id) {
    const u = adminUsers.find(x => x.id === id);
    if (!u) return;
    
    document.getElementById('userId').value = u.id;
    document.getElementById('userName').value = u.fullName;
    document.getElementById('userEmail').value = u.email;
    document.getElementById('userPassword').value = ''; // không hiện pass cũ
    document.getElementById('userRole').value = u.role || 'customer';

    openUserModal(true);
}

document.getElementById('userForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('userId').value;
    const isEdit = !!id;

    const payload = {
        fullName: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        role: document.getElementById('userRole').value,
        password: document.getElementById('userPassword').value
    };

    try {
        const url = isEdit ? `/api/accounts/users/${id}` : '/api/accounts/users';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'API error');
        }
        
        showToast(isEdit ? 'Cập nhật user thành công!' : 'Thêm user thành công!');
        closeUserModal();
        fetchAdminUsers(); 
    } catch (err) {
        showToast(err.message || 'Lỗi khi lưu người dùng!');
    }
});

async function deleteUser(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) return;
    
    try {
        const res = await fetch(`/api/accounts/users/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('API error');
        showToast('Đã xóa người dùng!');
        fetchAdminUsers();
    } catch (e) {
        showToast('Lỗi khi xóa!');
    }
}

async function fetchAdminOrders() {
    try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('API error');
        adminOrders = await res.json();
        renderAdminOrdersTable();
    } catch (e) {
        console.error(e);
    }
}

function renderAdminOrdersTable() {
    const tbody = document.getElementById('orderTableBody');
    if (!tbody) return;
    if (adminOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center">Chưa có đơn hàng nào.</td></tr>`;
        return;
    }

    tbody.innerHTML = adminOrders.map(o => {
        const status = o.status || 'Pending';
        const statusClass = status.toLowerCase();
        const date = o.orderDate ? new Date(o.orderDate).toLocaleString('vi-VN') : 'N/A';
        
        // Tạo chuỗi tóm tắt sản phẩm
        const items = o.items || [];
        const itemsSummary = items.map(it => `Model #${it.modelId} (x${it.quantity})`).join(', ') || 'Không có SP';

        return `
            <tr>
                <td>#${o.id}</td>
                <td>ID Khách: ${o.customerId}</td>
                <td>${date}</td>
                <td><strong style="color:var(--gold)">${formatVND(o.totalAmount)}</strong></td>
                <td><small>${itemsSummary}</small></td>
                <td><span class="badge ${statusClass}">${o.status}</span></td>
                <td>
                    <select onchange="updateOrderStatus(${o.id}, this.value)" style="padding:4px; background:var(--bg3); border:1px solid var(--border); color:#fff; border-radius:4px; font-size:0.8rem;">
                        <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Chờ duyệt</option>
                        <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Đang giao</option>
                        <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Đã giao</option>
                        <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Đã hủy</option>
                    </select>
                </td>
            </tr>
        `;
    }).join('');
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStatus)
        });

        if (!res.ok) throw new Error();
        showToast('Cập nhật trạng thái đơn hàng thành công!');
        fetchAdminOrders();
    } catch (e) {
        showToast('Lỗi khi cập nhật trạng thái!');
    }
}

// ─── CATEGORY MANAGEMENT ─────────────────────────────────
async function fetchAdminCategories() {
    try {
        const res = await fetch('/api/settings/categories');
        if (res.ok) {
            adminCategories = await res.json();
            renderCategoriesGrid();
        }
    } catch (e) {
        console.error("Error loading categories", e);
    }
}

function renderCategoriesGrid() {
    const grid = document.getElementById('adminCategoriesGrid');
    if (!grid) return;
    
    grid.innerHTML = adminCategories.map((c, index) => `
        <div class="stat-card" style="display:flex; flex-direction:column; gap:10px;">
            <div style="font-weight:bold; font-size:1.1rem; border-bottom:1px solid #333; padding-bottom:5px; margin-bottom:5px;">
                Cột Danh Mục ${index + 1}
            </div>
            <div class="form-group">
                <label>Tiêu đề hiển thị</label>
                <input type="text" id="catTitle_${index}" value="${c.title}" style="width:100%; padding:0.5rem; background:var(--bg-dark); border:1px solid var(--border); color:#fff; border-radius:4px;">
            </div>
            <div class="form-group">
                <label>URL Hình ảnh</label>
                <input type="text" id="catImage_${index}" value="${c.image}" style="width:100%; padding:0.5rem; background:var(--bg-dark); border:1px solid var(--border); color:#fff; border-radius:4px;">
            </div>
            <div class="form-group">
                <label>Lọc theo khóa</label>
                <input type="text" id="catFilter_${index}" value="${c.filterValue}" style="width:100%; padding:0.5rem; background:var(--bg-dark); border:1px solid var(--border); color:#fff; border-radius:4px;">
            </div>
            <div style="margin-top:10px; border-radius:4px; overflow:hidden; height:100px; position:relative; border:1px solid var(--gold);">
                <img src="${c.image}" style="width:100%; height:100%; object-fit:cover; opacity:0.6;">
                <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.5rem; text-shadow: 2px 2px 4px #000;">
                    ${c.title}
                </div>
            </div>
        </div>
    `).join('');
}

async function saveCategories() {
    const updated = adminCategories.map((c, index) => {
        return {
            id: c.id,
            title: document.getElementById(`catTitle_${index}`).value,
            image: document.getElementById(`catImage_${index}`).value,
            filterValue: document.getElementById(`catFilter_${index}`).value
        };
    });

    try {
        const res = await fetch('/api/settings/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        if (!res.ok) throw new Error('Failed to save categories');
        showToast('Đã lưu thay đổi danh mục!');
        adminCategories = updated;
        renderCategoriesGrid();
    } catch (e) {
        showToast('Lỗi khi lưu danh mục!');
    }
}

// ─── UTILS ────────────────────────────────────────────────
function formatVND(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function showToast(msg) {
    const t = document.getElementById('adminToast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

function exportToWord() {
    if (adminOrders.length === 0) {
        showToast('Không có dữ liệu đơn hàng để xuất!');
        return;
    }

    let header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Báo cáo đơn hàng</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #d4af37; text-align: center; }
        </style>
        </head><body>
        <h1>BÁO CÁO ĐƠN HÀNG MODELSTORE</h1>
        <p>Ngày xuất báo cáo: ${new Date().toLocaleString('vi-VN')}</p>
        <table>
            <thead>
                <tr>
                    <th>Mã ĐH</th>
                    <th>Khách Hàng</th>
                    <th>Ngày Đặt</th>
                    <th>Tổng Tiền</th>
                    <th>Trạng Thái</th>
                </tr>
            </thead>
            <tbody>
    `;

    let rows = adminOrders.map(o => `
        <tr>
            <td>#${o.id}</td>
            <td>ID: ${o.customerId}</td>
            <td>${new Date(o.orderDate).toLocaleString('vi-VN')}</td>
            <td>${formatVND(o.totalAmount)}</td>
            <td>${o.status}</td>
        </tr>
    `).join('');

    let footer = `</tbody></table><br><p style='text-align:right'>Người lập báo cáo: Hệ thống ModelStore Admin</p></body></html>`;
    
    let source = header + rows + footer;
    let blob = new Blob(['\ufeff', source], {
        type: 'application/msword'
    });

    let url = URL.createObjectURL(blob);
    let link = document.createElement('a');
    link.href = url;
    link.download = 'Bao-Cao-Don-Hang.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportUsersToWord() {
    if (adminUsers.length === 0) {
        showToast('Không có dữ liệu người dùng để xuất!');
        return;
    }

    let header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Danh sách người dùng</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #d4af37; text-align: center; }
        </style>
        </head><body>
        <h1>DANH SÁCH NGƯỜI DÙNG MODELSTORE</h1>
        <p>Ngày xuất báo cáo: ${new Date().toLocaleString('vi-VN')}</p>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Họ Tên</th>
                    <th>Email</th>
                    <th>Quyền Hạn</th>
                    <th>Ngày Tham Gia</th>
                </tr>
            </thead>
            <tbody>
    `;

    let rows = adminUsers.map(u => `
        <tr>
            <td>#${u.id}</td>
            <td>${u.fullName}</td>
            <td>${u.email}</td>
            <td>${u.role || 'customer'}</td>
            <td>${new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
        </tr>
    `).join('');

    let footer = `</tbody></table><br><p style='text-align:right'>Người lập báo cáo: Hệ thống ModelStore Admin</p></body></html>`;
    
    let source = header + rows + footer;
    let blob = new Blob(['\ufeff', source], {
        type: 'application/msword'
    });

    let url = URL.createObjectURL(blob);
    let link = document.createElement('a');
    link.href = url;
    link.download = 'Danh-Sach-Nguoi-Dung.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function adminLogout() {
    localStorage.removeItem('user');
    window.location.href = 'auth.html';
}

// ─── MENU MANAGEMENT ──────────────────────────────────────
async function fetchAdminMenus() {
    try {
        const res = await fetch('/api/settings/menus');
        if (res.ok) {
            adminMenus = await res.json();
            renderMenusAdmin();
            initModelCatsFromMenus(); // Sync to Mô Hình tab
        }
    } catch (e) { console.error(e); }
}

function renderMenusAdmin() {
    const container = document.getElementById('adminMenusContainer');
    if (!container) return;

    container.innerHTML = adminMenus.map((menu, mi) => `
        <div class="stat-card" style="padding:1.5rem;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:1rem;">
                <span style="color:var(--gold); font-weight:700; font-size:1rem;">☰ Mục ${mi + 1}</span>
                <button onclick="removeMenu(${mi})" style="margin-left:auto; background:#e74c3c22; border:1px solid #e74c3c44; color:#e74c3c; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:0.8rem;">
                    <i class="fas fa-trash"></i> Xóa mục này
                </button>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:1rem;">
                <div class="form-group" style="margin:0;">
                    <label>Tên hiển thị</label>
                    <input type="text" id="mLabel_${mi}" value="${menu.label}" style="width:100%; padding:0.5rem; background:var(--bg-dark); border:1px solid var(--border); color:#fff; border-radius:4px;">
                </div>
                <div class="form-group" style="margin:0;">
                    <label>Link (href)</label>
                    <input type="text" id="mHref_${mi}" value="${menu.href}" style="width:100%; padding:0.5rem; background:var(--bg-dark); border:1px solid var(--border); color:#fff; border-radius:4px;">
                </div>
            </div>
            <div style="border-top:1px solid var(--border); padding-top:1rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.7rem;">
                    <span style="color:#aaa; font-size:0.9rem;">Menu con (dropdown):</span>
                    <button onclick="addMenuItem(${mi})" style="background:transparent; border:1px solid var(--gold); color:var(--gold); padding:3px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem;">
                        <i class="fas fa-plus"></i> Thêm mục con
                    </button>
                </div>
                <div id="mItems_${mi}" style="display:flex; flex-direction:column; gap:6px;">
                    ${(menu.items || []).map((item, ii) => `
                        <div style="display:flex; gap:8px; align-items:center;" id="mItemRow_${mi}_${ii}">
                            <input type="text" id="mItem_${mi}_${ii}" value="${item}"
                                style="flex:1; padding:0.4rem 0.7rem; background:var(--bg-dark); border:1px solid var(--border); color:#fff; border-radius:4px; font-size:0.9rem;">
                            <button onclick="removeMenuItem(${mi},${ii})" style="background:#e74c3c22; border:1px solid #e74c3c44; color:#e74c3c; width:30px; height:30px; border-radius:4px; cursor:pointer;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function addMenu() {
    adminMenus.push({ id: 'muc-moi-' + Date.now(), label: 'Mục mới', href: '#', hasDropdown: false, items: [] });
    renderMenusAdmin();
}

function removeMenu(mi) {
    if (!confirm('Xóa mục menu này?')) return;
    adminMenus.splice(mi, 1);
    renderMenusAdmin();
}

function addMenuItem(mi) {
    if (!adminMenus[mi].items) adminMenus[mi].items = [];
    adminMenus[mi].items.push('Mục con mới');
    renderMenusAdmin();
}

function removeMenuItem(mi, ii) {
    adminMenus[mi].items.splice(ii, 1);
    renderMenusAdmin();
}

async function saveMenus() {
    // Thu thập dữ liệu từ DOM
    const updated = adminMenus.map((menu, mi) => {
        const label = document.getElementById(`mLabel_${mi}`)?.value || menu.label;
        const href  = document.getElementById(`mHref_${mi}`)?.value || menu.href;
        const items = (menu.items || []).map((_, ii) =>
            document.getElementById(`mItem_${mi}_${ii}`)?.value || ''
        ).filter(s => s.trim() !== '');

        return {
            id: menu.id,
            label,
            href,
            hasDropdown: items.length > 0,
            items
        };
    });

    try {
        const res = await fetch('/api/settings/menus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        if (!res.ok) throw new Error();
        adminMenus = updated;
        showToast('Đã lưu menu thành công!');
        renderMenusAdmin();
    } catch {
        showToast('Lỗi khi lưu menu!');
    }
}

// ─── MODEL CATS MANAGEMENT (PVC & RESIN) ───────────────────────────
// Dữ liệu local (lấy từ menu.json, chỉ hiển thị 2 mục PVC + Resin)
let pvcItems = [];
let resinItems = [];

function initModelCatsFromMenus() {
    const pvcMenu = adminMenus.find(m => m.id === 'mo-hinh-pvc');
    const resinMenu = adminMenus.find(m => m.id === 'mo-hinh-resin');
    pvcItems = pvcMenu ? [...(pvcMenu.items || [])] : ['One Piece', 'Dragon Ball', 'Naruto', 'Demon Slayer', 'My Hero Academia', 'Series Khác'];
    resinItems = resinMenu ? [...(resinMenu.items || [])] : ['Jacksdo Studio', 'LX Studio', 'BT Studio', 'Ditaishe Studio', 'Brain Hole Studio', 'Khác'];
    renderModelCats();
}

function renderModelCats() {
    renderModelCatList('pvcItemsList', pvcItems, 'pvc');
    renderModelCatList('resinItemsList', resinItems, 'resin');
}

function renderModelCatList(containerId, items, type) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = items.map((item, i) => `
        <div style="display:flex; gap:8px; align-items:center;">
            <span style="color:var(--gold); font-size:0.85rem; min-width:20px; text-align:center;">${i + 1}.</span>
            <input type="text" id="${type}_item_${i}" value="${item}"
                style="flex:1; padding:0.45rem 0.8rem; background:var(--bg-dark); border:1px solid var(--border); color:#fff; border-radius:4px; font-size:0.9rem;"
                onchange="syncModelCatItem('${type}', ${i}, this.value)">
            <button onclick="removeModelCatItem('${type}', ${i})" title="Xóa"
                style="background:#e74c3c22; border:1px solid #e74c3c55; color:#e74c3c; width:32px; height:32px; border-radius:4px; cursor:pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function syncModelCatItem(type, index, value) {
    if (type === 'pvc') pvcItems[index] = value;
    else resinItems[index] = value;
}

function addModelCatItem(type) {
    if (type === 'pvc') pvcItems.push('Mục mới');
    else resinItems.push('Studio mới');
    renderModelCats();
}

function removeModelCatItem(type, index) {
    if (!confirm('Xóa mục này?')) return;
    if (type === 'pvc') pvcItems.splice(index, 1);
    else resinItems.splice(index, 1);
    renderModelCats();
}

async function saveModelCats() {
    // Đọc giá trị hiện tại từ input
    pvcItems = pvcItems.map((_, i) => document.getElementById(`pvc_item_${i}`)?.value || '').filter(s => s.trim());
    resinItems = resinItems.map((_, i) => document.getElementById(`resin_item_${i}`)?.value || '').filter(s => s.trim());

    // Cập nhật vào adminMenus
    const pvcMenu = adminMenus.find(m => m.id === 'mo-hinh-pvc');
    const resinMenu = adminMenus.find(m => m.id === 'mo-hinh-resin');
    if (pvcMenu) { pvcMenu.items = pvcItems; pvcMenu.hasDropdown = pvcItems.length > 0; }
    if (resinMenu) { resinMenu.items = resinItems; resinMenu.hasDropdown = resinItems.length > 0; }

    try {
        const res = await fetch('/api/settings/menus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminMenus)
        });
        if (!res.ok) throw new Error();
        showToast('Đã lưu thành công! Trang chủ sẽ cập nhật ngay.');
        renderModelCats();
    } catch {
        showToast('Lỗi khi lưu!');
    }
}
