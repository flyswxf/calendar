import { MapManager } from './modules/map.js';
import { SearchService } from './modules/search.js';
import { UIManager } from './modules/ui.js';
import { StorageService } from './modules/storage.js';
import { debounce } from './utils/debounce.js';

class App {
    constructor() {
        this.mapManager = new MapManager('map');
        this.searchService = new SearchService();
        this.storageService = new StorageService();
        this.uiManager = null;
    }

    async init() {
        console.log('App initializing...');
        
        try {
            // 初始化数据库
            await this.storageService.init();

            // 初始化地图
            this.mapManager.init();

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
        const marker = L.marker([place.lat, place.lng]).addTo(this.mapManager.map);
        
        // 绑定点击事件：打开编辑器查看详情
        marker.on('click', () => {
            this.uiManager.openEditor(place);
        });

        // 绑定简单的 Popup
        marker.bindPopup(`<b>${place.title}</b>`);
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
            
            // 刷新地图标记 (简单起见，刷新页面或重新加载所有标记，这里优化为添加单个标记)
            // 如果是新添加的，添加标记；如果是更新，可能需要刷新
            // 简单处理：重新加载所有标记（先清除旧的？）
            // 为了平滑体验，如果是新 ID，直接添加 Marker；如果是旧 ID，更新 Marker (需要维护 Marker Map)
            
            // 简单方案：刷新页面或重新加载所有标记
            // 实际方案：addPlaceMarker 会重复添加，所以最好是 clearMarkers 再 loadSavedPlaces，或者更精细的控制
            // 这里我们先做一个简单的 reload 动作
            location.reload(); 
            
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
            location.reload();
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
