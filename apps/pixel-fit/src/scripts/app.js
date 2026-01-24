// 模拟数据：衣柜内容
const initialWardrobe = [
    { id: 'top1', type: 'top', src: 'https://placehold.co/100x100/FF5733/FFF?text=T-Shirt', layerSrc: 'https://placehold.co/300x500/FF5733/FFF?text=Top' },
    { id: 'bottom1', type: 'bottom', src: 'https://placehold.co/100x100/33FF57/FFF?text=Jeans', layerSrc: 'https://placehold.co/300x500/33FF57/FFF?text=Pants' },
    { id: 'acc1', type: 'accessory', src: 'https://placehold.co/100x100/3357FF/FFF?text=Hat', layerSrc: 'https://placehold.co/300x500/3357FF/FFF?text=Hat' },
];

// 状态管理
const state = {
    wearing: {
        body: 'default-body', // 暂时用占位符
        top: null,
        bottom: null,
        accessory: null
    },
    wardrobe: [...initialWardrobe]
};

// DOM 元素引用
const dom = {
    layers: {
        body: document.getElementById('layer-body'),
        bottom: document.getElementById('layer-bottom'),
        top: document.getElementById('layer-top'),
        accessory: document.getElementById('layer-accessory'),
    },
    wardrobeGrid: document.getElementById('wardrobe-grid'),
    tabs: document.querySelectorAll('.tab'),
    panels: document.querySelectorAll('.panel-section')
};

// 初始化
function init() {
    renderWardrobe();
    setupEventListeners();
    // 模拟加载基础模特（这里暂时用色块代替）
    dom.layers.body.style.backgroundColor = '#ffdbac'; // 肤色
}

// 渲染衣柜
function renderWardrobe() {
    dom.wardrobeGrid.innerHTML = state.wardrobe.map(item => `
        <div class="wardrobe-item" onclick="tryOn('${item.id}')">
            <img src="${item.src}" alt="${item.type}">
        </div>
    `).join('');
}

// 试穿逻辑
window.tryOn = function(itemId) {
    const item = state.wardrobe.find(i => i.id === itemId);
    if (!item) return;

    // 更新状态
    const currentWearing = state.wearing[item.type];
    if (currentWearing === item.id) {
        // 如果已经穿戴，则脱下
        state.wearing[item.type] = null;
        updateLayer(item.type, null);
    } else {
        // 穿上新装备
        state.wearing[item.type] = item.id;
        updateLayer(item.type, item.layerSrc);
    }
    
    // 更新 UI 选中状态
    updateActiveStates();
};

function updateLayer(type, src) {
    const layer = dom.layers[type];
    if (!layer) return;

    if (src) {
        layer.style.backgroundImage = `url('${src}')`;
        layer.style.display = 'block';
    } else {
        layer.style.backgroundImage = 'none';
        layer.style.display = 'none';
    }
}

function updateActiveStates() {
    // 简单实现：重新渲染列表来更新高亮（生产环境应该只更新 class）
    const items = document.querySelectorAll('.wardrobe-item');
    items.forEach((el, index) => {
        const item = state.wardrobe[index];
        const isWearing = state.wearing[item.type] === item.id;
        if (isWearing) {
            el.classList.add('selected');
        } else {
            el.classList.remove('selected');
        }
    });
}

function setupEventListeners() {
    // Tab 切换逻辑
    dom.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            dom.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const targetId = tab.dataset.target;
            document.querySelectorAll('.panel-section').forEach(p => {
                p.style.display = p.id === targetId ? 'block' : 'none';
            });
        });
    });
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);
