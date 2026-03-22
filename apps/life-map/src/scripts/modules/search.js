/**
 * SearchService - 封装 Nominatim API 交互
 */
export class SearchService {
    constructor() {
        this.baseUrl = 'https://nominatim.openstreetmap.org';
    }

    /**
     * 搜索地点
     * @param {string} query 搜索关键词
     * @returns {Promise<Array>} 搜索结果数组
     */
    async search(query) {
        if (!query || query.length < 2) return [];

        try {
            // 使用 encodeURIComponent 处理特殊字符
            const url = `${this.baseUrl}/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('SearchService Error:', error);
            return [];
        }
    }

    /**
     * 反向地理编码 (坐标 -> 地址)
     * @param {number} lat 
     * @param {number} lng 
     * @returns {Promise<Object>} 地点详情
     */
    async reverseGeocode(lat, lng) {
        try {
            const url = `${this.baseUrl}/reverse?format=json&lat=${lat}&lon=${lng}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Reverse geocode failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Reverse Geocode Error:', error);
            return null;
        }
    }
}
