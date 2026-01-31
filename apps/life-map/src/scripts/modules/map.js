/**
 * MapManager - 封装 Leaflet 地图操作
 */
export class MapManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.markers = [];
    }

    /**
     * 初始化地图
     * @param {Array<number>} initialCoords [lat, lng]
     * @param {number} zoomLevel 
     */
    init(initialCoords = [39.9042, 116.4074], zoomLevel = 13) {
        if (this.map) return;

        // 初始化地图，禁用默认缩放控件，以便自定义位置
        this.map = L.map(this.containerId, {
            zoomControl: false
        }).setView(initialCoords, zoomLevel);

        // 将缩放控件添加到右下角
        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        // 使用 OpenStreetMap 图层
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);

        console.log('MapManager initialized');
    }

    /**
     * 移动地图视角到指定坐标
     * @param {number} lat 
     * @param {number} lng 
     * @param {number} zoom 
     */
    flyTo(lat, lng, zoom = 15) {
        if (!this.map) return;
        this.map.flyTo([lat, lng], zoom);
    }

    /**
     * 添加临时标记 (用于搜索结果或点击选点)
     * @param {number} lat 
     * @param {number} lng 
     * @param {string} popupContent 
     */
    addTempMarker(lat, lng, popupContent) {
        if (!this.map) return;

        // 清除之前的临时标记 (简单起见，这里先清除所有标记，后续需区分持久化标记和临时标记)
        this.clearMarkers();

        const marker = L.marker([lat, lng]).addTo(this.map);
        if (popupContent) {
            marker.bindPopup(popupContent).openPopup();
        }
        this.markers.push(marker);
        return marker;
    }

    /**
     * 清除所有标记
     */
    clearMarkers() {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
    }

    /**
     * 监听地图点击事件
     * @param {Function} callback (latlng) => {}
     */
    onMapClick(callback) {
        if (!this.map) return;
        this.map.on('click', (e) => {
            callback(e.latlng);
        });
    }
}
