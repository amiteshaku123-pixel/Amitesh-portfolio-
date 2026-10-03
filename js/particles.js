// Vyom 3D Lok - Space & Cosmic Canvas Particle System
class CosmicParticles {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 150 };
    
    this.init();
    this.animate();
    
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => this.mousemove(e));
    window.addEventListener('mouseleave', () => this.mouseleave());
  }

  init() {
    this.resize();
    const particleCount = Math.min(Math.floor((this.canvas.width * this.canvas.height) / 12000), 100);
    this.particles = [];
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        color: this.getRandomColor()
      });
    }
  }

  getRandomColor() {
    const r = Math.random();
    if (r < 0.4) return 'rgba(123, 31, 162, 0.4)';  // Neon Purple
    if (r < 0.8) return 'rgba(0, 188, 212, 0.4)';   // Electric Cyan
    return 'rgba(233, 30, 99, 0.4)';                // Neon Pink
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight || window.innerHeight;
  }

  mousemove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  mouseleave() {
    this.mouse.x = null;
    this.mouse.y = null;
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render glowing gradient background behind particles
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 10,
      this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height)
    );
    gradient.addColorStop(0, '#07111f');
    gradient.addColorStop(1, '#0a0a0a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.speedX;
      p.y += p.speedY;

      // Bounce borders
      if (p.x < 0 || p.x > this.canvas.width) p.speedX *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.speedY *= -1;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = p.size * 2;
      this.ctx.shadowColor = p.color;
      this.ctx.fill();
      this.ctx.shadowBlur = 0; // reset blur

      // Draw lines between close particles
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        
        if (dist < 100) {
          const alpha = (100 - dist) / 1000;
          this.ctx.strokeStyle = `rgba(0, 188, 212, ${alpha})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }

      // Interaction with mouse
      if (this.mouse.x !== null) {
        const mouseDist = Math.hypot(p.x - this.mouse.x, p.y - this.mouse.y);
        if (mouseDist < this.mouse.radius) {
          const force = (this.mouse.radius - mouseDist) / this.mouse.radius;
          const angle = Math.atan2(p.y - this.mouse.y, p.x - this.mouse.x);
          
          // Gently push particles away from mouse
          p.x += Math.cos(angle) * force * 1.5;
          p.y += Math.sin(angle) * force * 1.5;
          
          // Draw connection line to mouse
          const lineAlpha = force * 0.15;
          this.ctx.strokeStyle = `rgba(123, 31, 162, ${lineAlpha})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.stroke();
        }
      }
    }
    
    requestAnimationFrame(() => this.animate());
  }
}

// Export initialization hook
window.initCosmicParticles = (canvasId) => {
  new CosmicParticles(canvasId);
};
