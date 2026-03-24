/**
 * StorageService - 封装 IndexedDB 操作
 */
export class StorageService {
    constructor() {
        this.dbName = 'LifeMapDB';
        this.storeName = 'places';
        this.routeStoreName = 'routes';
        this.db = null;
        this.cloudClient = null;
        this.cloudUserId = null;
    }

    /**
     * 初始化数据库
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);

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
                
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                if (!db.objectStoreNames.contains(this.routeStoreName)) {
                    const routeStore = db.createObjectStore(this.routeStoreName, { keyPath: 'id' });
                    routeStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    setCloudContext(client, userId) {
        this.cloudClient = client || null;
        this.cloudUserId = userId || null;
    }

    hasCloud() {
        return Boolean(this.cloudClient && this.cloudUserId);
    }

    async withStore(storeName, mode, action) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([storeName], mode);
            const store = transaction.objectStore(storeName);
            const request = action(store);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllLocal(storeName) {
        const result = await this.withStore(storeName, 'readonly', (store) => store.getAll());
        return Array.isArray(result) ? result : [];
    }

    async saveLocal(storeName, data) {
        await this.withStore(storeName, 'readwrite', (store) => store.put(data));
        return data;
    }

    async deleteLocal(storeName, id) {
        await this.withStore(storeName, 'readwrite', (store) => store.delete(id));
    }

    async getByIdLocal(storeName, id) {
        return this.withStore(storeName, 'readonly', (store) => store.get(id));
    }

    normalizeRoute(routeData) {
        return {
            ...routeData,
            id: routeData.id || crypto.randomUUID(),
            placeIds: routeData.placeIds || [],
            updatedAt: Date.now(),
            createdAt: routeData.createdAt || Date.now()
        };
    }

    normalizePlace(placeData) {
        return {
            ...placeData,
            id: placeData.id || crypto.randomUUID(),
            updatedAt: Date.now(),
            createdAt: placeData.createdAt || Date.now()
        };
    }

    toCloudPlace(place) {
        return {
            id: place.id,
            user_id: this.cloudUserId,
            title: place.title || '',
            content: place.content || place.description || '',
            lat: place.lat,
            lng: place.lng,
            event_at: place.eventDate ? new Date(place.eventDate).toISOString() : null,
            payload: {
                ...place,
                images: [],
                description: undefined
            },
            created_at: new Date(place.createdAt || Date.now()).toISOString(),
            updated_at: new Date(place.updatedAt || Date.now()).toISOString()
        };
    }

    fromCloudPlace(row) {
        const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
        return {
            ...payload,
            id: row.id,
            title: row.title || payload.title || '',
            content: row.content ?? payload.content ?? '',
            description: row.content ?? payload.description ?? '',
            lat: row.lat,
            lng: row.lng,
            eventDate: row.event_at ? new Date(row.event_at).getTime() : payload.eventDate,
            images: Array.isArray(payload.images) ? payload.images : [],
            createdAt: row.created_at ? new Date(row.created_at).getTime() : (payload.createdAt || Date.now()),
            updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : (payload.updatedAt || Date.now())
        };
    }

    toCloudRoute(route) {
        return {
            id: route.id,
            user_id: this.cloudUserId,
            name: route.name || '',
            description: route.description || '',
            place_ids: Array.isArray(route.placeIds) ? route.placeIds : [],
            payload: route,
            created_at: new Date(route.createdAt || Date.now()).toISOString(),
            updated_at: new Date(route.updatedAt || Date.now()).toISOString()
        };
    }

    fromCloudRoute(row) {
        const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
        return {
            ...payload,
            id: row.id,
            name: row.name || payload.name || '',
            description: row.description || payload.description || '',
            placeIds: Array.isArray(row.place_ids) ? row.place_ids : (payload.placeIds || []),
            createdAt: row.created_at ? new Date(row.created_at).getTime() : (payload.createdAt || Date.now()),
            updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : (payload.updatedAt || Date.now())
        };
    }

    async upsertCloudPlace(place) {
        if (!this.hasCloud()) return;
        await this.cloudClient
            .from('life_map_places')
            .upsert(this.toCloudPlace(place), { onConflict: 'id' });
    }

    async upsertCloudRoute(route) {
        if (!this.hasCloud()) return;
        await this.cloudClient
            .from('life_map_routes')
            .upsert(this.toCloudRoute(route), { onConflict: 'id' });
    }

    async deleteCloudPlace(id) {
        if (!this.hasCloud()) return;
        await this.cloudClient
            .from('life_map_places')
            .delete()
            .eq('id', id)
            .eq('user_id', this.cloudUserId);
    }

    async deleteCloudRoute(id) {
        if (!this.hasCloud()) return;
        await this.cloudClient
            .from('life_map_routes')
            .delete()
            .eq('id', id)
            .eq('user_id', this.cloudUserId);
    }

    async syncCloud() {
        if (!this.hasCloud()) return;

        const [localPlaces, localRoutes] = await Promise.all([
            this.getAllLocal(this.storeName),
            this.getAllLocal(this.routeStoreName)
        ]);

        const [{ data: cloudPlaces, error: placeError }, { data: cloudRoutes, error: routeError }] = await Promise.all([
            this.cloudClient
                .from('life_map_places')
                .select('*')
                .eq('user_id', this.cloudUserId)
                .order('updated_at', { ascending: false }),
            this.cloudClient
                .from('life_map_routes')
                .select('*')
                .eq('user_id', this.cloudUserId)
                .order('updated_at', { ascending: false })
        ]);

        if (placeError) throw placeError;
        if (routeError) throw routeError;

        const localPlaceMap = new Map(localPlaces.map((p) => [p.id, p]));
        const cloudPlaceMap = new Map((cloudPlaces || []).map((row) => [row.id, this.fromCloudPlace(row)]));

        for (const [id, localPlace] of localPlaceMap.entries()) {
            const cloudPlace = cloudPlaceMap.get(id);
            if (!cloudPlace) {
                await this.upsertCloudPlace(localPlace);
                continue;
            }
            if ((localPlace.updatedAt || 0) > (cloudPlace.updatedAt || 0)) {
                await this.upsertCloudPlace(localPlace);
            } else if ((cloudPlace.updatedAt || 0) > (localPlace.updatedAt || 0)) {
                await this.saveLocal(this.storeName, cloudPlace);
            }
        }

        for (const [id, cloudPlace] of cloudPlaceMap.entries()) {
            if (!localPlaceMap.has(id)) {
                await this.saveLocal(this.storeName, cloudPlace);
            }
        }

        const localRouteMap = new Map(localRoutes.map((r) => [r.id, r]));
        const cloudRouteMap = new Map((cloudRoutes || []).map((row) => [row.id, this.fromCloudRoute(row)]));

        for (const [id, localRoute] of localRouteMap.entries()) {
            const cloudRoute = cloudRouteMap.get(id);
            if (!cloudRoute) {
                await this.upsertCloudRoute(localRoute);
                continue;
            }
            if ((localRoute.updatedAt || 0) > (cloudRoute.updatedAt || 0)) {
                await this.upsertCloudRoute(localRoute);
            } else if ((cloudRoute.updatedAt || 0) > (localRoute.updatedAt || 0)) {
                await this.saveLocal(this.routeStoreName, cloudRoute);
            }
        }

        for (const [id, cloudRoute] of cloudRouteMap.entries()) {
            if (!localRouteMap.has(id)) {
                await this.saveLocal(this.routeStoreName, cloudRoute);
            }
        }
    }

    async saveRoute(routeData) {
        const data = this.normalizeRoute(routeData);
        await this.saveLocal(this.routeStoreName, data);
        await this.upsertCloudRoute(data);
        return data;
    }

    async getAllRoutes() {
        return this.getAllLocal(this.routeStoreName);
    }

    async getRouteById(id) {
        return this.getByIdLocal(this.routeStoreName, id);
    }

    async deleteRoute(id) {
        await this.deleteLocal(this.routeStoreName, id);
        await this.deleteCloudRoute(id);
    }

    async savePlace(placeData) {
        const data = this.normalizePlace(placeData);
        await this.saveLocal(this.storeName, data);
        await this.upsertCloudPlace(data);
        return data;
    }

    async getAllPlaces() {
        return this.getAllLocal(this.storeName);
    }

    async getPlaceById(id) {
        return this.getByIdLocal(this.storeName, id);
    }

    async deletePlace(id) {
        await this.deleteLocal(this.storeName, id);
        await this.deleteCloudPlace(id);
    }
}
