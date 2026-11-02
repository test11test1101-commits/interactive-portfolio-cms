/**
 * Interactive Clothesline & Rail Physics Engine
 * Implements SVG catenary wire, tangent angle distribution,
 * momentum drag physics, and damped pendulum oscillation.
 */

export class ClotheslineRail {
  constructor({ containerId, wirePathId, itemsLayerId, projects, onSelectProject }) {
    this.container = document.getElementById(containerId);
    this.wirePath = document.getElementById(wirePathId);
    this.itemsLayer = document.getElementById(itemsLayerId);
    this.allProjects = projects;
    this.filteredProjects = [...projects];
    this.onSelectProject = onSelectProject;

    // Physics State
    this.scrollX = 0;
    this.targetScrollX = 0;
    this.velocityX = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartScrollX = 0;
    this.lastPointerX = 0;
    this.lastPointerTime = 0;
    this.pointerVelocity = 0;

    // Angular Oscillation for Hangers
    this.angularVelocities = [];
    this.angularAngles = [];

    // Configuration
    this.tension = 0.55; // 0 = very saggy, 1 = taut
    this.activeFilter = "all";

    // Bindings
    this.handleResize = this.handleResize.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.tick = this.tick.bind(this);

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateDimensions();
    this.renderHangers();
    requestAnimationFrame(this.tick);
  }

  setupEventListeners() {
    window.addEventListener("resize", this.handleResize);

    // Pointer events on container for drag & flick
    this.container.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("pointercancel", this.handlePointerUp);

    // Wheel support for horizontal trackpad scrolling
    this.container.addEventListener("wheel", (e) => {
      // Allow natural horizontal or vertical scrolling translated to rail motion
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY * 0.6;
      this.targetScrollX -= delta * 0.75;
      this.clampTargetScroll();
    }, { passive: true });
  }

  setFilter(category) {
    this.activeFilter = category;
    if (category === "all") {
      this.filteredProjects = [...this.allProjects];
    } else {
      this.filteredProjects = this.allProjects.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
    }
    this.scrollX = 0;
    this.targetScrollX = 0;
    this.renderHangers();
  }

  setTension(tensionValue) {
    this.tension = Math.max(0.1, Math.min(1, tensionValue));
    this.updateDimensions();
  }

  updateDimensions() {
    if (!this.container || !this.wirePath) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Dynamic Sag Calculation
    const startY = height * 0.22;
    const endY = height * 0.22;
    // Lower tension = deeper sag
    const sagDepth = (1.1 - this.tension) * (height * 0.42);
    const controlY = startY + sagDepth;
    const controlX = width / 2;

    // Construct Quadratic Bézier Curve
    const d = `M 0,${startY.toFixed(2)} Q ${controlX.toFixed(2)},${controlY.toFixed(2)} ${width.toFixed(2)},${endY.toFixed(2)}`;
    this.wirePath.setAttribute("d", d);
  }

  handleResize() {
    this.updateDimensions();
    this.clampTargetScroll();
  }

  clampTargetScroll() {
    const minScroll = -Math.max(0, (this.filteredProjects.length * 360) - this.container.clientWidth * 0.65);
    const maxScroll = Math.max(0, this.container.clientWidth * 0.15);
    this.targetScrollX = Math.max(minScroll, Math.min(maxScroll, this.targetScrollX));
  }

  handlePointerDown(e) {
    // If clicking a button directly, don't drag
    if (e.target.closest("button") && !e.target.closest(".hanger-card")) return;

    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartScrollX = this.scrollX;
    this.lastPointerX = e.clientX;
    this.lastPointerTime = performance.now();
    this.pointerVelocity = 0;
    this.container.classList.add("dragging");
  }

  handlePointerMove(e) {
    if (!this.isDragging) return;

    const currentX = e.clientX;
    const now = performance.now();
    const dt = Math.max(1, now - this.lastPointerTime);
    const dx = currentX - this.lastPointerX;

    this.pointerVelocity = (dx / dt) * 16.6; // normalized velocity per frame
    this.lastPointerX = currentX;
    this.lastPointerTime = now;

    const deltaX = currentX - this.dragStartX;
    this.targetScrollX = this.dragStartScrollX + deltaX;

    // Displace angular tilt of all garments in the direction of drag
    const tilt = Math.max(-14, Math.min(14, -this.pointerVelocity * 1.8));
    this.angularAngles.forEach((_, i) => {
      this.angularAngles[i] = tilt;
    });
  }

  handlePointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.container.classList.remove("dragging");

    // Apply release momentum
    this.targetScrollX += this.pointerVelocity * 12;
    this.clampTargetScroll();

