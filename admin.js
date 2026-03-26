import { supabase } from './supabaseClient.js';
import { MenuStore } from './store.js';

// --- Proteção de Sessão Real com Supabase ---
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    } else {
        // Inicialização só depois de garantir que tá logado
        renderAdminTable();
    }
}
checkAuth();

// Seletores de Elementos
const productList = document.getElementById('admin-product-list');
const categoryList = document.getElementById('admin-category-list');
const promoList = document.getElementById('admin-promo-list');

const productModal = document.getElementById('product-modal');
const categoryModal = document.getElementById('category-modal');

const productForm = document.getElementById('product-form');
const categoryForm = document.getElementById('category-form');

const logoutBtn = document.getElementById('logout-btn');

// --- LÓGICA DE ABAS ---
const tabButtons = document.querySelectorAll('[data-tab]');
const sections = document.querySelectorAll('.admin-section');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        
        // Ativar Botão
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Ativar Seção
        sections.forEach(sec => {
            sec.classList.remove('active');
            if (sec.id === `tab-${target}`) sec.classList.add('active');
        });

        // Recarregar dados específicos
        if (target === 'items') renderAdminTable();
        if (target === 'categories') renderCategoryTable();
        if (target === 'promos') renderPromoTable();
    });
});

// --- GERENCIAMENTO DE PRODUTOS ---
async function renderAdminTable() {
    productList.innerHTML = '<tr><td colspan="5" style="text-align:center;">Carregando produtos...</td></tr>';
    const products = await MenuStore.getProducts();
    const cats = await MenuStore.getCategories();
    
    productList.innerHTML = '';
    
    // Atualiza o select de categorias no modal de produtos
    const select = document.getElementById('p-category');
    select.innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

    products.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="status-badge ${product.active ? 'status-active' : 'status-inactive'}">${product.active ? 'ATIVO' : 'OCULTO'}</span></td>
            <td>
                <strong>${product.title}</strong> ${product.promo ? '<span class="promo-badge">PROMO</span>' : ''}<br>
                <small style="color:#666">${product.description ? product.description.substring(0, 30) : ''}...</small>
            </td>
            <td>${product.category}</td>
            <td>R$ ${product.price}</td>
            <td>
                <button class="btn-icon toggle-btn" data-id="${product.id}" data-status="${product.active}" title="Alternar Visibilidade">👁️</button>
                <button class="btn-icon edit-btn" data-id="${product.id}" title="Editar">✏️</button>
                <button class="btn-icon delete-btn" data-id="${product.id}" title="Excluir" style="color:#ff4444">🗑️</button>
            </td>
        `;
        productList.appendChild(tr);
    });

    attachProductEvents();
}

function attachProductEvents() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', async () => { 
            const status = btn.dataset.status === 'true';
            await MenuStore.toggleProduct(Number(btn.dataset.id), status); 
            renderAdminTable(); 
        });
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async () => { 
            const products = await MenuStore.getProducts();
            const p = products.find(x => x.id === Number(btn.dataset.id));
            openProductModal(p);
        });
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Excluir este produto permanentemente?')) { 
                await MenuStore.deleteProduct(Number(btn.dataset.id)); 
                renderAdminTable(); 
            }
        });
    });
}

function openProductModal(p = null) {
    const modalTitle = document.getElementById('modal-title');
    const editId = document.getElementById('edit-id');
    
    // Ensure file input exists and is visually clear
    let imgInput = document.getElementById('p-image');
    if (!imgInput) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.innerHTML = `
            <label>Imagem do Produto</label>
            <input type="file" id="p-image" accept="image/*">
        `;
        document.getElementById('p-desc').parentNode.appendChild(formGroup);
        imgInput = document.getElementById('p-image');
    }
    imgInput.value = ''; // Reset file input

    if (p) {
        modalTitle.innerText = "Editar Produto";
        editId.value = p.id;
        document.getElementById('p-title').value = p.title;
        document.getElementById('p-category').value = p.category;
        document.getElementById('p-price').value = p.price;
        document.getElementById('p-desc').value = p.description;
        document.getElementById('p-promo').checked = p.promo || false;
    } else {
        modalTitle.innerText = "Novo Produto";
        productForm.reset();
        editId.value = "";
    }
    productModal.style.display = 'block';
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = productForm.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = 'Salvando...';
    btn.disabled = true;

    const id = document.getElementById('edit-id').value;
    const imgFile = document.getElementById('p-image')?.files[0];
    
    let imageUrl = "logo-medusa.png";
    if (imgFile) {
        imageUrl = await MenuStore.uploadImage(imgFile);
    } else if (id) {
        // Se ta editando e não mandou imagem nova, pega a atual
        const products = await MenuStore.getProducts();
        const existing = products.find(x => x.id === Number(id));
        if(existing && existing.image) imageUrl = existing.image;
    }

    const data = {
        title: document.getElementById('p-title').value,
        category: document.getElementById('p-category').value,
        price: document.getElementById('p-price').value,
        description: document.getElementById('p-desc').value,
        promo: document.getElementById('p-promo').checked,
        image: imageUrl
    };

    if (id) {
        await MenuStore.updateProduct(Number(id), data);
    } else {
        await MenuStore.addProduct(data);
    }

    productModal.style.display = 'none';
    btn.innerText = originalText;
    btn.disabled = false;
    renderAdminTable();
});

// --- GERENCIAMENTO DE CATEGORIAS ---
async function renderCategoryTable() {
    categoryList.innerHTML = '<tr><td colspan="3" style="text-align:center;">Carregando categorias...</td></tr>';
    const cats = await MenuStore.getCategories();
    categoryList.innerHTML = '';
    cats.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${c.order}</td>
            <td><strong>${c.name}</strong></td>
            <td>
                <button class="btn-icon edit-cat-btn" data-id="${c.id}" data-name="${c.name}">✏️</button>
                <button class="btn-icon delete-cat-btn" data-id="${c.id}" style="color:#ff4444">🗑️</button>
            </td>
        `;
        categoryList.appendChild(tr);
    });

    document.querySelectorAll('.edit-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('edit-cat-id').value = btn.dataset.id;
            document.getElementById('cat-name').value = btn.dataset.name;
            categoryModal.style.display = 'block';
        });
    });

    document.querySelectorAll('.delete-cat-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Excluir esta categoria? Modifique a categoria dos produtos nela antes.')) {
                await MenuStore.deleteCategory(Number(btn.dataset.id));
                renderCategoryTable();
            }
        });
    });
}

categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-cat-id').value;
    const name = document.getElementById('cat-name').value;
    
    if (id) {
        await MenuStore.updateCategory(Number(id), name);
    } else {
        const cats = await MenuStore.getCategories();
        await MenuStore.addCategory(name, cats.length);
    }
    
    categoryModal.style.display = 'none';
    renderCategoryTable();
});

// --- GERENCIAMENTO DE PROMOÇÕES ---
async function renderPromoTable() {
    promoList.innerHTML = '<tr><td colspan="4" style="text-align:center;">Carregando produtos...</td></tr>';
    const products = await MenuStore.getProducts();
    promoList.innerHTML = '';
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="promo-toggle" data-id="${p.id}" ${p.promo ? 'checked' : ''}></td>
            <td><strong>${p.title}</strong></td>
            <td>R$ ${p.price}</td>
            <td><small>${p.category}</small></td>
        `;
        promoList.appendChild(tr);
    });

    document.querySelectorAll('.promo-toggle').forEach(chk => {
        chk.addEventListener('change', async () => {
            await MenuStore.updateProduct(Number(chk.dataset.id), { promo: chk.checked });
            // Não recarrega a tabela inteira aqui pra não perder o foco do scroll
            window.dispatchEvent(new Event('menuUpdate'));
        });
    });
}

// --- UTILITÁRIOS ---
document.getElementById('open-add-modal').addEventListener('click', () => openProductModal());
document.getElementById('open-cat-modal').addEventListener('click', () => {
    categoryForm.reset();
    document.getElementById('edit-cat-id').value = "";
    categoryModal.style.display = 'block';
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        productModal.style.display = 'none';
        categoryModal.style.display = 'none';
    });
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// Clique fora fecha modais
window.onclick = (e) => {
    if (e.target == productModal) productModal.style.display = "none";
    if (e.target == categoryModal) categoryModal.style.display = "none";
};
