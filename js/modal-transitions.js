/**
 * Case Study Modal & Fluid Layout Transition Engine
 * Handles full-screen expansion, tabbed case study inspection,
 * keyboard shortcuts, and synthesized Web Audio feedback.
 */

export class CaseStudyModal {
  constructor({ modalId, onNavigate }) {
    this.modal = document.getElementById(modalId);
    this.modalCard = this.modal.querySelector(".modal-card");
    this.modalBody = this.modal.querySelector(".modal-dynamic-content");
    this.closeBtn = this.modal.querySelector(".modal-close-trigger");
    this.prevBtn = this.modal.querySelector(".modal-prev-trigger");
    this.nextBtn = this.modal.querySelector(".modal-next-trigger");

    this.currentProject = null;
    this.allProjects = [];
    this.onNavigate = onNavigate;
    this.activeTab = "overview";
    this.soundEnabled = false;

    // Web Audio Synthesizer Context
    this.audioCtx = null;

    this.init();
  }

  init() {
    this.closeBtn.addEventListener("click", () => this.close());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });

    if (this.prevBtn) {
      this.prevBtn.addEventListener("click", () => this.navigateStep(-1));
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", () => this.navigateStep(1));
    }

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      if (!this.isOpen()) return;

      if (e.key === "Escape") {
        this.close();
      } else if (e.key === "ArrowLeft") {
        this.navigateStep(-1);
      } else if (e.key === "ArrowRight") {
        this.navigateStep(1);
      }
    });
  }

  setProjects(projects) {
    this.allProjects = projects;
  }

  toggleSound(forceState) {
    this.soundEnabled = forceState !== undefined ? forceState : !this.soundEnabled;
    if (this.soundEnabled && !this.audioCtx) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      } catch (err) {
        console.warn("AudioContext not supported", err);
      }
    }
    return this.soundEnabled;
  }

  playHapticTone(type = "click") {
    if (!this.soundEnabled || !this.audioCtx) return;
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const now = this.audioCtx.currentTime;

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    if (type === "open") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "close") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(480, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  isOpen() {
    return this.modal.classList.contains("active");
  }

  open(project, sourceElement) {
    this.currentProject = project;
    this.activeTab = "overview";
    this.playHapticTone("open");

    this.renderContent();
    this.modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Focus management
    this.closeBtn.focus();
  }

  close() {
    if (!this.isOpen()) return;
    const activeVideo = this.modalBody.querySelector("video");
    if (activeVideo) {
      try {
        activeVideo.pause();
      } catch (e) {}
    }
    this.playHapticTone("close");
    this.modal.classList.remove("active");
    document.body.style.overflow = "";
    this.currentProject = null;
  }

  navigateStep(direction) {
    if (!this.currentProject || this.allProjects.length === 0) return;
    const activeVideo = this.modalBody.querySelector("video");
    if (activeVideo) {
      try {
        activeVideo.pause();
      } catch (e) {}
    }
    const currentIndex = this.allProjects.findIndex(p => p.id === this.currentProject.id);
    let nextIndex = currentIndex + direction;

    if (nextIndex < 0) nextIndex = this.allProjects.length - 1;
    if (nextIndex >= this.allProjects.length) nextIndex = 0;

    this.playHapticTone("click");
    this.currentProject = this.allProjects[nextIndex];
    this.renderContent();
  }

  setTab(tabName) {
    this.activeTab = tabName;
    this.playHapticTone("click");
    this.renderTabContent();
  }

  renderContent() {
    const p = this.currentProject;
    if (!p) return;

    // Metric Badges HTML
    const metricsHtml = p.metrics.map(m => `
      <div class="metric-card">
        <div class="metric-value">${m.value}</div>
        <div class="metric-label">${m.label}</div>
      </div>
    `).join("");

    // Tech Stack Pill Badges
    const techHtml = p.tech.map(t => `<span class="tech-badge">${t}</span>`).join("");

    this.modalBody.innerHTML = `
      <div class="modal-grid">
        <!-- Visual & Media Column -->
        <div class="modal-media-col">
          <div class="modal-hero-frame">
            ${p.video ? `
              <video class="modal-hero-video" src="${p.video}" poster="${p.image}" controls playsinline preload="metadata" style="width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; border-radius: inherit; background: #000;"></video>
            ` : `
              <img src="${p.image}" alt="${p.title} Preview" />
            `}
            <div class="modal-hero-tag">${p.badge}</div>
          </div>

          <div class="metrics-grid">
            ${metricsHtml}
          </div>

          <div class="modal-cta-row">
            <a href="${p.demo}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
              Launch Live App ↗
            </a>
            <a href="${p.github}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
              Inspect Source ↗
            </a>
          </div>
        </div>

        <!-- Information & Documentation Column -->
        <div class="modal-info-col">
          <div class="modal-header-meta">
            <span class="category-badge">${p.category}</span>
            <span class="year-label">${p.year} Archive</span>
          </div>

          <h2 class="modal-title">${p.title}</h2>
          <p class="modal-subtitle">${p.tagline}</p>

          <!-- Tabs Navigation -->
          <div class="modal-tabs">
            <button class="tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
            <button class="tab-btn ${this.activeTab === 'architecture' ? 'active' : ''}" data-tab="architecture">Architecture</button>
            <button class="tab-btn ${this.activeTab === 'highlights' ? 'active' : ''}" data-tab="highlights">Key Highlights</button>
          </div>

          <!-- Dynamic Tab Content Pane -->
          <div class="tab-pane-container" id="tabPaneContainer">
            <!-- Populated via renderTabContent -->
          </div>

          <!-- Tech Stack Section -->
          <div class="modal-tech-section">
            <h4 class="section-micro-title">Core Technology Stack</h4>
            <div class="tech-badge-container">
              ${techHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook tab buttons
    const tabButtons = this.modalBody.querySelectorAll(".tab-btn");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.setTab(btn.getAttribute("data-tab"));
      });
    });

    this.renderTabContent();
  }

  renderTabContent() {
    const p = this.currentProject;
    const container = document.getElementById("tabPaneContainer");
    if (!p || !container) return;

    if (this.activeTab === "overview") {
      container.innerHTML = `
        <div class="tab-pane fade-in">
          <p class="tab-body-text">${p.overview}</p>
        </div>
      `;
    } else if (this.activeTab === "architecture") {
      container.innerHTML = `
        <div class="tab-pane fade-in">
          <p class="tab-body-text">${p.architecture}</p>
        </div>
      `;
    } else if (this.activeTab === "highlights") {
      const listItems = p.highlights.map(h => `<li>${h}</li>`).join("");
      container.innerHTML = `
        <div class="tab-pane fade-in">
          <ul class="highlights-list">
            ${listItems}
          </ul>
        </div>
      `;
    }
  }
}
