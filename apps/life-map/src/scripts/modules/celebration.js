/**
 * CelebrationManager - 处理庆祝效果 (Confetti + Emojis)
 * 使用 canvas-confetti 库来实现高性能彩带效果
 */
export class CelebrationManager {
    constructor() {
        this.container = null;
        this.ensureContainer();
    }

    /**
     * 确保庆祝效果容器存在
     */
    ensureContainer() {
        let container = document.getElementById('celebration-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'celebration-container';
            container.className = 'celebration-container';
            document.body.appendChild(container);
        }
        this.container = container;
    }

    /**
     * 触发完整庆祝效果
     */
    celebrate() {
        this.fireConfetti();
        this.popEmojis();
    }

    /**
     * 发射彩带 (使用 canvas-confetti)
     * 如果未加载库，则降级处理或尝试动态加载
     */
    fireConfetti() {
        // 检查 window.confetti 是否存在 (假设通过 CDN 引入)
        if (typeof window.confetti === 'function') {
            const duration = 2000;
            const end = Date.now() + duration;

            // 屏幕两侧发射
            (function frame() {
                window.confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.8 }, // 左侧底部
                    colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
                });
                window.confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.8 }, // 右侧底部
                    colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        } else {
            console.warn('canvas-confetti library not loaded.');
            // 可以在这里实现一个简单的 CSS fallback
        }
    }

    /**
     * 弹出 Emoji 喝彩
     */
    popEmojis() {
        const emojis = ['🎉', '🥳', '👏', '✨', '💖', '🎈'];
        const count = 15; // 产生的数量

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createFloatingEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
            }, i * 200); // 错开时间
        }
    }

    /**
     * 创建单个漂浮 Emoji
     * @param {string} emojiChar 
     */
    createFloatingEmoji(emojiChar) {
        const el = document.createElement('div');
        el.className = 'celebration-emoji';
        el.textContent = emojiChar;
        
        // 随机位置 (底部水平分布)
        const left = 10 + Math.random() * 80; // 10% - 90%
        el.style.left = `${left}%`;
        
        // 随机大小微调
        const scale = 0.8 + Math.random() * 0.5;
        el.style.transform = `scale(${scale})`;

        this.container.appendChild(el);

        // 动画结束后移除
        el.addEventListener('animationend', () => {
            el.remove();
        });
    }
}