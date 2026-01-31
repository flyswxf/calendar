import { MapManager } from './modules/map.js';
import { SearchService } from './modules/search.js';
import { UIManager } from './modules/ui.js';
import { StorageService } from './modules/storage.js';
import { CelebrationManager } from './modules/celebration.js';
import { EntryManager } from './modules/entry.js';
import { debounce } from './utils/debounce.js';

class App {
    constructor() {
        this.mapManager = new MapManager('map');
        this.searchService = new SearchService();
        this.storageService = new StorageService();
        this.celebrationManager = new CelebrationManager();
        this.entryManager = null; // Will be initialized after dependencies
        this.uiManager = null;
    }

    async init() {
        console.log('App initializing...');
        
        try {
            // 初始化数据库
            await this.storageService.init();

            // 初始化地图
            this.mapManager.init();

            // 初始化入口管理器
            this.entryManager = new EntryManager(this.storageService, this.mapManager);
            this.entryManager.init();

            // 加载已保存的地点
            await this.loadSavedPlaces();

            // 初始化 UI 管理器
            this.uiManager = new UIManager({
                onSearchInput: debounce(this.handleSearch.bind(this), 500),
                onResultSelect: this.handleResultSelect.bind(this),
                onSave: this.handleSavePlace.bind(this),
                onDelete: this.handleDeletePlace.bind(this)
            });

            // 监听地图点击
            this.mapManager.onMapClick(async (latlng) => {
                // 点击地图空白处，尝试获取地址并打开编辑器
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

            console.log('App initialized successfully');
        } catch (error) {
            console.error('App initialization failed:', error);
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
            
            this.uiManager.closeEditor();
            
            // 移除地图上的标记
            this.mapManager.removePlaceMarker(id);
            
        } catch (error) {
            console.error('Failed to delete place:', error);
            alert('删除失败，请重试');
        }
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
