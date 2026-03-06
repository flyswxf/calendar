/**
 * MapManager - 封装 Leaflet 地图操作
 */
export class MapManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.placeMarkers = new Map(); // 存储已保存地点的标记: id -> Marker
        this.tempMarker = null; // 存储临时的标记（搜索结果或点击新建）
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
            zoomControl: false,
            doubleClickZoom: false // 禁用双击放大
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
     * 添加或更新地点标记
     * @param {Object} placeData 包含 id, lat, lng, title, image 等信息的对象
     * @param {Function} onClick 点击回调
     */
    addOrUpdatePlaceMarker(placeData, onClick) {
        if (!this.map) return;

        const { id, lat, lng, title, images } = placeData;
        let marker = this.placeMarkers.get(id);

        if (marker) {
            // 更新现有标记
            marker.setLatLng([lat, lng]);
            // 更新 Tooltip 内容
            this.bindTooltip(marker, title, images);
            
            // 更新点击事件
            marker.off('click');
            if (onClick) {
                marker.on('click', onClick);
            }
        } else {
            // 创建新标记
            marker = L.marker([lat, lng]).addTo(this.map);
            
            // 绑定 Tooltip
            this.bindTooltip(marker, title, images);

            if (onClick) {
                marker.on('click', onClick);
            }
            this.placeMarkers.set(id, marker);
        }
        return marker;
    }

    /**
     * 绑定自定义 Tooltip
     * @param {L.Marker} marker 
     * @param {string} title 
     * @param {Array} images 
     */
    bindTooltip(marker, title, images) {
        let content = `<div class="custom-tooltip-content">`;
        
        // 如果有图片，显示第一张缩略图
        if (images && images.length > 0) {
            // 这里假设 images 存储的是 Blob 或者 URL
            // 如果是 Blob，需要确保有对应的 URL (通常在加载时处理)
            // 简单起见，这里假设它是一个有效的图片源
            // 注意：如果是 Blob 对象，需要 createObjectURL，但为了性能，
            // 最好是在数据层处理好缩略图 URL。
            // 暂时逻辑：尝试直接使用 (如果是 URL 字符串) 或者创建临时 URL
            
            let imgSrc = '';
            const firstImg = images[0];
            if (firstImg instanceof Blob || firstImg instanceof File) {
                 imgSrc = URL.createObjectURL(firstImg);
            } else {
                imgSrc = firstImg;
            }

            content += `
                <div class="tooltip-image">
                    <img src="${imgSrc}" alt="${title}">
                </div>
            `;
        }
        
        content += `<div class="tooltip-title">${title || '未命名地点'}</div>`;
        content += `</div>`;

        marker.bindTooltip(content, {
            permanent: false,
            direction: 'top',
            className: 'custom-map-tooltip',
            offset: [0, -30],
            opacity: 1
        });
    }

    /**
     * 移除地点标记
     * @param {string} id 
     */
    removePlaceMarker(id) {
        const marker = this.placeMarkers.get(id);
        if (marker) {
            marker.remove();
            this.placeMarkers.delete(id);
        }
    }

    /**
     * 添加临时标记 (用于搜索结果或点击选点)
     * @param {number} lat 
     * @param {number} lng 
     * @param {string} popupContent 
     */
    addTempMarker(lat, lng, popupContent) {
        if (!this.map) return;

        this.clearTempMarker();

        this.tempMarker = L.marker([lat, lng], {
            icon: new L.Icon.Default({ className: 'temp-marker' }) // 可以自定义样式区分
        }).addTo(this.map);

        // 临时标记显示红色滤镜效果（可选，通过 CSS 类实现）
        if (this.tempMarker._icon) {
            this.tempMarker._icon.style.filter = 'hue-rotate(150deg)';
        }

        if (popupContent) {
            this.tempMarker.bindPopup(popupContent).openPopup();
        }
        return this.tempMarker;
    }

    /**
     * 清除临时标记
     */
    clearTempMarker() {
        if (this.tempMarker) {
            this.tempMarker.remove();
            this.tempMarker = null;
        }
    }

    /**
     * 监听地图双击事件
     * @param {Function} callback (latlng) => {}
     */
    onMapDoubleClick(callback) {
        if (!this.map) return;
        this.map.on('dblclick', (e) => {
            callback(e.latlng);
        });
    }

    /**
     * 监听地图单击事件 (用于关闭编辑器)
     * @param {Function} callback (latlng) => {}
     */
    onMapClick(callback) {
        if (!this.map) return;
        this.map.on('click', (e) => {
            callback(e.latlng);
        });
    }
}
