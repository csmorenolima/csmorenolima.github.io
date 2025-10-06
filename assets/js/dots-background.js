// Interactive Background Animation
class InteractiveBackground {
    constructor() {
        this.canvas = document.getElementById('interactive-bg');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.colors = ['#047ab3', '#018985', '#01a573', '#ffffff'];
        
        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }

    resize() {
        const wrapper = document.querySelector('.page-wrapper');
        const fullHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = fullHeight;
        
        // Update wrapper height to match
        if (wrapper) {
            wrapper.style.minHeight = fullHeight + 'px';
        }
    }

    createParticles() {
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                opacity: Math.random() * 0.6 + 0.2,
                connectionDistance: 120
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            // Recreate particles after resize
            this.particles = [];
            this.createParticles();
        });

        // Also update when page content changes (scroll height changes)
        let resizeTimeout;
        const checkResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const currentHeight = this.canvas.height;
                const newHeight = Math.max(
                    document.body.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.clientHeight,
                    document.documentElement.scrollHeight,
                    document.documentElement.offsetHeight
                );
                
                if (Math.abs(newHeight - currentHeight) > 10) { // Only update if significant change
                    this.resize();
                    this.particles = [];
                    this.createParticles();
                }
            }, 100);
        };

        // Multiple ways to detect content changes
        const resizeObserver = new ResizeObserver(checkResize);
        resizeObserver.observe(document.body);
        resizeObserver.observe(document.documentElement);
        
        // Also listen for scroll events that might indicate content changes
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(checkResize, 200);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('click', (e) => {
            this.createExplosion(this.mouse.x, this.mouse.y);
        });
    }

    createExplosion(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 8,
                speedY: (Math.random() - 0.5) * 8,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                opacity: 1,
                life: 60,
                maxLife: 60,
                connectionDistance: 0
            });
        }
    }

    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.opacity;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const particle1 = this.particles[i];
                const particle2 = this.particles[j];
                
                if (!particle1.connectionDistance || !particle2.connectionDistance) continue;
                
                const distance = Math.sqrt(
                    Math.pow(particle1.x - particle2.x, 2) + 
                    Math.pow(particle1.y - particle2.y, 2)
                );

                if (distance < particle1.connectionDistance) {
                    this.ctx.save();
                    this.ctx.globalAlpha = (1 - distance / particle1.connectionDistance) * 0.3;
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle1.x, particle1.y);
                    this.ctx.lineTo(particle2.x, particle2.y);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Move particle
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Mouse interaction
            if (particle.connectionDistance > 0) {
                const mouseDistance = Math.sqrt(
                    Math.pow(particle.x - this.mouse.x, 2) + 
                    Math.pow(particle.y - this.mouse.y, 2)
                );
                
                if (mouseDistance < 100) {
                    const force = (100 - mouseDistance) / 100;
                    const angle = Math.atan2(particle.y - this.mouse.y, particle.x - this.mouse.x);
                    particle.speedX += Math.cos(angle) * force * 0.01;
                    particle.speedY += Math.sin(angle) * force * 0.01;
                }
            }
            
            // Boundary collision
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.speedX *= -0.8;
                particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.speedY *= -0.8;
                particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            }
            
            // Handle explosion particles
            if (particle.life !== undefined) {
                particle.life--;
                particle.opacity = particle.life / particle.maxLife;
                if (particle.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
            
            // Add some friction
            particle.speedX *= 0.99;
            particle.speedY *= 0.99;
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.updateParticles();
        this.drawConnections();
        
        this.particles.forEach(particle => {
            this.drawParticle(particle);
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize background when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new InteractiveBackground();
});