/**
 * Landing Page Animation Script
 * Generates a constellation/network effect on canvas
 */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('landing-canvas');
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let points = [];
    const POINT_COUNT = 60;
    const CONNECTION_DISTANCE = 150;

    // Resize handler
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        initPoints();
    }

    class Point {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(245, 158, 11, 0.6)'; // Accent Gold
            ctx.fill();
        }
    }

    function initPoints() {
        points = [];
        for (let i = 0; i < POINT_COUNT; i++) {
            points.push(new Point());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Draw connections first
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;

        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            p1.update();
            p1.draw();

            for (let j = i + 1; j < points.length; j++) {
                const p2 = points[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECTION_DISTANCE) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    // Init
    resize();
    window.addEventListener('resize', resize);
    animate();

    // Interaction
    const btn = document.getElementById('enter-btn');
    btn.addEventListener('click', () => {
        document.body.style.opacity = 0;
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    });
});