    // Release spring angular velocity
    this.angularVelocities.forEach((_, i) => {
      this.angularVelocities[i] = -this.pointerVelocity * 0.8;
    });
  }

  scrollStep(direction) {
    const step = 380;
    this.targetScrollX += (direction > 0 ? -step : step);
    this.clampTargetScroll();
  }

  renderHangers() {
    this.itemsLayer.innerHTML = "";
    this.angularVelocities = new Array(this.filteredProjects.length).fill(0);
    this.angularAngles = new Array(this.filteredProjects.length).fill(0);

    this.filteredProjects.forEach((project, index) => {
      const hanger = document.createElement("div");
      hanger.className = "hanger-item";
      hanger.setAttribute("data-id", project.id);
      hanger.setAttribute("role", "button");
      hanger.setAttribute("tabindex", "0");
      hanger.setAttribute("aria-label", `View ${project.title} Case Study`);

      // Tag List HTML
      const techBadges = project.tech.slice(0, 3).map(t => `<span class="tag-pill">${t}</span>`).join("");

      hanger.innerHTML = `
        <!-- Floating Price / Metric Tag -->
        <div class="hanger-tag">
          <span class="tag-year">${project.year}</span>
          <span class="tag-divider">/</span>
          <span class="tag-highlight">${project.badge}</span>
        </div>

        <!-- Realistic Laser-Cut Metal Hanger Hook -->
        <div class="hanger-hook">
          <svg viewBox="0 0 48 54" width="38" height="44" fill="none">
            <defs>
              <linearGradient id="metalGrad-${project.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#E5E5E5" />
                <stop offset="50%" stop-color="#888888" />
                <stop offset="100%" stop-color="#444444" />
              </linearGradient>
            </defs>
            <!-- Wire Hook Loop -->
            <path d="M 24 52 C 24 40, 24 28, 24 22 C 24 10, 36 10, 36 18 C 36 21, 33 24, 29 23" 
                  stroke="url(#metalGrad-${project.id})" stroke-width="2.6" stroke-linecap="round" fill="none"/>
            <!-- Hanger Triangular Shoulder Bar -->
            <path d="M 4 48 L 24 38 L 44 48" 
                  stroke="url(#metalGrad-${project.id})" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- Garment / Project Card -->
        <div class="hanger-card">
          <div class="card-media">
            ${project.video ? '<span class="card-video-pill">🎬 Video</span>' : ''}
            <img src="${project.image}" alt="${project.title} interface preview" loading="lazy" />
            <div class="media-overlay">
              <span class="quick-action">Explore Case Study ↗</span>
            </div>
          </div>
          <div class="card-info">
            <div class="card-meta">
              <span class="card-category">${project.category}</span>
              <span class="card-index">0${index + 1}</span>
            </div>
            <h3 class="card-title">${project.title}</h3>
            <p class="card-tagline">${project.tagline}</p>
            <div class="card-tech">
              ${techBadges}
            </div>
          </div>
        </div>
      `;

      // Click to Expand
      hanger.addEventListener("click", (e) => {
        // Prevent click if we were just dragging vigorously
        if (Math.abs(this.pointerVelocity) > 2) return;
        this.onSelectProject(project, hanger);
      });

      hanger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.onSelectProject(project, hanger);
        }
      });

      // Individual Pendulum Sway on Hover
      hanger.addEventListener("mouseenter", () => {
        this.angularVelocities[index] = (Math.random() > 0.5 ? 4.5 : -4.5);
      });

      this.itemsLayer.appendChild(hanger);
    });
  }

  tick() {
    // 1. Smooth Scroll Interpolation (Spring Lerp)
    this.scrollX += (this.targetScrollX - this.scrollX) * 0.12;

    const pathLength = this.wirePath ? this.wirePath.getTotalLength() : 0;
    const hangers = this.itemsLayer.children;
    const totalCount = hangers.length;

    if (pathLength > 0 && totalCount > 0) {
      const containerWidth = this.container.clientWidth;
      // Spread cards evenly across virtual track
      const cardSpacing = 360;
      const baseOffset = containerWidth * 0.18 + this.scrollX;

      for (let i = 0; i < totalCount; i++) {
        const el = hangers[i];
        const virtualX = baseOffset + (i * cardSpacing);

        // Normalize X coordinate along SVG wire width
        const clampedRatio = Math.max(0.01, Math.min(0.99, virtualX / containerWidth));
        const distance = pathLength * clampedRatio;
        const point = this.wirePath.getPointAtLength(distance);

        // Calculate Tangent Slope
        const pAhead = this.wirePath.getPointAtLength(Math.min(pathLength, distance + 3));
        const pBehind = this.wirePath.getPointAtLength(Math.max(0, distance - 3));
        const dx = pAhead.x - pBehind.x;
        const dy = pAhead.y - pBehind.y;
        const baseSlopeAngle = (Math.atan2(dy, dx) * 180 / Math.PI) * 0.35;

        // 2. Damped Harmonic Oscillator (Pendulum Physics)
        const springK = 0.075; // restoring spring force
        const damping = 0.91;  // air resistance friction
        const currentAngle = this.angularAngles[i] || 0;
        let currentVel = this.angularVelocities[i] || 0;

        // Force towards 0 rest
        const force = -springK * currentAngle;
        currentVel = (currentVel + force) * damping;
        const nextAngle = currentAngle + currentVel;

        this.angularVelocities[i] = currentVel;
        this.angularAngles[i] = nextAngle;

        const totalAngle = (baseSlopeAngle + nextAngle).toFixed(2);

        // Position Element with origin at top center on wire
        el.style.left = `${virtualX.toFixed(2)}px`;
        el.style.top = `${point.y.toFixed(2)}px`;
        el.style.transform = `translate(-50%, 0) rotate(${totalAngle}deg)`;

        // Keep tag counter-rotated so text stays upright and readable!
        const tag = el.querySelector(".hanger-tag");
        if (tag) {
          tag.style.transform = `rotate(${-totalAngle * 0.7}deg)`;
        }
      }
    }

    requestAnimationFrame(this.tick);
  }
}
