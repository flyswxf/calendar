/**
 * UIManager - 处理 UI 交互
 */
export class UIManager {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.searchInput = document.getElementById('search-input');
        this.searchContainer = document.querySelector('.search-container');
        
        // 侧边栏元素
        this.cardEditor = document.getElementById('card-editor');
        this.closeBtn = document.querySelector('.close-btn');
        this.saveBtn = document.getElementById('save-btn');
        this.deleteBtn = document.getElementById('delete-btn');
        
        // 表单元素
        this.form = {
            id: document.getElementById('place-id'),
            lat: document.getElementById('place-lat'),
            lng: document.getElementById('place-lng'),
            title: document.getElementById('place-title'),
            date: document.getElementById('place-date'),
            content: document.getElementById('place-content'),
            images: document.getElementById('place-images')
        };
        
        // 图片预览容器
        this.imagePreviewContainer = document.getElementById('image-preview-container');
        this.currentImages = []; // 存储当前的 Blob/File 对象

        // 创建搜索结果容器
        this.resultsContainer = document.createElement('div');
        this.resultsContainer.id = 'search-results';
        this.resultsContainer.className = 'search-results';
        this.searchContainer.appendChild(this.resultsContainer);

        this.initEventListeners();
    }

    initEventListeners() {
        // 图片选择监听
        this.form.images.addEventListener('change', (e) => {
            this.handleImageSelect(e);
        });

        // 搜索输入监听 (防抖处理由调用方传入)
        if (this.callbacks.onSearchInput) {
            this.searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                this.callbacks.onSearchInput(query);
            });
        }

        // 点击外部关闭搜索结果
        document.addEventListener('click', (e) => {
            if (this.searchContainer && !this.searchContainer.contains(e.target)) {
                this.clearSearchResults();
            }
        });

        // 关闭侧边栏
        this.closeBtn.addEventListener('click', () => {
            this.closeEditor();
        });

        // 保存按钮
        this.saveBtn.addEventListener('click', () => {
            if (this.callbacks.onSave) {
                const data = this.getFormData();
                this.callbacks.onSave(data);
            }
        });

        // 删除按钮
        this.deleteBtn.addEventListener('click', () => {
            const id = this.form.id.value;
            if (id && this.callbacks.onDelete) {
                if (confirm('确定要删除这个地点的记忆吗？')) {
                    this.callbacks.onDelete(id);
                }
            }
        });
    }

    /**
     * 处理图片选择
     */
    handleImageSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        files.forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
            this.currentImages.push(file);
            this.addImagePreview(file);
        });

        // 清空 input，允许重复选择同一文件
        e.target.value = '';
    }

    /**
     * 添加图片预览
     * @param {Blob|File} file 
     */
    addImagePreview(file) {
        const url = URL.createObjectURL(file);
        
        const item = document.createElement('div');
        item.className = 'image-preview-item';
        
        const img = document.createElement('img');
        img.src = url;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-img-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = '移除图片';
        
        removeBtn.addEventListener('click', () => {
            // 从数组中移除
            const index = this.currentImages.indexOf(file);
            if (index > -1) {
                this.currentImages.splice(index, 1);
            }
            // 移除 DOM
            item.remove();
            // 释放 URL 对象
            URL.revokeObjectURL(url);
        });

        item.appendChild(img);
        item.appendChild(removeBtn);
        this.imagePreviewContainer.appendChild(item);
    }

    /**
     * 打开卡片编辑器
     * @param {Object} data 初始数据
     */
    openEditor(data = {}) {
        this.form.id.value = data.id || '';
        this.form.lat.value = data.lat || '';
        this.form.lng.value = data.lng || '';
        this.form.title.value = data.title || '';
        this.form.date.value = data.date || new Date().toISOString().split('T')[0];
        this.form.content.value = data.content || '';

        // 清空之前的图片
        this.imagePreviewContainer.innerHTML = '';
        this.currentImages = [];

        // 如果有已有图片，加载显示
        if (data.images && Array.isArray(data.images)) {
            data.images.forEach(blob => {
                this.currentImages.push(blob);
                this.addImagePreview(blob);
            });
        }

        // 如果是现有记录，显示删除按钮
        if (data.id) {
            this.deleteBtn.style.display = 'block';
        } else {
            this.deleteBtn.style.display = 'none';
        }

        this.cardEditor.classList.add('active');
    }

    /**
     * 关闭编辑器
     */
    closeEditor() {
        this.cardEditor.classList.remove('active');
        // 清空表单
        this.form.id.value = '';
        this.form.lat.value = '';
        this.form.lng.value = '';
        this.form.title.value = '';
        this.form.content.value = '';
        
        // 清空图片预览
        this.imagePreviewContainer.innerHTML = '';
        this.currentImages = [];
    }

    /**
     * 获取表单数据
     */
    getFormData() {
        return {
            id: this.form.id.value,
            lat: parseFloat(this.form.lat.value),
            lng: parseFloat(this.form.lng.value),
            title: this.form.title.value,
            eventDate: new Date(this.form.date.value).getTime(),
            content: this.form.content.value,
            images: [...this.currentImages] // 复制一份数组
        };
    }

    /**
     * 渲染搜索结果列表
     * @param {Array} results 
     */
    renderSearchResults(results) {
        this.resultsContainer.innerHTML = '';
        
        if (results.length === 0) {
            this.resultsContainer.style.display = 'none';
            return;
        }

        this.resultsContainer.style.display = 'block';
        
        const ul = document.createElement('ul');
        results.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.display_name;
            li.addEventListener('click', () => {
                if (this.callbacks.onResultSelect) {
                    this.callbacks.onResultSelect(item);
                }
                this.clearSearchResults();
                this.searchInput.value = item.display_name;
            });
            ul.appendChild(li);
        });
        
        this.resultsContainer.appendChild(ul);
    }

    /**
     * 清除搜索结果
     */
    clearSearchResults() {
        this.resultsContainer.innerHTML = '';
        this.resultsContainer.style.display = 'none';
    }
}
