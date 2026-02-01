import { MapManager } from './modules/map.js';
import { SearchService } from './modules/search.js';
import { UIManager } from './modules/ui.js';
import { StorageService } from './modules/storage.js';
import { CelebrationManager } from './modules/celebration.js';
import { RouteManager } from './modules/route.js';
import { debounce } from './utils/debounce.js';

class App {
    constructor() {
        this.mapManager = new MapManager('map');
        this.searchService = new SearchService();
        this.storageService = new StorageService();
        this.celebrationManager = new CelebrationManager();
        this.uiManager = null;
        this.routeManager = null;
    }

    async init() {
        console.log('App initializing...');
        
        try {
            // 初始化数据库
            await this.storageService.init();

            // 初始化地图
            this.mapManager.init();

            // 绑定返回按钮
            this.bindBackButton();

            // 初始化 UI 管理器
            this.uiManager = new UIManager({
                onSearchInput: debounce(this.handleSearch.bind(this), 500),
                onResultSelect: this.handleResultSelect.bind(this),
                onSave: this.handleSavePlace.bind(this),
                onDelete: this.handleDeletePlace.bind(this)
            });

            // 初始化路线管理器
            this.routeManager = new RouteManager(
                this.mapManager,
                this.storageService,
                this.uiManager
            );

            // 处理 URL 参数 (flyTo, routeId)
            await this.handleUrlParams();

            // 加载已保存的地点
            await this.loadSavedPlaces();

            // 监听地图双击 (新建地点)
            this.mapManager.onMapDoubleClick(async (latlng) => {
                // 双击地图，尝试获取地址并打开编辑器
                const addressData = await this.searchService.reverseGeocode(latlng.lat, latlng.lng);
                const title = addressData && addressData.display_name ? addressData.display_name.split(',')[0] : '未知地点';
                
                this.uiManager.openEditor({
                    lat: latlng.lat,
                    lng: latlng.lng,
                    title: title
                });

                // 添加临时标记
                this.mapManager.addTempMarker(latlng.lat, latlng.lng);
            });

            // 监听地图单击 (关闭编辑器)
            this.mapManager.onMapClick(() => {
                // 单击地图任意位置，关闭编辑器
                this.uiManager.closeEditor();
                // 可选：清除临时标记，如果不希望保留的话
                // this.mapManager.clearTempMarker(); 
            });

            // 监听 ESC 键关闭编辑器
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.uiManager.closeEditor();
                }
            });

            console.log('App initialized successfully');
        } catch (error) {
            console.error('App initialization failed:', error);
        }
    }

    /**
     * 绑定返回仪表盘按钮
     */
    bindBackButton() {
        const btn = document.getElementById('btn-back-dashboard');
        if (btn) {
            btn.addEventListener('click', () => {
                window.location.href = 'dashboard.html';
            });
        }
    }

    /**
     * 处理 URL 参数
     */
    async handleUrlParams() {
        const params = new URLSearchParams(window.location.search);
        
        // 处理 routeId
        const routeId = params.get('routeId');
        if (routeId) {
            await this.routeManager.loadRoute(routeId);
        }

        // 处理 flyTo
        const flyTo = params.get('flyTo'); // format: lat,lng
        if (flyTo) {
            const [lat, lng] = flyTo.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
                // 稍微延迟一下以确保地图加载完成
                setTimeout(() => {
                    this.mapManager.flyTo(lat, lng, 16);
                }, 500);
            }
        }
    }

    /**
     * 加载已保存的地点
     */
    async loadSavedPlaces() {
        const places = await this.storageService.getAllPlaces();
        places.forEach(place => {
            this.addPlaceMarker(place);
        });
    }

    /**
     * 添加地点标记
     * @param {Object} place 
     */
    addPlaceMarker(place) {
        this.mapManager.addOrUpdatePlaceMarker(
            place.id,
            place.lat,
            place.lng,
            `<b>${place.title}</b>`,
            () => {
                this.uiManager.openEditor(place);
            }
        );
    }

    /**
     * 处理搜索输入
     * @param {string} query 
     */
    async handleSearch(query) {
        if (!query) {
            this.uiManager.clearSearchResults();
            return;
        }

        console.log('Searching for:', query);
        const results = await this.searchService.search(query);
        this.uiManager.renderSearchResults(results);
    }

    /**
     * 处理搜索结果选择
     * @param {Object} result 
     */
    handleResultSelect(result) {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        console.log('Selected:', result.display_name, lat, lng);

        // 移动地图
        this.mapManager.flyTo(lat, lng);

        // 打开编辑器
        this.uiManager.openEditor({
            lat: lat,
            lng: lng,
            title: result.display_name.split(',')[0]
        });

        // 添加临时标记
        this.mapManager.addTempMarker(lat, lng);
    }

    /**
     * 保存地点
     * @param {Object} data 
     */
    async handleSavePlace(data) {
        try {
            const savedPlace = await this.storageService.savePlace(data);
            console.log('Place saved:', savedPlace);
            
            // 关闭编辑器
            this.uiManager.closeEditor();
            
            // 更新地图上的标记 (新增或修改)
            this.addPlaceMarker(savedPlace);
            
            // 清除临时选点标记
            this.mapManager.clearTempMarker();
            
            // 触发庆祝效果
            this.celebrationManager.celebrate();

            // 如果正在编辑路线，自动添加到路线
            if (this.routeManager && this.routeManager.currentRoute) {
                this.routeManager.addPlace(savedPlace);
            }
            
        } catch (error) {
            console.error('Failed to save place:', error);
            alert('保存失败，请重试');
        }
    }

    /**
     * 删除地点
     * @param {string} id 
     */
    async handleDeletePlace(id) {
        try {
            await this.storageService.deletePlace(id);
            console.log('Place deleted:', id);
            
            // 关闭编辑器
            this.uiManager.closeEditor();
            
            // 移除地图上的标记
            this.mapManager.removePlaceMarker(id);
            
            // 提示
            alert('地点已删除');
        } catch (error) {
            console.error('Failed to delete place:', error);
            alert('删除失败，请重试');
        }
    }
}

// 初始化应用
const app = new App();
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
