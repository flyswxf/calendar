import { StorageService } from './modules/storage.js';

class DetailPage {
    constructor() {
        this.storageService = new StorageService();
        this.placeId = null;
        this.currentPlace = null;
        this.isDirty = false;

        this.elements = {
            date: document.getElementById('diary-date'),
            coords: document.getElementById('diary-coords'),
            title: document.getElementById('diary-title'),
            content: document.getElementById('diary-content'),
            btnBack: document.getElementById('btn-back'),
            btnFlyTo: document.getElementById('btn-fly-to'),
            btnSave: document.getElementById('btn-save')
        };
    }

    async init() {
        try {
            await this.storageService.init();
            
            // Get ID from URL
            const params = new URLSearchParams(window.location.search);
            this.placeId = params.get('id');

            if (!this.placeId) {
                alert('无效的访问链接');
                window.location.href = 'dashboard.html';
                return;
            }

            // Load data
            this.currentPlace = await this.storageService.getPlaceById(this.placeId);
            
            if (!this.currentPlace) {
                alert('找不到该记录');
                window.location.href = 'dashboard.html';
                return;
            }

            this.render();
            this.bindEvents();
            
            console.log('Detail Page initialized');
        } catch (error) {
            console.error('Initialization failed:', error);
            alert('加载失败，请重试');
        }
    }

    render() {
        const place = this.currentPlace;
        
        // Date
        const date = new Date(place.eventDate || place.createdAt).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        this.elements.date.textContent = date;

        // Coords
        this.elements.coords.textContent = `${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`;

        // Content
        this.elements.title.value = place.title || '';
        this.elements.content.value = place.description || ''; // Assuming 'description' holds the content
    }

    bindEvents() {
        // Input changes -> Dirty state
        ['input', 'change'].forEach(event => {
            this.elements.title.addEventListener(event, () => this.setDirty(true));
            this.elements.content.addEventListener(event, () => this.setDirty(true));
        });

        // Save Button
        this.elements.btnSave.addEventListener('click', () => this.saveChanges());

        // Back Button
        this.elements.btnBack.addEventListener('click', () => this.handleNavigation('dashboard.html'));

        // Fly To Button
        this.elements.btnFlyTo.addEventListener('click', () => {
            const { lat, lng } = this.currentPlace;
            this.handleNavigation(`map.html?flyTo=${lat},${lng}`);
        });

        // Window Unload Warning
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
            }
        });
    }

    setDirty(dirty) {
        this.isDirty = dirty;
        this.elements.btnSave.disabled = !dirty;
        this.elements.btnSave.textContent = dirty ? '保存修改 *' : '保存修改';
    }

    async saveChanges() {
        if (!this.isDirty) return;

        try {
            const updatedPlace = {
                ...this.currentPlace,
                title: this.elements.title.value,
                description: this.elements.content.value,
                updatedAt: Date.now()
            };

            await this.storageService.savePlace(updatedPlace);
            
            this.currentPlace = updatedPlace;
            this.setDirty(false);
            
            // Optional: Show toast notification
            this.elements.btnSave.textContent = '已保存';
            setTimeout(() => {
                if (!this.isDirty) this.elements.btnSave.textContent = '保存修改';
            }, 2000);

        } catch (error) {
            console.error('Save failed:', error);
            alert('保存失败，请重试');
        }
    }

    handleNavigation(url) {
        if (this.isDirty) {
            const confirmLeave = confirm('您有未保存的修改，确定要离开吗？');
            if (!confirmLeave) return;
        }
        window.location.href = url;
    }
}

// Initialize
const detailPage = new DetailPage();
document.addEventListener('DOMContentLoaded', () => detailPage.init());
