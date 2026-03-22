/**
 * StorageService - 封装 IndexedDB 操作
 */
export class StorageService {
    constructor() {
        this.dbName = 'LifeMapDB';
        this.storeName = 'places';
        this.routeStoreName = 'routes';
        this.db = null;
    }

    /**
     * 初始化数据库
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2); // Upgrade version to 2

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('StorageService initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Places Store
                if (!db.objectStoreNames.contains(this.storeName)) {
                    // 创建存储对象，使用 id 作为主键
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    // 创建索引以便查询
                    objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Routes Store
                if (!db.objectStoreNames.contains(this.routeStoreName)) {
                    const routeStore = db.createObjectStore(this.routeStoreName, { keyPath: 'id' });
                    routeStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    // --- Route Methods ---

    /**
     * 保存路线
     * @param {Object} routeData 
     */
    async saveRoute(routeData) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.routeStoreName], 'readwrite');
            const store = transaction.objectStore(this.routeStoreName);
            
            const data = {
                ...routeData,
                id: routeData.id || crypto.randomUUID(),
                placeIds: routeData.placeIds || [], // Array of place IDs
                updatedAt: Date.now(),
                createdAt: routeData.createdAt || Date.now()
            };

            const request = store.put(data);

            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取所有路线
     */
    async getAllRoutes() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.routeStoreName], 'readonly');
            const store = transaction.objectStore(this.routeStoreName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 根据 ID 获取路线
     * @param {string} id 
     */
    async getRouteById(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.routeStoreName], 'readonly');
            const store = transaction.objectStore(this.routeStoreName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 删除路线
     * @param {string} id 
     */
    async deleteRoute(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.routeStoreName], 'readwrite');
            const store = transaction.objectStore(this.routeStoreName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // --- Place Methods ---

    /**
     * 保存地点数据
     * @param {Object} placeData 
     */
    async savePlace(placeData) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // 确保有 ID 和创建时间
            const data = {
                ...placeData,
                id: placeData.id || crypto.randomUUID(),
                updatedAt: Date.now(),
                createdAt: placeData.createdAt || Date.now()
            };

            const request = store.put(data);

            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取所有地点
     */
    async getAllPlaces() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 根据 ID 获取地点
     * @param {string} id 
     */
    async getPlaceById(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 删除地点
     * @param {string} id 
     */
    async deletePlace(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}
