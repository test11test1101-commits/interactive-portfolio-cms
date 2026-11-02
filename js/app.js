/**
 * Main Application Orchestrator
 * Coordinates physics rails, interactive sections, theme management,
 * audio synthesizers, and real-time CMS storage synchronization.
 */

import { cmsStorage } from "./cms-storage.js";
import { ClotheslineRail } from "./rail-physics.js";
import { CaseStudyModal } from "./modal-transitions.js";

document.addEventListener("DOMContentLoaded", () => {
  let cmsData = cmsStorage.getData();

  // 1. Initialize Modal Engine
  const modal = new CaseStudyModal({
    modalId: "projectModal",
    onNavigate: () => {}
  });
  modal.setProjects(cmsData.projects);

  // 2. Initialize Clothesline Rail
  const rail = new ClotheslineRail({
    containerId: "railShowcase",
    wirePathId: "catenaryWire",
    itemsLayerId: "railItemsLayer",
    projects: cmsData.projects,
    onSelectProject: (project, sourceElement) => {
      modal.open(project, sourceElement);
    }
  });

  // Apply default tension from CMS
  if (cmsData.rail && typeof cmsData.rail.defaultTension === "number") {
    rail.setTension(cmsData.rail.defaultTension);
    const tensionSlider = document.getElementById("wireTensionSlider");
    const tensionLabel = document.getElementById("tensionValueLabel");
    if (tensionSlider) tensionSlider.value = cmsData.rail.defaultTension;
    if (tensionLabel) tensionLabel.textContent = `${Math.round(cmsData.rail.defaultTension * 100)}%`;
  }

  // 3. Arrow Navigation Controls
  const prevBtn = document.getElementById("railPrevBtn");
  const nextBtn = document.getElementById("railNextBtn");
  if (prevBtn) prevBtn.addEventListener("click", () => rail.scrollStep(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => rail.scrollStep(1));

  // 4. Wire Tension Slider
  const tensionSlider = document.getElementById("wireTensionSlider");
  const tensionValueLabel = document.getElementById("tensionValueLabel");
  if (tensionSlider) {
    tensionSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      rail.setTension(val);
      if (tensionValueLabel) {
        tensionValueLabel.textContent = `${Math.round(val * 100)}%`;
      }
    });
  }

  // 5. Category Filters
  const filterPills = document.querySelectorAll(".filter-pill");
  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const category = pill.getAttribute("data-category");
      rail.setFilter(category);
    });
  });

  // 6. Theme Toggle (Dark / Light)
  const themeToggle = document.getElementById("themeToggleBtn");
  const currentTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeIcon(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const active = document.documentElement.getAttribute("data-theme");
      const nextTheme = active === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("theme", nextTheme);
      updateThemeIcon(nextTheme);
      modal.playHapticTone("click");
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    themeToggle.innerHTML = theme === "dark" 
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg><span>Light</span>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><span>Dark</span>`;
  }

  // 7. Audio Feedback Toggle
  const audioToggle = document.getElementById("audioToggleBtn");
  if (audioToggle) {
    audioToggle.addEventListener("click", () => {
      const isEnabled = modal.toggleSound();
      audioToggle.classList.toggle("active", isEnabled);
      audioToggle.innerHTML = isEnabled
        ? `<span class="sound-wave-icon active"><span></span><span></span><span></span></span><span>Audio ON</span>`
        : `<span class="sound-wave-icon"><span></span><span></span><span></span></span><span>Audio OFF</span>`;
    });
  }

  // 8. Render Brand & Header Info from CMS
  function renderBrandInfo(data) {
    const brand = data.brand || {};
    const monoEl = document.querySelector(".brand-monogram");
    const nameEl = document.querySelector(".brand-name");
    const roleEl = document.querySelector(".brand-role");
    const statusTextEl = document.querySelector(".status-badge span:last-child");
    const emailValEl = document.querySelector(".email-value");

    if (monoEl && brand.monogram) monoEl.textContent = brand.monogram;
    if (nameEl && brand.name) nameEl.textContent = brand.name;
    if (roleEl && brand.role) roleEl.textContent = brand.role;
    if (statusTextEl && brand.statusText) statusTextEl.textContent = brand.statusText;
    if (emailValEl && brand.email) emailValEl.textContent = brand.email;
  }
  renderBrandInfo(cmsData);

  // 9. Render Bento Capabilities
  function renderCapabilities(caps) {
    const bentoGrid = document.getElementById("bentoGrid");
    if (!bentoGrid) return;
    bentoGrid.innerHTML = caps.map((cap, i) => `
      <div class="bento-card bento-card-${(i % 4) + 1}">
        <div class="bento-icon">${cap.icon || "⚡"}</div>
        <h3 class="bento-title">${cap.title}</h3>
        <p class="bento-desc">${cap.desc}</p>
        <div class="bento-decor"></div>
      </div>
    `).join("");
  }
  renderCapabilities(cmsData.capabilities);

  // 10. Render Career Timeline
  function renderTimeline(timeline) {
    const timelineContainer = document.getElementById("timelineContainer");
    if (!timelineContainer) return;
    timelineContainer.innerHTML = timeline.map((item, idx) => `
      <div class="timeline-row">
        <div class="timeline-date">
          <span class="period-pill">${item.period}</span>
          <span class="location-label">${item.location}</span>
        </div>
        <div class="timeline-dot-track">
          <div class="timeline-dot"></div>
          ${idx < timeline.length - 1 ? '<div class="timeline-line"></div>' : ''}
        </div>
        <div class="timeline-content">
          <h3 class="role-title">${item.role}</h3>
          <h4 class="company-name">${item.company}</h4>
          <p class="role-summary">${item.summary}</p>
        </div>
      </div>
    `).join("");
  }
  renderTimeline(cmsData.timeline);

  // 11. Live Clock
  const clockEl = document.getElementById("liveClock");
  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    clockEl.textContent = `${timeStr} [${timeZone}]`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 12. Copy Email Trigger
  const copyEmailBtn = document.getElementById("copyEmailBtn");
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", async () => {
      const email = cmsData.brand.email || "contact@portfolio.dev";
      try {
        await navigator.clipboard.writeText(email);
        const originalText = copyEmailBtn.innerHTML;
        copyEmailBtn.innerHTML = `✓ Copied to clipboard!`;
        copyEmailBtn.classList.add("copied");
        setTimeout(() => {
          copyEmailBtn.innerHTML = originalText;
          copyEmailBtn.classList.remove("copied");
        }, 2200);
      } catch (err) {
        prompt("Copy email address:", email);
      }
    });
  }

  // 13. Contact Form Simulation
  const contactForm = document.getElementById("contactForm");
  const formSuccessAlert = document.getElementById("formSuccessAlert");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `Transmitting proposal...`;
      }

      setTimeout(() => {
        contactForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `Send Transmission ↗`;
        }
        if (formSuccessAlert) {
          formSuccessAlert.classList.remove("hidden");
          setTimeout(() => {
            formSuccessAlert.classList.add("hidden");
          }, 4500);
        }
      }, 900);
    });
  }

  // 14. Real-time Cross-Tab CMS Synchronization
  window.addEventListener("portfolio-cms-updated", (e) => {
    cmsData = e.detail;
    modal.setProjects(cmsData.projects);
    rail.allProjects = cmsData.projects;
    rail.setFilter(rail.activeFilter);
    renderBrandInfo(cmsData);
    renderCapabilities(cmsData.capabilities);
    renderTimeline(cmsData.timeline);
  });
});
