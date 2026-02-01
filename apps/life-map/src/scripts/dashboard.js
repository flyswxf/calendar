import { StorageService } from './modules/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    const storageService = new StorageService();
    await storageService.init();

    const statCount = document.getElementById('stat-count');
    const logList = document.getElementById('log-list');
    const routeList = document.getElementById('route-list');
    const btnOpenMap = document.getElementById('btn-open-map');
    const btnCreateRoute = document.getElementById('btn-create-route');

    // Load Data
    try {
        await loadAndRenderData();
    } catch (e) {
        console.error(e);
    }

    // Navigation
    btnOpenMap.addEventListener('click', () => {
        window.location.href = 'map.html';
    });

    // Create Route
    if (btnCreateRoute) {
        btnCreateRoute.addEventListener('click', () => {
            window.location.href = 'map.html?routeId=new';
        });
    }

    async function loadAndRenderData() {
        const places = await storageService.getAllPlaces();
        const routes = await storageService.getAllRoutes();
        
        // Update Stats
        if (statCount) {
            animateValue(statCount, 0, places.length, 1500);
        }

        // Sort by date desc
        const sortedPlaces = places.sort((a, b) => {
            return (b.eventDate || b.createdAt) - (a.eventDate || a.createdAt);
        });

        renderList(sortedPlaces);
        renderRouteList(routes);
    }

    function renderList(places) {
        const container = document.getElementById('log-list');
        if (!container) return;
        
        container.innerHTML = '';

        if (places.length === 0) {
            container.innerHTML = '<div class="log-item" style="justify-content:center; color:#94a3b8;">暂无记录 // NO DATA</div>';
            return;
        }

        places.forEach(place => {
            const div = document.createElement('div');
            div.className = 'log-item mono';
            
            const date = new Date(place.eventDate || place.createdAt).toLocaleDateString();
            const lat = place.lat.toFixed(4);
            const lng = place.lng.toFixed(4);

            div.innerHTML = `
                <span class="log-date">${date}</span>
                <span class="log-title">${place.title}</span>
                <span class="log-coords">[${lat}, ${lng}]</span>
                <span class="log-arrow">-></span>
            `;

            div.addEventListener('click', () => {
                // Navigate to detail page
                window.location.href = `detail.html?id=${place.id}`;
            });

            container.appendChild(div);
        });
    }

    function renderRouteList(routes) {
        const container = document.getElementById('route-list');
        if (!container) return;
        
        container.innerHTML = '';

        if (!routes || routes.length === 0) {
            container.innerHTML = '<div class="log-item" style="justify-content:center; color:#94a3b8;">暂无路线 // NO ROUTES</div>';
            return;
        }

        // Sort routes by createdAt desc
        routes.sort((a, b) => b.createdAt - a.createdAt);

        routes.forEach(route => {
            const div = document.createElement('div');
            div.className = 'log-item mono';
            div.style.cursor = 'pointer';
            
            const count = route.placeIds ? route.placeIds.length : 0;
            const date = new Date(route.createdAt).toLocaleDateString();

            // Structure: Date | Title | Count | Actions
            // We build innerHTML carefully to allow event listeners on buttons if we were to inject them via string, 
            // but for the delete button, it's safer to append element or use event delegation.
            // Here we use innerHTML for layout and then append the delete button? 
            // Or just put everything in innerHTML and find the button.

            div.innerHTML = `
                <div style="display:flex; flex:1; align-items:center; gap:10px;">
                    <span class="log-date">${date}</span>
                    <span class="log-title" style="flex:1">${route.name || '未命名路线'}</span>
                    <span class="log-coords">[${count}个地点]</span>
                </div>
                <div class="actions" style="display:flex; align-items:center; gap:10px;">
                    <span class="log-arrow">EDIT</span>
                    <button class="btn-delete-route" style="border:none; background:none; color:#ef4444; font-weight:bold; cursor:pointer; padding:5px;">×</button>
                </div>
            `;

            div.addEventListener('click', (e) => {
                // Check if delete button was clicked
                if (e.target.classList.contains('btn-delete-route')) {
                    e.stopPropagation();
                    if (confirm('确定要删除这条路线吗？')) {
                        storageService.deleteRoute(route.id).then(() => {
                            loadAndRenderData();
                        });
                    }
                    return;
                }
                
                window.location.href = `map.html?routeId=${route.id}`;
            });

            container.appendChild(div);
        });
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
});
