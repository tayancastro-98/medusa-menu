import { MenuStore } from './store.js';

const menuContainer = document.getElementById('menu-items');
const categoriesContainer = document.getElementById('categories-container');

let currentCategory = '';

async function renderCategories() {
    categoriesContainer.innerHTML = '<p style="color: var(--text-secondary);">Carregando categorias...</p>';
    const categories = await MenuStore.getCategories();
    categoriesContainer.innerHTML = '';
    
    if (categories.length > 0 && !currentCategory) {
        currentCategory = categories[0].name;
    }

    categories.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.className = `cat-btn ${cat.name === currentCategory ? 'active' : ''}`;
        btn.dataset.category = cat.name;
        btn.innerText = cat.name;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = cat.name;
            renderMenu(currentCategory);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        categoriesContainer.appendChild(btn);
    });
    
    if(currentCategory) {
        renderMenu(currentCategory);
    }
}

async function renderMenu(category) {
    if (!category) return;
    menuContainer.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 40px;">Carregando cardápio...</p>';
    
    const allItems = await MenuStore.getProducts();
    const filteredItems = allItems.filter(item => 
        item.category.toUpperCase() === category.toUpperCase() && item.active
    );
    
    menuContainer.innerHTML = '';
    
    if (filteredItems.length === 0) {
        menuContainer.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 40px;">Nenhum produto disponível nesta categoria.</p>`;
        return;
    }

    filteredItems.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'drink-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        const imgUrl = item.image ? item.image : "logo-medusa.png";

        card.innerHTML = `
            <div class="item-img">
                 <img src="${imgUrl}" alt="${item.title}">
                 ${item.promo ? '<div class="promo-badge" style="position: absolute; top: 10px; right: 10px; margin: 0;">PROMO</div>' : ''}
            </div>
            <div class="item-info">
                <h3>${item.title}</h3>
                <p class="description">${item.description}</p>
                <div class="item-footer">
                    <span class="price">R$ ${item.price}</span>
                    <button class="add-btn">+</button>
                </div>
            </div>
        `;
        menuContainer.appendChild(card);
    });
}

// Escuta atualizações da rede
window.addEventListener('menuUpdate', () => renderMenu(currentCategory));
window.addEventListener('categoriesUpdate', () => {
    renderCategories();
});

// Inicialização
renderCategories();
