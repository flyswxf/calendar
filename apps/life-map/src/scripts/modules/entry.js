/**
 * EntryManager - 管理入口界面 (Landing -> Dashboard -> Detail)
 */
export class EntryManager {
    /**
     * @param {StorageService} storageService 
     * @param {MapManager} mapManager 
     */
    constructor(storageService, mapManager) {
        this.storageService = storageService;
        this.mapManager = mapManager;
        
        // DOM Elements
        this.landingPage = document.getElementById('landing-page');
        this.dashboard = document.getElementById('dashboard');
        this.detailModal = document.getElementById('detail-view-modal');
        
        // Buttons
        this.btnStart = document.getElementById('btn-start');
        this.btnEnterMap = document.getElementById('btn-enter-map');
        this.btnFlyTo = document.getElementById('btn-fly-to');
        this.btnDetailClose = document.querySelector('.detail-close-btn');
        
        // Dashboard Elements
        this.statCount = document.getElementById('stat-count');
        this.recentList = document.getElementById('recent-list');
        
        // Detail View Elements
        this.detailImage = document.getElementById('detail-image');
        this.detailTitle = document.getElementById('detail-title');
        this.detailDate = document.getElementById('detail-date');
        this.detailBody = document.getElementById('detail-body');
        this.detailCard = document.querySelector('.detail-card');
        
        this.currentPlace = null; // Store current place in detail view
    }

    init() {
        this.bindEvents();
        console.log('EntryManager initialized');
    }

    bindEvents() {
        // Landing Page -> Dashboard
        this.btnStart.addEventListener('click', () => {
            this.transitionToDashboard();
        });

        // Dashboard -> Map
        this.btnEnterMap.addEventListener('click', () => {
            this.closeDashboard();
        });

        // Detail View Interactions
        this.btnDetailClose.addEventListener('click', () => {
            this.closeDetailModal();
        });

        this.btnFlyTo.addEventListener('click', () => {
            this.handleFlyTo();
        });

        // Close Detail Modal when clicking outside card
        this.detailModal.addEventListener('click', (e) => {
            if (e.target === this.detailModal) {
                this.closeDetailModal();
            }
        });
    }

    async transitionToDashboard() {
        // 1. Hide Landing Page
        this.landingPage.classList.add('fade-out');
        setTimeout(() => {
            this.landingPage.classList.add('hidden');
        }, 500);

        // 2. Load Data
        await this.updateDashboard();

        // 3. Show Dashboard
        this.dashboard.classList.remove('hidden');
        // Simple animation entrance could be added here if needed
    }

    async updateDashboard() {
        try {
            const places = await this.storageService.getAllPlaces();
            
            // Update Stats
            this.statCount.textContent = places.length;
            
            // Sort by updated time (newest first)
            const sortedPlaces = places.sort((a, b) => {
                const timeA = a.updatedAt || a.createdAt || 0;
                const timeB = b.updatedAt || b.createdAt || 0;
                return timeB - timeA;
            });

            // Update Recent List (Take top 4)
            this.renderRecentList(sortedPlaces.slice(0, 4));
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.recentList.innerHTML = '<div class="recent-item">无法加载数据</div>';
        }
    }

    renderRecentList(places) {
        this.recentList.innerHTML = '';

        if (places.length === 0) {
            this.recentList.innerHTML = `
                <div class="recent-item" style="text-align: center; color: #9ca3af; cursor: default;">
                    暂无记录，快去地图上探索吧！
                </div>`;
            return;
        }

        places.forEach(place => {
            const item = document.createElement('div');
            item.className = 'recent-item';
            
            const dateStr = new Date(place.eventDate || place.createdAt).toLocaleDateString();
            
            item.innerHTML = `
                <div class="recent-item-title">${place.title || '未知地点'}</div>
                <div class="recent-item-date">${dateStr}</div>
            `;
            
            item.addEventListener('click', () => {
                this.openDetailModal(place);
            });
            
            this.recentList.appendChild(item);
        });
    }

    closeDashboard() {
        this.dashboard.classList.add('fade-out');
        setTimeout(() => {
            this.dashboard.classList.add('hidden');
            this.dashboard.classList.remove('fade-out'); // Reset for next time if needed
        }, 500);
    }

    openDetailModal(place) {
        this.currentPlace = place;
        
        // Populate Data
        this.detailTitle.textContent = place.title || '无标题';
        this.detailDate.textContent = new Date(place.eventDate || place.createdAt).toLocaleDateString();
        this.detailBody.innerHTML = place.content || '暂无详细内容';
        
        // Handle Image
        let imageUrl = null;
        if (place.coverImage) {
            imageUrl = URL.createObjectURL(place.coverImage);
        } else if (place.images && place.images.length > 0) {
            // If no cover but has images, use first image
            imageUrl = URL.createObjectURL(place.images[0]);
        } else if (place.media && place.media.length > 0 && place.media[0].blob) {
             // Compatibility with older schema if any
             imageUrl = URL.createObjectURL(place.media[0].blob);
        }

        if (imageUrl) {
            this.detailImage.src = imageUrl;
            this.detailCard.classList.remove('no-image');
        } else {
            this.detailCard.classList.add('no-image');
        }

        // Show Modal
        this.detailModal.classList.add('active');
    }

    closeDetailModal() {
        this.detailModal.classList.remove('active');
        this.currentPlace = null;
        
        // Cleanup Image Object URL to avoid memory leaks
        // (Optional but good practice, though we might reuse it if user re-opens... 
        // simpler to just let browser handle or revoke if we were strict)
    }

    handleFlyTo() {
        if (!this.currentPlace) return;

        const { lat, lng } = this.currentPlace;
        
        // Close everything
        this.closeDetailModal();
        this.closeDashboard();
        
        // Fly
        this.mapManager.flyTo(lat, lng, 16);
    }
}
