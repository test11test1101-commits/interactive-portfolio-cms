/**
 * Portfolio Studio CMS Logic
 * Manages project CRUD, configuration settings, export/import,
 * and live synchronization with the portfolio storefront.
 */

import { cmsStorage, DEFAULT_ADMIN_KEY } from "./cms-storage.js";

document.addEventListener("DOMContentLoaded", () => {
  let cmsData = cmsStorage.getData();
  let editingProjectId = null;

  // 1. Theme & Database Engine Indicator
  const themeToggle = document.getElementById("adminThemeToggle");
  const currentTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);

  const pwdInput = document.getElementById("adminPasswordInput");
  if (pwdInput) {
    const currentKey = cmsStorage.getAdminPassword() || DEFAULT_ADMIN_KEY;
    pwdInput.value = currentKey;
    cmsStorage.setAdminPassword(currentKey);

    const onKeyChange = (val) => {
      cmsStorage.setAdminPassword(val);
      pwdInput.classList.remove("auth-error");
    };

    pwdInput.addEventListener("input", (e) => onKeyChange(e.target.value));
    pwdInput.addEventListener("change", (e) => {
      onKeyChange(e.target.value);
      showToast("Admin Key updated ✓");
    });
  }

  const engineText = document.getElementById("dbEngineText");
  function updateEngineDisplay(engine) {
    if (!engineText) return;
    if (engine === "tidb") {
      engineText.textContent = "TiDB Cloud (Live)";
    } else if (engine === "sqlite") {
      engineText.textContent = "Local SQLite";
    } else {
      engineText.textContent = "LocalStorage";
    }
  }
  updateEngineDisplay(cmsStorage.dbEngine);

  // Sync state whenever backend or another tab updates
  window.addEventListener("portfolio-cms-updated", (e) => {
    cmsData = cmsStorage.getData();
    if (e.detail && e.detail._engine) {
      updateEngineDisplay(e.detail._engine);
    }
    renderProjectsList();
    
    // Only re-populate forms if user is not actively typing inside them
    const active = document.activeElement;
    const isTyping = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT");
    if (!isTyping) {
      initConfigTab();
      renderCapabilitiesManager();
      renderTimelineManager();
    }
  });

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const active = document.documentElement.getAttribute("data-theme");
      const nextTheme = active === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("theme", nextTheme);
    });
  }

  // 2. Sidebar Navigation Tabs
  const navItems = document.querySelectorAll(".admin-nav-item");
  const panels = document.querySelectorAll(".admin-view-panel");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetId = item.getAttribute("data-panel");
      navItems.forEach(n => n.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      item.classList.add("active");
      const activePanel = document.getElementById(targetId);
      if (activePanel) activePanel.classList.add("active");
    });
  });

  // 3. Toast Helper
  const toast = document.getElementById("adminToast");
  let toastTimer = null;
  function showToast(message, isError = false) {
    if (!toast) return;
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle("toast-error", isError);
    toast.classList.add("show");
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.remove("toast-error");
    }, isError ? 4500 : 2800);
  }

  function handleAuthFailure(reason) {
    if (reason === "unauthorized" && pwdInput) {
      pwdInput.classList.add("auth-error");
      pwdInput.focus();
    }
  }

  // 4. Render Project Cards List (Tab 1)
  function renderProjectsList() {
    const container = document.getElementById("projectsListGrid");
    const countBadge = document.getElementById("projectsCountBadge");
    if (!container) return;

    if (countBadge) countBadge.textContent = cmsData.projects.length;
    container.innerHTML = "";

    cmsData.projects.forEach((p, idx) => {
      const card = document.createElement("div");
      card.className = "project-admin-card";
      card.innerHTML = `
        <div class="admin-card-preview">
          <img src="${p.image}" alt="${p.title}" />
          <div class="admin-card-tag">${p.badge || p.year}</div>
        </div>
        <div class="admin-card-content">
          <div>
            <div class="admin-card-cat">${p.category}</div>
            <h3 class="admin-card-title">${p.title}</h3>
            <p class="admin-card-tagline">${p.tagline}</p>
          </div>
          <div class="admin-card-actions">
            <div class="card-order-btns">
              <button class="admin-btn admin-btn-secondary admin-btn-sm btn-move-up" data-idx="${idx}" title="Move left on rail" ${idx === 0 ? 'disabled' : ''}>←</button>
              <button class="admin-btn admin-btn-secondary admin-btn-sm btn-move-down" data-idx="${idx}" title="Move right on rail" ${idx === cmsData.projects.length - 1 ? 'disabled' : ''}>→</button>
            </div>
            <div>
              <button class="admin-btn admin-btn-secondary admin-btn-sm btn-edit" data-id="${p.id}">Edit</button>
              <button class="admin-btn admin-btn-danger admin-btn-sm btn-delete" data-id="${p.id}">Delete</button>
            </div>
          </div>
        </div>
      `;

      // Order buttons
      card.querySelector(".btn-move-up").addEventListener("click", () => moveProject(idx, -1));
      card.querySelector(".btn-move-down").addEventListener("click", () => moveProject(idx, 1));
      card.querySelector(".btn-edit").addEventListener("click", () => openProjectModal(p));
      card.querySelector(".btn-delete").addEventListener("click", () => deleteProject(p.id));

      container.appendChild(card);
    });
  }

  async function moveProject(index, offset) {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= cmsData.projects.length) return;
    const temp = cmsData.projects[index];
    cmsData.projects[index] = cmsData.projects[targetIndex];
    cmsData.projects[targetIndex] = temp;

    const res = await cmsStorage.save(cmsData);
    renderProjectsList();
    if (res.success) {
      showToast("Rail sequence updated ✓");
    } else {
      showToast("❌ " + (res.message || "Failed to save sequence"), true);
      handleAuthFailure(res.reason);
    }
  }

  async function deleteProject(id) {
    if (!confirm("Are you sure you want to remove this project from the rail?")) return;
    cmsData.projects = cmsData.projects.filter(p => p.id !== id);
    const res = await cmsStorage.save(cmsData);
    renderProjectsList();
    if (res.success) {
      showToast("Project removed ✓");
    } else {
      showToast("❌ " + (res.message || "Failed to remove project"), true);
      handleAuthFailure(res.reason);
    }
  }

  // 5. Project Editor Modal
  const modal = document.getElementById("projectEditorModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const projectForm = document.getElementById("projectForm");

  function openProjectModal(project = null) {
    editingProjectId = project ? project.id : null;
    document.getElementById("modalTitle").textContent = project ? "Edit Project" : "Add Project to Rail";

    // Form inputs
    document.getElementById("formProjectId").value = project ? project.id : `proj-${Date.now()}`;
    document.getElementById("formProjectTitle").value = project ? project.title : "";
    document.getElementById("formProjectTagline").value = project ? project.tagline : "";
    document.getElementById("formProjectCategory").value = project ? project.category : "Creative & 3D";
    document.getElementById("formProjectYear").value = project ? project.year : "2026";
    document.getElementById("formProjectBadge").value = project ? project.badge : "FEATURED";
    document.getElementById("formProjectImage").value = project ? project.image : "./assets/images/apex_dashboard.jpg";
    document.getElementById("formProjectTech").value = project ? (Array.isArray(project.tech) ? project.tech.join(", ") : project.tech) : "React, TypeScript, Three.js";
    document.getElementById("formProjectOverview").value = project ? project.overview : "";
    document.getElementById("formProjectArchitecture").value = project ? project.architecture : "";
    document.getElementById("formProjectHighlights").value = project ? (Array.isArray(project.highlights) ? project.highlights.join("\n") : project.highlights) : "";
    document.getElementById("formProjectDemo").value = project ? project.demo : "https://example.com";
    document.getElementById("formProjectGithub").value = project ? project.github : "https://github.com";

    // Metrics
    const metrics = (project && project.metrics) || [
      { label: "Throughput", value: "1.0M" },
      { label: "Latency", value: "4ms" },
      { label: "Users", value: "10k" },
      { label: "Uptime", value: "99.9%" }
    ];

    for (let i = 0; i < 4; i++) {
      const m = metrics[i] || { label: `Metric ${i+1}`, value: "-" };
      document.getElementById(`formMetricLabel${i+1}`).value = m.label || "";
      document.getElementById(`formMetricVal${i+1}`).value = m.value || "";
    }

    modal.classList.add("active");
  }

  function closeProjectModal() {
    modal.classList.remove("active");
    editingProjectId = null;
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeProjectModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeProjectModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeProjectModal();
  });

  const addNewProjectBtn = document.getElementById("addNewProjectBtn");
  if (addNewProjectBtn) {
    addNewProjectBtn.addEventListener("click", () => openProjectModal(null));
  }

  if (projectForm) {
    projectForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = projectForm.querySelector("button[type='submit']");
      const origText = submitBtn ? submitBtn.textContent : "Save to Rail";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving to Database...";
      }

      try {
        const metrics = [
          { label: document.getElementById("formMetricLabel1").value, value: document.getElementById("formMetricVal1").value },
          { label: document.getElementById("formMetricLabel2").value, value: document.getElementById("formMetricVal2").value },
          { label: document.getElementById("formMetricLabel3").value, value: document.getElementById("formMetricVal3").value },
          { label: document.getElementById("formMetricLabel4").value, value: document.getElementById("formMetricVal4").value }
        ];

        const techArr = document.getElementById("formProjectTech").value.split(",").map(s => s.trim()).filter(Boolean);
        const highlightsArr = document.getElementById("formProjectHighlights").value.split("\n").map(s => s.trim()).filter(Boolean);

        const projectData = {
          id: document.getElementById("formProjectId").value,
          title: document.getElementById("formProjectTitle").value,
          tagline: document.getElementById("formProjectTagline").value,
          category: document.getElementById("formProjectCategory").value,
          year: document.getElementById("formProjectYear").value,
          badge: document.getElementById("formProjectBadge").value,
          image: document.getElementById("formProjectImage").value,
          tech: techArr,
          metrics: metrics,
          overview: document.getElementById("formProjectOverview").value,
          architecture: document.getElementById("formProjectArchitecture").value,
          highlights: highlightsArr,
          demo: document.getElementById("formProjectDemo").value,
          github: document.getElementById("formProjectGithub").value
        };

        if (editingProjectId) {
          const idx = cmsData.projects.findIndex(p => p.id === editingProjectId);
          if (idx !== -1) {
            cmsData.projects[idx] = projectData;
          } else {
            cmsData.projects.unshift(projectData);
          }
        } else {
          cmsData.projects.unshift(projectData);
        }

        const res = await cmsStorage.save(cmsData);
        renderProjectsList();

        if (res.success) {
          closeProjectModal();
          const engineLabel = res.engine === "tidb" ? "TiDB Cloud" : (res.engine === "sqlite" ? "SQLite" : "Local Storage");
          showToast(editingProjectId ? `Project updated ✓ (${engineLabel})` : `New project suspended on rail ✓ (${engineLabel})`);
        } else {
          showToast("❌ " + (res.message || "Failed to save project"), true);
          handleAuthFailure(res.reason);
        }
      } catch (err) {
        showToast("❌ Unexpected error: " + err.message, true);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      }
    });
  }

  // 6. Brand & Rail Configuration (Tab 2)
  function initConfigTab() {
    const brand = cmsData.brand || {};
    const rail = cmsData.rail || {};

    const monoInput = document.getElementById("configMonogram");
    const nameInput = document.getElementById("configBrandName");
    const roleInput = document.getElementById("configRole");
    const statusInput = document.getElementById("configStatusText");
    const emailInput = document.getElementById("configEmail");
    const tensionInput = document.getElementById("configTensionSlider");
    const tensionVal = document.getElementById("configTensionValue");

    if (monoInput) monoInput.value = brand.monogram || "W.";
    if (nameInput) nameInput.value = brand.name || "LYRCH // STUDIO";
    if (roleInput) roleInput.value = brand.role || "Creative Engineer";
    if (statusInput) statusInput.value = brand.statusText || "Available Q4 2026";
    if (emailInput) emailInput.value = brand.email || "contact@portfolio.dev";

    if (tensionInput && tensionVal) {
      tensionInput.value = rail.defaultTension || 0.55;
      tensionVal.textContent = `${Math.round((rail.defaultTension || 0.55) * 100)}%`;
      tensionInput.oninput = (e) => {
        tensionVal.textContent = `${Math.round(parseFloat(e.target.value) * 100)}%`;
      };
    }
  }

  const configForm = document.getElementById("configSettingsForm");
  if (configForm) {
    configForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const saveBtn = configForm.querySelector("button[type='submit']");
      const origText = saveBtn ? saveBtn.textContent : "Save Brand & Rail Configuration";
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving to Database...";
      }

      try {
        const monoInput = document.getElementById("configMonogram");
        const nameInput = document.getElementById("configBrandName");
        const roleInput = document.getElementById("configRole");
        const statusInput = document.getElementById("configStatusText");
        const emailInput = document.getElementById("configEmail");
        const tensionInput = document.getElementById("configTensionSlider");

        cmsData.brand = {
          monogram: monoInput.value,
          name: nameInput.value,
          role: roleInput.value,
          statusText: statusInput.value,
          statusActive: true,
          email: emailInput.value
        };
        cmsData.rail = {
          ...cmsData.rail,
          defaultTension: parseFloat(tensionInput.value)
        };

        const res = await cmsStorage.save(cmsData);
        if (res.success) {
          const engineLabel = res.engine === "tidb" ? "TiDB Cloud" : (res.engine === "sqlite" ? "SQLite" : "Local Storage");
          showToast(`Brand & Rail configuration saved ✓ (${engineLabel})`);
        } else {
          showToast("❌ " + (res.message || "Failed to save configuration"), true);
          handleAuthFailure(res.reason);
        }
      } catch (err) {
        showToast("❌ Error saving settings: " + err.message, true);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = origText;
        }
      }
    });
  }

  // Video Parsing & Preview Helper for CMS
  function parseVideoSource(url) {
    if (!url || typeof url !== "string") return null;
    const trimmed = url.trim();
    if (!trimmed) return null;

    const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return {
        type: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1`,
        original: trimmed
      };
    }

    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/i);
    if (vimeoMatch && vimeoMatch[3]) {
      return {
        type: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?badge=0&autopause=0&player_id=0`,
        original: trimmed
      };
    }

    return {
      type: "video",
      src: trimmed,
      original: trimmed
    };
  }

  function renderVideoPreviewHtml(videoUrl) {
    const parsed = parseVideoSource(videoUrl);
    if (!parsed) {
      return `<div class="cms-video-empty-notice"><span>ℹ️</span> No video attached yet. Enter an MP4/WebM URL, YouTube, Vimeo, or upload a video file to preview your edit here.</div>`;
    }
    if (parsed.type === "youtube" || parsed.type === "vimeo") {
      return `<iframe class="cms-video-frame" src="${parsed.embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    }
    return `<video class="cms-video-frame" src="${parsed.src}" controls playsinline preload="metadata"></video>`;
  }

  // 7. Capabilities Bento Manager (Tab 3)
  function renderCapabilitiesManager() {
    const list = document.getElementById("capabilitiesList");
    if (!list) return;
    list.innerHTML = "";

    cmsData.capabilities.forEach((cap, idx) => {
      const row = document.createElement("div");
      row.className = "settings-card";
      row.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h4 style="font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>${cap.icon || "⚡"}</span> <span>${cap.title}</span>
          </h4>
          <button class="admin-btn admin-btn-danger admin-btn-sm btn-delete-cap" data-idx="${idx}">Delete</button>
        </div>
        <div class="form-grid-2">
          <div class="form-field">
            <label>Icon (Emoji)</label>
            <input type="text" class="cap-icon-input" value="${cap.icon || '⚡'}" />
          </div>
          <div class="form-field">
            <label>Capability Title</label>
            <input type="text" class="cap-title-input" value="${cap.title}" />
          </div>
        </div>
        <div class="form-field">
          <label>Description</label>
          <textarea rows="2" class="cap-desc-input">${cap.desc}</textarea>
        </div>

        <div class="cms-video-field-wrap">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <label style="font-weight: 700; font-size: 0.82rem; color: var(--admin-accent); display: flex; align-items: center; gap: 0.35rem;">
              <span>🎬</span> Video Edit Showcase (Live Preview & Playback)
            </label>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <label class="admin-btn admin-btn-secondary admin-btn-sm cms-video-upload-label" title="Upload local MP4 or WebM video">
                <span class="upload-label-text">+ Upload Video File</span>
                <input type="file" class="cap-file-upload" accept="video/mp4,video/webm,video/quicktime,video/*" style="display: none;" />
              </label>
              <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm btn-clear-video" title="Remove video">Clear</button>
            </div>
          </div>
          <input type="text" class="cap-video-input" placeholder="e.g. ./assets/videos/demo_edit.webm or YouTube/Vimeo URL" value="${cap.video || ''}" />
          <div class="cms-video-preview-box ${cap.video ? 'has-media' : ''}" id="capPreviewBox-${idx}">
            ${renderVideoPreviewHtml(cap.video)}
          </div>
        </div>
      `;

      // Video input change listener
      const videoInput = row.querySelector(".cap-video-input");
      const previewBox = row.querySelector(`#capPreviewBox-${idx}`);
      const clearBtn = row.querySelector(".btn-clear-video");
      const fileUpload = row.querySelector(".cap-file-upload");
      const uploadLabelText = row.querySelector(".upload-label-text");

      const updateVideoPreview = () => {
        const val = videoInput.value.trim();
        cmsData.capabilities[idx].video = val;
        previewBox.classList.toggle("has-media", !!val);
        previewBox.innerHTML = renderVideoPreviewHtml(val);
      };

      videoInput.addEventListener("input", updateVideoPreview);

      clearBtn.addEventListener("click", () => {
        videoInput.value = "";
        updateVideoPreview();
        showToast("Video removed from capability ✓");
      });

      if (fileUpload) {
        fileUpload.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const origLabel = uploadLabelText.textContent;
          uploadLabelText.textContent = "Uploading...";
          try {
            const res = await cmsStorage.uploadVideo(file);
            if (res.url) {
              videoInput.value = res.url;
              updateVideoPreview();
              showToast("Video uploaded successfully ✓");
            }
          } catch (err) {
            showToast("❌ Upload failed: " + err.message, true);
          } finally {
            uploadLabelText.textContent = origLabel;
            fileUpload.value = "";
          }
        });
      }

      row.querySelector(".btn-delete-cap").addEventListener("click", async () => {
        cmsData.capabilities.splice(idx, 1);
        const res = await cmsStorage.save(cmsData);
        renderCapabilitiesManager();
        if (res.success) {
          showToast("Capability removed ✓");
        } else {
          showToast("❌ " + (res.message || "Failed to remove capability"), true);
          handleAuthFailure(res.reason);
        }
      });

      // Update in memory on input
      const updateCap = () => {
        cmsData.capabilities[idx] = {
          icon: row.querySelector(".cap-icon-input").value,
          title: row.querySelector(".cap-title-input").value,
          desc: row.querySelector(".cap-desc-input").value,
          video: row.querySelector(".cap-video-input").value.trim()
        };
      };

      row.querySelectorAll(".cap-icon-input, .cap-title-input, .cap-desc-input").forEach(input => {
        input.addEventListener("input", updateCap);
      });

      list.appendChild(row);
    });
  }

  // Save Capabilities Bento button
  const saveCapabilitiesBtn = document.getElementById("saveCapabilitiesBtn");
  if (saveCapabilitiesBtn) {
    saveCapabilitiesBtn.addEventListener("click", async () => {
      // Collect current values from DOM
      const list = document.getElementById("capabilitiesList");
      if (list) {
        const rows = list.querySelectorAll(".settings-card");
        rows.forEach((row, idx) => {
          if (cmsData.capabilities[idx]) {
            cmsData.capabilities[idx] = {
              icon: row.querySelector(".cap-icon-input").value,
              title: row.querySelector(".cap-title-input").value,
              desc: row.querySelector(".cap-desc-input").value,
              video: row.querySelector(".cap-video-input").value.trim()
            };
          }
        });
      }

      saveCapabilitiesBtn.disabled = true;
      saveCapabilitiesBtn.textContent = "Saving to Database...";
      try {
        const res = await cmsStorage.save(cmsData);
        if (res.success) {
          const engineLabel = res.engine === "tidb" ? "TiDB Cloud" : (res.engine === "sqlite" ? "SQLite" : "Local Storage");
          showToast(`Capabilities Bento saved ✓ (${engineLabel})`);
        } else {
          showToast("❌ " + (res.message || "Failed to save capabilities"), true);
          handleAuthFailure(res.reason);
        }
      } catch (err) {
        showToast("❌ Error: " + err.message, true);
      } finally {
        saveCapabilitiesBtn.disabled = false;
        saveCapabilitiesBtn.textContent = "Save Capabilities Bento ✓";
      }
    });
  }

  const addCapBtn = document.getElementById("addCapabilityBtn");
  if (addCapBtn) {
    addCapBtn.addEventListener("click", async () => {
      cmsData.capabilities.push({
        icon: "🎬",
        title: "Video Editing & Motion Graphics",
        desc: "High-retention short-form video editing, visual pacing, dynamic captions, and sound design.",
        video: "./assets/videos/demo_edit.webm"
      });
      const res = await cmsStorage.save(cmsData);
      renderCapabilitiesManager();
      if (res.success) {
        showToast("New capability with video showcase added ✓");
      } else {
        showToast("❌ " + (res.message || "Failed to add capability"), true);
        handleAuthFailure(res.reason);
      }
    });
  }

  // 8. Career Timeline Manager (Tab 4)
  function renderTimelineManager() {
    const list = document.getElementById("timelineList");
    if (!list) return;
    list.innerHTML = "";

    cmsData.timeline.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "settings-card";
      row.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h4 style="font-size: 1.1rem;">${item.role} @ ${item.company}</h4>
          <button class="admin-btn admin-btn-danger admin-btn-sm btn-delete-time" data-idx="${idx}">Delete</button>
        </div>
        <div class="form-grid-2">
          <div class="form-field">
            <label>Period / Years</label>
            <input type="text" class="time-period-input" value="${item.period}" />
          </div>
          <div class="form-field">
            <label>Location</label>
            <input type="text" class="time-loc-input" value="${item.location}" />
          </div>
          <div class="form-field">
            <label>Role Title</label>
            <input type="text" class="time-role-input" value="${item.role}" />
          </div>
          <div class="form-field">
            <label>Organization / Company</label>
            <input type="text" class="time-company-input" value="${item.company}" />
          </div>
        </div>
        <div class="form-field">
          <label>Executive Summary</label>
          <textarea rows="2" class="time-summary-input">${item.summary}</textarea>
        </div>
      `;

      row.querySelector(".btn-delete-time").addEventListener("click", async () => {
        cmsData.timeline.splice(idx, 1);
        const res = await cmsStorage.save(cmsData);
        renderTimelineManager();
        if (res.success) {
          showToast("Timeline milestone removed ✓");
        } else {
          showToast("❌ " + (res.message || "Failed to remove timeline milestone"), true);
          handleAuthFailure(res.reason);
        }
      });

      // Update in memory on input
      const updateTime = () => {
        cmsData.timeline[idx] = {
          period: row.querySelector(".time-period-input").value,
          location: row.querySelector(".time-loc-input").value,
          role: row.querySelector(".time-role-input").value,
          company: row.querySelector(".time-company-input").value,
          summary: row.querySelector(".time-summary-input").value
        };
      };

      row.querySelectorAll("input, textarea").forEach(input => {
        input.addEventListener("input", updateTime);
      });

      list.appendChild(row);
    });
  }

  // Save Career Journey button
  const saveTimelineBtn = document.getElementById("saveTimelineBtn");
  if (saveTimelineBtn) {
    saveTimelineBtn.addEventListener("click", async () => {
      // Collect current values from DOM
      const list = document.getElementById("timelineList");
      if (list) {
        const rows = list.querySelectorAll(".settings-card");
        rows.forEach((row, idx) => {
          if (cmsData.timeline[idx]) {
            cmsData.timeline[idx] = {
              period: row.querySelector(".time-period-input").value,
              location: row.querySelector(".time-loc-input").value,
              role: row.querySelector(".time-role-input").value,
              company: row.querySelector(".time-company-input").value,
              summary: row.querySelector(".time-summary-input").value
            };
          }
        });
      }

      saveTimelineBtn.disabled = true;
      saveTimelineBtn.textContent = "Saving...";
      try {
        const res = await cmsStorage.save(cmsData);
        if (res.success) {
          const engineLabel = res.engine === "tidb" ? "TiDB Cloud" : (res.engine === "sqlite" ? "SQLite" : "Local Storage");
          showToast(`Career Journey saved ✓ (${engineLabel})`);
        } else {
          showToast("❌ " + (res.message || "Failed to save timeline"), true);
          handleAuthFailure(res.reason);
        }
      } catch (err) {
        showToast("❌ Error: " + err.message, true);
      } finally {
        saveTimelineBtn.disabled = false;
        saveTimelineBtn.textContent = "Save Career Journey ✓";
      }
    });
  }

  const addTimeBtn = document.getElementById("addTimelineBtn");
  if (addTimeBtn) {
    addTimeBtn.addEventListener("click", async () => {
      cmsData.timeline.unshift({
        period: "2026 - Present",
        location: "Remote / Global",
        role: "Principal Architect",
        company: "Next Corp",
        summary: "Leading technical strategy, architecture, and developer experience."
      });
      const res = await cmsStorage.save(cmsData);
      renderTimelineManager();
      if (res.success) {
        showToast("Timeline milestone added ✓");
      } else {
        showToast("❌ " + (res.message || "Failed to add milestone"), true);
        handleAuthFailure(res.reason);
      }
    });
  }

  // 9. Export & Backup (Tab 5)
  const downloadDataJsBtn = document.getElementById("downloadDataJsBtn");
  if (downloadDataJsBtn) {
    downloadDataJsBtn.addEventListener("click", () => {
      const content = cmsStorage.generateDataJsContent();
      const blob = new Blob([content], { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.js";
      a.click();
      URL.revokeObjectURL(url);
      showToast("data.js exported! You can replace js/data.js in your workspace ✓");
    });
  }

  const downloadJsonBtn = document.getElementById("downloadJsonBtn");
  if (downloadJsonBtn) {
    downloadJsonBtn.addEventListener("click", () => {
      const content = JSON.stringify(cmsData, null, 2);
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `portfolio_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("JSON backup downloaded ✓");
    });
  }

  const importJsonBtn = document.getElementById("importJsonBtn");
  const importFileInput = document.getElementById("importFileInput");
  if (importJsonBtn && importFileInput) {
    importJsonBtn.addEventListener("click", () => importFileInput.click());
    importFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          cmsData = {
            brand: { ...cmsData.brand, ...(parsed.brand || {}) },
            rail: { ...cmsData.rail, ...(parsed.rail || {}) },
            projects: Array.isArray(parsed.projects) ? parsed.projects : cmsData.projects,
            capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities : cmsData.capabilities,
            timeline: Array.isArray(parsed.timeline) ? parsed.timeline : cmsData.timeline
          };
          const res = await cmsStorage.save(cmsData);
          renderProjectsList();
          initConfigTab();
          renderCapabilitiesManager();
          renderTimelineManager();
          if (res.success) {
            showToast("Portfolio data imported successfully ✓");
          } else {
            showToast("❌ " + (res.message || "Failed to sync imported data"), true);
          }
        } catch (err) {
          alert("Error parsing JSON file. Please ensure it is a valid portfolio backup.");
        }
      };
      reader.readAsText(file);
    });
  }

  const factoryResetBtn = document.getElementById("factoryResetBtn");
  if (factoryResetBtn) {
    factoryResetBtn.addEventListener("click", () => {
      if (!confirm("Are you sure you want to reset all customizations back to factory default?")) return;
      cmsData = cmsStorage.reset();
      renderProjectsList();
      initConfigTab();
      renderCapabilitiesManager();
      renderTimelineManager();
      showToast("Reset to factory demo defaults ✓");
    });
  }

  // Initial Renders
  renderProjectsList();
  initConfigTab();
  renderCapabilitiesManager();
  renderTimelineManager();
});
