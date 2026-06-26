/* ===========================
   VOID — Main JavaScript
   =========================== */

(() => {
  'use strict';

  // ---- Custom Cursor ----
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  const cursorRing = document.createElement('div');
  cursorRing.className = 'cursor-ring';
  document.body.appendChild(cursor);
  document.body.appendChild(cursorRing);

  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX - 4 + 'px';
    cursor.style.top = mouseY - 4 + 'px';
  });

  function animateCursorRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX - 16 + 'px';
    cursorRing.style.top = ringY - 16 + 'px';
    requestAnimationFrame(animateCursorRing);
  }
  animateCursorRing();

  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; cursorRing.style.opacity = '1'; });
  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; cursorRing.style.opacity = '0'; });

  // Scale cursor ring on hover of interactive elements
  document.querySelectorAll('a, button, .card-3d').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorRing.style.width = '56px';
      cursorRing.style.height = '56px';
      cursorRing.style.marginLeft = '-12px';
      cursorRing.style.marginTop = '-12px';
      cursorRing.style.borderColor = 'rgba(255,255,255,0.6)';
    });
    el.addEventListener('mouseleave', () => {
      cursorRing.style.width = '32px';
      cursorRing.style.height = '32px';
      cursorRing.style.marginLeft = '0';
      cursorRing.style.marginTop = '0';
      cursorRing.style.borderColor = 'rgba(255,255,255,0.4)';
    });
  });

  // ---- Particle System ----
  const canvas = document.getElementById('particles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 80;

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.size = Math.random() * 1.2 + 0.2;
        this.speedX = (Math.random() - 0.5) * 0.15;
        this.speedY = (Math.random() - 0.5) * 0.15;
        this.opacity = Math.random() * 0.35 + 0.05;
        this.life = 0;
        this.maxLife = Math.random() * 400 + 200;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life++;
        // fade in/out
        const halfLife = this.maxLife / 2;
        if (this.life < halfLife) {
          this.currentOpacity = (this.life / halfLife) * this.opacity;
        } else {
          this.currentOpacity = ((this.maxLife - this.life) / halfLife) * this.opacity;
        }
        if (this.life > this.maxLife) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${this.currentOpacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = new Particle();
      p.life = Math.random() * p.maxLife; // stagger starts
      particles.push(p);
    }

    // Mouse-reactive light blob
    let lightX = W / 2, lightY = H / 2;
    let targetLX = W / 2, targetLY = H / 2;

    document.addEventListener('mousemove', (e) => {
      targetLX = e.clientX;
      targetLY = e.clientY;
    });

    function drawParticles() {
      ctx.clearRect(0, 0, W, H);

      // Soft ambient light following mouse
      lightX += (targetLX - lightX) * 0.04;
      lightY += (targetLY - lightY) * 0.04;

      const grad = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, 350);
      grad.addColorStop(0, 'rgba(255,255,255,0.015)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      particles.forEach(p => { p.update(); p.draw(); });

      // Draw subtle connecting lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.04;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

  // ---- 3D Card Tilt ----
  const card3d = document.getElementById('card3d');
  if (card3d) {
    const scene = card3d.closest('.card-scene');
    let cardX = 0, cardY = 0, targetCardX = 0, targetCardY = 0;
    let isHovering = false;
    const shine = card3d.querySelector('.card-shine');

    scene.addEventListener('mousemove', (e) => {
      const rect = card3d.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      targetCardX = -(dy / rect.height) * 22;
      targetCardY = (dx / rect.width) * 22;

      // Shine position
      if (shine) {
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        shine.style.background = `radial-gradient(ellipse at ${px}% ${py}%, rgba(255,255,255,0.1) 0%, transparent 65%)`;
      }
      isHovering = true;
    });

    scene.addEventListener('mouseleave', () => {
      targetCardX = 0;
      targetCardY = 0;
      isHovering = false;
    });

    function animateCard() {
      cardX += (targetCardX - cardX) * 0.1;
      cardY += (targetCardY - cardY) * 0.1;
      const scale = isHovering ? 1.02 : 1;
      card3d.style.transform = `rotateX(${cardX}deg) rotateY(${cardY}deg) scale(${scale})`;
      requestAnimationFrame(animateCard);
    }
    animateCard();
  }

  // ---- Countdown Timer ----
  function updateCountdown() {
    const dropDate = new Date('2025-09-01T00:00:00Z');
    const now = new Date();
    const diff = dropDate - now;

    if (diff <= 0) {
      document.getElementById('days').textContent = '00';
      document.getElementById('hours').textContent = '00';
      document.getElementById('minutes').textContent = '00';
      document.getElementById('seconds').textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = n => String(n).padStart(2, '0');
    document.getElementById('days').textContent = pad(days);
    document.getElementById('hours').textContent = pad(hours);
    document.getElementById('minutes').textContent = pad(minutes);
    document.getElementById('seconds').textContent = pad(seconds);
  }

  if (document.getElementById('seconds')) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // ---- Scroll Animations ----
  const revealEls = document.querySelectorAll(
    '.reveal, .reveal-delay-1, .reveal-delay-2, .reveal-delay-3, .reveal-delay-4'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => observer.observe(el));

  // Registry rows staggered animation
  const registryRows = document.querySelectorAll('.registry-row');
  const registryObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const rows = entry.target.querySelectorAll('.registry-row');
        rows.forEach((row, i) => {
          setTimeout(() => {
            row.classList.add('visible');
            // Animate reserved bars
            const fill = row.querySelector('.reg-bar-fill');
            if (fill && fill.style.width === '100%') {
              fill.style.width = '0%';
              setTimeout(() => { fill.style.width = '100%'; }, 50);
            }
          }, i * 80);
        });
        registryObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  const registryTable = document.querySelector('.registry-table');
  if (registryTable) registryObserver.observe(registryTable);

  // Trigger hero reveals on load
  setTimeout(() => {
    document.querySelectorAll('#hero .reveal, #hero .reveal-delay-1, #hero .reveal-delay-2, #hero .reveal-delay-3, #hero .reveal-delay-4')
      .forEach(el => el.classList.add('visible'));
  }, 100);

  // ---- Parallax on hero ----
  const heroContent = document.querySelector('.hero-content');
  window.addEventListener('scroll', () => {
    if (!heroContent) return;
    const scrollY = window.scrollY;
    heroContent.style.transform = `translateY(${scrollY * 0.25}px)`;
    heroContent.style.opacity = 1 - scrollY / 600;
  }, { passive: true });

  // ---- Nav scroll behavior ----
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      nav.style.background = 'rgba(0,0,0,0.95)';
      nav.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
    } else {
      nav.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)';
      nav.style.borderBottom = 'none';
    }
  }, { passive: true });

})();
(function initVoidMap() {
  const canvas = document.getElementById('worldMap');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Highlighted countries: approximate center coords [lon, lat]
  const HIGHLIGHTS = {
    FR: { lon: 2.3,   lat: 46.2, label: 'FR' },
    US: { lon: -98.5, lat: 39.5, label: 'US' },
    DE: { lon: 10.4,  lat: 51.2, label: 'DE' },
    IT: { lon: 12.5,  lat: 41.9, label: 'IT' },
  };

  // Simplified world SVG path data (Natural Earth low-res)
  // We'll draw via fetch of a TopoJSON-free approach using an inline SVG path
  // For a clean self-contained solution, we draw a stylised dot-grid world map

  let W, H, DPR;
  let animFrame = 0;
  let glowPhase = 0;
  let dots = [];

  // World dot positions — generated from a geographic bitmask
  // Lat/Lon grid: we use a curated set of land coordinates
  const LAND_GRID = generateLandGrid();

  function generateLandGrid() {
    // Simplified land polygon bitmask at 4-degree resolution
    // Each entry: [lonMin, lonMax, latMin, latMax]
    const regions = [
      // North America
      [-140,-60,25,70], [-80,-60,5,25], [-120,-60,25,50],
      // South America
      [-80,-35,-55,10], [-70,-50,-55,-20],
      // Europe
      [-10,40,35,70],
      // Africa
      [-18,52,-35,37],
      // Asia
      [40,145,-10,70], [100,145,0,50], [60,105,10,40],
      // Australia
      [114,154,-40,-10],
      // Greenland
      [-55,-18,60,85],
      // Japan
      [130,145,30,45],
      // UK/Ireland (approx)
      [-8,2,50,60],
      // Scandinavia
      [5,32,55,72],
      // Southeast Asia
      [95,140,-8,25],
      // Indonesia
      [95,141,-8,5],
      // Madagascar
      [44,50,-25,-12],
      // New Zealand (approx)
      [166,178,-47,-34],
    ];

    const grid = [];
    const step = 3;
    regions.forEach(([lon0, lon1, lat0, lat1]) => {
      for (let lon = lon0; lon <= lon1; lon += step) {
        for (let lat = lat0; lat <= lat1; lat += step) {
          grid.push([lon + (Math.random()-0.5)*1.5, lat + (Math.random()-0.5)*1.5]);
        }
      }
    });
    return grid;
  }

  function project(lon, lat, w, h) {
    // Equirectangular projection with slight padding
    const pad = 0.04;
    const x = (lon + 180) / 360 * w * (1 - pad*2) + w * pad;
    const y = (90 - lat) / 180 * h * (1 - pad*2) + h * pad;
    return [x, y];
  }

  function isHighlighted(lon, lat) {
    for (const key of Object.keys(HIGHLIGHTS)) {
      const h = HIGHLIGHTS[key];
      const dlon = Math.abs(lon - h.lon);
      const dlat = Math.abs(lat - h.lat);
      // Generous radius per country
      const radius = key === 'US' ? 22 : key === 'FR' ? 10 : key === 'DE' ? 8 : key === 'IT' ? 8 : 0;
      if (dlon < radius && dlat < radius * 0.7) return key;
    }
    return null;
  }

  function resize() {
    DPR = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    W = rect.width || canvas.parentElement.offsetWidth;
    H = Math.round(W * 0.5); // 2:1 aspect ratio
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);
    buildDots();
  }

  function buildDots() {
    dots = LAND_GRID.map(([lon, lat]) => {
      const [x, y] = project(lon, lat, W, H);
      const hl = isHighlighted(lon, lat);
      return { x, y, lon, lat, hl, phase: Math.random() * Math.PI * 2 };
    });
  }

  function draw(ts) {
    glowPhase = ts * 0.001;
    ctx.clearRect(0, 0, W, H);

    // Background: very subtle grid lines
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 0.5;
    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const [, y] = project(0, lat, W, H);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // Longitude lines
    for (let lon = -120; lon <= 120; lon += 60) {
      const [x] = project(lon, 0, W, H);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // Draw dots
    dots.forEach(d => {
      const isHl = !!d.hl;
      const baseOpacity = isHl ? 0 : 0.18;
      const size = isHl ? 0 : 1.2;

      if (!isHl) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${baseOpacity})`;
        ctx.fill();
      }
    });

    // Draw highlighted country glows
    const hlGroups = {};
    dots.forEach(d => {
      if (d.hl) {
        if (!hlGroups[d.hl]) hlGroups[d.hl] = [];
        hlGroups[d.hl].push(d);
      }
    });

    Object.entries(hlGroups).forEach(([key, pts]) => {
      // Find bounding center
      const cx = pts.reduce((s,p) => s+p.x, 0) / pts.length;
      const cy = pts.reduce((s,p) => s+p.y, 0) / pts.length;

      // Pulsing glow behind
      const glowR = key === 'US' ? 80 : 40;
      const pulse = 0.5 + 0.5 * Math.sin(glowPhase * 1.5 + HIGHLIGHTS[key].lon * 0.1);

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR * (1 + pulse * 0.2));
      grad.addColorStop(0, `rgba(255,255,255,${0.06 + pulse * 0.04})`);
      grad.addColorStop(0.5, `rgba(255,255,255,${0.02 + pulse * 0.02})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, glowR * (1 + pulse * 0.2), 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Dots for this country
      pts.forEach(d => {
        const dotPulse = 0.5 + 0.5 * Math.sin(glowPhase * 2 + d.phase);
        const r = 1.5 + dotPulse * 0.5;
        const op = 0.6 + dotPulse * 0.4;

        // Outer glow
        const dg = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 4);
        dg.addColorStop(0, `rgba(255,255,255,${op * 0.4})`);
        dg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(d.x, d.y, r * 4, 0, Math.PI * 2);
        ctx.fillStyle = dg;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${op})`;
        ctx.fill();
      });

      // Label
      const [lx, ly] = project(HIGHLIGHTS[key].lon, HIGHLIGHTS[key].lat, W, H);
      const labelPulse = 0.7 + 0.3 * Math.sin(glowPhase * 1.5 + HIGHLIGHTS[key].lon * 0.1);
      ctx.font = `200 ${Math.max(8, W * 0.009)}px Inter, sans-serif`;
      ctx.letterSpacing = '0.2em';
      ctx.fillStyle = `rgba(255,255,255,${labelPulse * 0.7})`;
      ctx.textAlign = 'center';
      const offset = key === 'US' ? -14 : key === 'DE' ? -10 : key === 'IT' ? 10 : -10;
      ctx.fillText(key, lx, ly + offset);
      ctx.letterSpacing = '0';
    });

    // Ping rings on country centers
    Object.entries(HIGHLIGHTS).forEach(([key, h]) => {
      const [px, py] = project(h.lon, h.lat, W, H);
      const ringPhase = (glowPhase * 0.7 + Object.keys(HIGHLIGHTS).indexOf(key) * 0.8) % (Math.PI * 2);
      const progress = (Math.sin(ringPhase) + 1) / 2; // 0 to 1
      const maxR = key === 'US' ? 28 : 18;
      const ringR = progress * maxR;
      const ringOp = (1 - progress) * 0.5;

      if (ringOp > 0.01) {
        ctx.beginPath();
        ctx.arc(px, py, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${ringOp})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    });

    requestAnimationFrame(draw);
  }

  // Init
  // Small delay so layout is settled
  setTimeout(() => {
    resize();
    requestAnimationFrame(draw);
  }, 200);

  window.addEventListener('resize', () => {
    resize();
  });
})();
