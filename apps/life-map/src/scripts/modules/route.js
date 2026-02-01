import { debounce } from '../utils/debounce.js';

/**
 * RouteManager - 管理路线编辑逻辑
 */
export class RouteManager {
    constructor(mapManager, storageService, uiManager) {
        this.mapManager = mapManager;
        this.storageService = storageService;
        this.uiManager = uiManager;
        
        this.currentRoute = null;
        this.currentRoutePlaces = []; // 存储当前路线包含的完整地点对象
        this.isDirty = false;
        
        // DOM 元素
        this.editorEl = document.getElementById('route-editor');
        this.nameInput = document.getElementById('route-name');
        this.pointsListEl = document.getElementById('route-points-list');
        this.deleteBtn = document.getElementById('delete-route-btn');
        
        // 绑定方法
        this.debouncedSave = debounce(this.saveRoute.bind(this), 1000);
        
        this.initEventListeners();
    }

    initEventListeners() {
        if (!this.editorEl) return;

        // 路线名称修改
        this.nameInput.addEventListener('input', () => {
            if (this.currentRoute) {
                this.currentRoute.name = this.nameInput.value;
                this.isDirty = true;
                this.debouncedSave();
            }
        });

        // 删除路线
        this.deleteBtn.addEventListener('click', async () => {
            if (confirm('确定要删除这条路线吗？此操作无法撤销。')) {
                await this.deleteRoute();
            }
        });

        // 拖拽相关事件委托
        this.pointsListEl.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.pointsListEl.addEventListener('dragover', this.handleDragOver.bind(this));
        this.pointsListEl.addEventListener('drop', this.handleDrop.bind(this));
        this.pointsListEl.addEventListener('dragenter', (e) => e.preventDefault());
        this.pointsListEl.addEventListener('dragend', this.handleDragEnd.bind(this));

        // 删除点事件委托
        this.pointsListEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-remove-point');
            if (btn) {
                const index = parseInt(btn.dataset.index);
                this.removePoint(index);
            }
            
            // 点击列表项飞到地点
            const item = e.target.closest('.route-point-item');
            if (item && !btn && !e.target.closest('.btn-remove-point')) {
                const index = parseInt(item.dataset.index);
                this.focusPoint(index);
            }
        });
    }

    /**
     * 加载路线
     * @param {string} routeId 
     */
    async loadRoute(routeId) {
        if (routeId === 'new') {
            this.currentRoute = {
                name: '新建路线 ' + new Date().toLocaleDateString(),
                placeIds: [],
                createdAt: Date.now()
            };
            this.currentRoutePlaces = [];
            this.showEditor();
            this.render();
            
            // 立即保存以生成 ID
            await this.saveRoute();
            
            // 更新 URL
            const url = new URL(window.location);
            url.searchParams.set('routeId', this.currentRoute.id);
            window.history.replaceState({}, '', url);
            return;
        }

        try {
            const route = await this.storageService.getRouteById(routeId);
            if (!route) {
                console.error('Route not found:', routeId);
                alert('路线不存在或已被删除');
                window.location.href = 'dashboard.html';
                return;
            }

            this.currentRoute = route;
            this.nameInput.value = route.name || '';
            
            // 加载地点详情
            await this.loadRoutePlaces();
            
            // 显示侧边栏
            this.showEditor();
            
            // 渲染
            this.render();
            
            console.log('Route loaded:', route.name);
        } catch (error) {
            console.error('Failed to load route:', error);
            alert('加载路线失败');
        }
    }

    /**
     * 加载当前路线的所有地点详情
     */
    async loadRoutePlaces() {
        if (!this.currentRoute || !this.currentRoute.placeIds) {
            this.currentRoutePlaces = [];
            return;
        }

        const places = [];
        for (const id of this.currentRoute.placeIds) {
            try {
                const place = await this.storageService.getPlaceById(id);
                if (place) {
                    places.push(place);
                } else {
                    console.warn(`Place ${id} not found in storage`);
                }
            } catch (e) {
                console.error(`Error loading place ${id}:`, e);
            }
        }
        this.currentRoutePlaces = places;
        
        // 更新 IDs，以防有地点被删除
        this.currentRoute.placeIds = this.currentRoutePlaces.map(p => p.id);
    }

    /**
     * 显示编辑器
     */
    showEditor() {
        this.editorEl.classList.add('active');
        // 如果有其他 UI 需要调整，可以在这里处理
    }

    hideEditor() {
        this.editorEl.classList.remove('active');
    }

    /**
     * 渲染列表和地图
     */
    render() {
        this.renderList();
        this.renderMapRoute();
    }

    /**
     * 渲染地点列表
     */
    renderList() {
        if (this.currentRoutePlaces.length === 0) {
            this.pointsListEl.innerHTML = '<div class="empty-route-hint">点击地图上的地点添加到路线<br>或在搜索结果中添加</div>';
            return;
        }

        this.pointsListEl.innerHTML = this.currentRoutePlaces.map((place, index) => `
            <div class="route-point-item" draggable="true" data-index="${index}">
                <div class="point-marker">${index + 1}</div>
                <div class="point-info">
                    <div class="point-title" title="${place.title}">${place.title}</div>
                    <div class="point-address" title="${place.address || ''}">${place.address || '暂无地址'}</div>
                </div>
                <div class="point-actions">
                    <button class="btn-remove-point" data-index="${index}" title="从路线移除">×</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * 在地图上绘制路线
     */
    renderMapRoute() {
        // 清除旧的路线图层 (如果 MapManager 支持)
        if (this.routeLayer) {
            this.routeLayer.remove();
        }

        if (this.currentRoutePlaces.length < 1) return;

        const latlngs = this.currentRoutePlaces.map(p => [p.lat, p.lng]);
        
        // 使用 Polyline 绘制连接线
        // 使用 Leaflet API
        if (this.mapManager.map) {
            this.routeLayer = L.polyline(latlngs, {
                color: '#3b82f6',
                weight: 4,
                opacity: 0.7,
                dashArray: '10, 10', // 虚线效果，表示路径
                lineCap: 'round'
            }).addTo(this.mapManager.map);

            // 调整视野以包含所有点
            if (latlngs.length > 0) {
                const bounds = L.latLngBounds(latlngs);
                this.mapManager.map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }

    /**
     * 添加地点到路线
     * @param {Object} place 
     */
    async addPlace(place) {
        if (!this.currentRoute) return;

        // 检查是否已存在
        if (this.currentRoute.placeIds.includes(place.id)) {
            alert('该地点已在路线中');
            return;
        }

        this.currentRoutePlaces.push(place);
        this.currentRoute.placeIds.push(place.id);
        
        this.render();
        this.isDirty = true;
        this.debouncedSave();
    }

    /**
     * 从路线移除地点
     * @param {number} index 
     */
    removePoint(index) {
        if (index < 0 || index >= this.currentRoutePlaces.length) return;

        this.currentRoutePlaces.splice(index, 1);
        this.currentRoute.placeIds.splice(index, 1);
        
        this.render();
        this.isDirty = true;
        this.debouncedSave();
    }

    /**
     * 聚焦到某个点
     */
    focusPoint(index) {
        const place = this.currentRoutePlaces[index];
        if (place) {
            this.mapManager.flyTo(place.lat, place.lng, 16);
        }
    }

    /**
     * 保存路线到数据库
     */
    async saveRoute() {
        if (!this.currentRoute) return;
        
        console.log('Auto-saving route...');
        try {
            const savedRoute = await this.storageService.saveRoute(this.currentRoute);
            this.currentRoute = savedRoute; // 更新 ID 等信息
            this.isDirty = false;
            console.log('Route saved');
        } catch (error) {
            console.error('Failed to save route:', error);
        }
    }

    /**
     * 处理地点被删除的情况
     * @param {string} placeId 
     */
    handlePlaceDeleted(placeId) {
        if (!this.currentRoute) return;

        const index = this.currentRoutePlaces.findIndex(p => p.id === placeId);
        if (index > -1) {
            this.currentRoutePlaces.splice(index, 1);
            this.currentRoute.placeIds = this.currentRoutePlaces.map(p => p.id);
            this.render();
            this.saveRoute();
        }
    }

    /**
     * 删除当前路线
     */
    async deleteRoute() {
        if (!this.currentRoute) return;
        
        try {
            await this.storageService.deleteRoute(this.currentRoute.id);
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Failed to delete route:', error);
            alert('删除失败');
        }
    }

    // --- Drag and Drop Handlers ---

    handleDragStart(e) {
        const item = e.target.closest('.route-point-item');
        if (!item) return;

        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.index);
        
        this.dragSrcIndex = parseInt(item.dataset.index);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const item = e.target.closest('.route-point-item');
        if (!item) return;

        // 获取拖拽时的视觉反馈（可选：实现占位符）
    }

    handleDragEnd(e) {
        const item = e.target.closest('.route-point-item');
        if (item) {
            item.classList.remove('dragging');
        }
        
        document.querySelectorAll('.route-point-item').forEach(el => {
            el.classList.remove('over');
        });
    }

    handleDrop(e) {
        e.stopPropagation();
        
        const item = e.target.closest('.route-point-item');
        if (!item) return;

        const dropIndex = parseInt(item.dataset.index);
        if (this.dragSrcIndex === dropIndex) return;

        // 重新排序数组
        const movedPlace = this.currentRoutePlaces[this.dragSrcIndex];
        this.currentRoutePlaces.splice(this.dragSrcIndex, 1);
        this.currentRoutePlaces.splice(dropIndex, 0, movedPlace);
        
        // 更新 ID 列表
        this.currentRoute.placeIds = this.currentRoutePlaces.map(p => p.id);
        
        // 重新渲染
        this.render();
        
        // 保存
        this.isDirty = true;
        this.debouncedSave();
    }
}
