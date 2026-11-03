/**
 * CMS Storage & Data Synchronization Engine
 * Handles persistent localStorage caching, defaults fallback,
 * backend REST API synchronization (TiDB Cloud / SQLite), and export.
 */

import { PROJECTS, CAPABILITIES, CAREER_TIMELINE } from "./data.js";

const STORAGE_KEY = "portfolio_cms_store_v1";
const AUTH_KEY = "portfolio_cms_auth_token";
export const DEFAULT_ADMIN_KEY = "studio2026";

export const DEFAULT_CONFIG = {
  brand: {
    monogram: "W.",
    name: "LYRCH // STUDIO",
    role: "Creative Engineer",
    statusText: "Available Q4 2026",
    statusActive: true,
    email: "contact@portfolio.dev"
  },
  rail: {
    defaultTension: 0.55,
    showTags: true,
    swayOnHover: true
  },
  projects: PROJECTS,
  capabilities: CAPABILITIES,
  timeline: CAREER_TIMELINE
};

class CMSStorage {
  constructor() {
    this.data = this.loadLocal();
    this.dbEngine = "local";
    
    // Ensure default admin key is initialized so requests don't fail with 401
    if (!localStorage.getItem(AUTH_KEY)) {
      try {
        localStorage.setItem(AUTH_KEY, DEFAULT_ADMIN_KEY);
      } catch (e) {
        // Safe fallback
      }
    }
    
    this.syncWithServer();
  }

  getApiEndpoint() {
    if (typeof window !== "undefined" && window.location) {
      if (window.location.protocol === "file:") {
        return "http://localhost:8080/api/portfolio";
      }
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        if (window.location.port && window.location.port !== "8080") {
          return `http://${window.location.hostname}:8080/api/portfolio`;
        }
      }
    }
    return "/api/portfolio";
  }

  loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          brand: { ...DEFAULT_CONFIG.brand, ...(parsed.brand || {}) },
          rail: { ...DEFAULT_CONFIG.rail, ...(parsed.rail || {}) },
          projects: Array.isArray(parsed.projects) ? parsed.projects : DEFAULT_CONFIG.projects,
          capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities : DEFAULT_CONFIG.capabilities,
          timeline: Array.isArray(parsed.timeline) ? parsed.timeline : DEFAULT_CONFIG.timeline
        };
      }
    } catch (e) {
      console.warn("CMSStorage: Failed to parse localStorage", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  async syncWithServer() {
    try {
      const endpoint = this.getApiEndpoint();
      const res = await fetch(endpoint);
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          this.data = result.data;
          this.dbEngine = result.engine || "server";
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          } catch (e) {}
          window.dispatchEvent(new CustomEvent("portfolio-cms-updated", { 
            detail: { ...this.data, _engine: this.dbEngine } 
          }));
        }
      }
    } catch (e) {
      // Backend server not running (static file mode) - safe fallback
    }
  }

  getAdminPassword() {
    const pwd = localStorage.getItem(AUTH_KEY);
    return (pwd && pwd.trim()) ? pwd.trim() : DEFAULT_ADMIN_KEY;
  }

  setAdminPassword(pwd) {
    const val = (pwd && pwd.trim()) ? pwd.trim() : DEFAULT_ADMIN_KEY;
    try {
      localStorage.setItem(AUTH_KEY, val);
    } catch (e) {}
  }

  async save(newData) {
    this.data = { ...this.data, ...newData };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn("CMSStorage: Failed to update localStorage", e);
    }

    window.dispatchEvent(new CustomEvent("portfolio-cms-updated", { 
      detail: { ...this.data, _engine: this.dbEngine } 
    }));

    // Save to backend API (TiDB Cloud / SQLite)
    const pwd = this.getAdminPassword();
    const endpoint = this.getApiEndpoint();
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${pwd}`,
          "X-Admin-Password": pwd
        },
        body: JSON.stringify(this.data)
      });

      if (res.status === 401) {
        return { 
          success: false, 
          reason: "unauthorized", 
          message: "Authentication failed: Invalid Admin Key. Please ensure the Admin Key in the top navigation matches ADMIN_PASSWORD." 
        };
      }

      if (res.ok) {
        const json = await res.json();
        this.dbEngine = json.engine || "server";
        window.dispatchEvent(new CustomEvent("portfolio-cms-updated", { 
          detail: { ...this.data, _engine: this.dbEngine } 
        }));
        return { success: true, engine: this.dbEngine };
      }

      const errText = await res.text();
      return { 
        success: false, 
        reason: "server_error", 
        message: `Backend error (${res.status}): ${errText || res.statusText}` 
      };
    } catch (err) {
      // Offline or static server mode
      return { 
        success: true, 
        engine: "local", 
        warning: "Saved to browser localStorage (Backend server is offline or unreachable)." 
      };
    }
  }

  getUploadEndpoint() {
    const api = this.getApiEndpoint();
    return api.replace(/\/api\/portfolio$/, "/api/upload-video");
  }

  getImageUploadEndpoint() {
    const api = this.getApiEndpoint();
    return api.replace(/\/api\/portfolio$/, "/api/upload-image");
  }

  async uploadImage(file) {
    if (!file) return { success: false, message: "No image file selected" };
    const pwd = this.getAdminPassword() || DEFAULT_ADMIN_KEY;
    const endpoint = this.getImageUploadEndpoint();

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${pwd}`,
          "X-Admin-Password": pwd,
          "X-Filename": encodeURIComponent(file.name),
          "Content-Type": file.type || "application/octet-stream"
        },
        body: file
      });

      if (res.status === 401) {
        return {
          success: false,
          reason: "unauthorized",
          message: "Authentication failed: Invalid Admin Key."
        };
      }

      if (res.ok) {
        const json = await res.json();
        return { success: true, url: json.url, localPath: json.localPath, engine: json.engine, mediaId: json.mediaId };
      }

      const errText = await res.text();
      return { success: false, message: `Upload failed (${res.status}): ${errText}` };
    } catch (err) {
      console.error("[CMS] Image upload error:", err);
      return { success: false, message: `Upload failed: ${err.message}` };
    }
  }

  async uploadVideo(file) {
    if (!file) return { success: false, message: "No file selected" };
    const pwd = this.getAdminPassword() || DEFAULT_ADMIN_KEY;
    const endpoint = this.getUploadEndpoint();

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${pwd}`,
          "X-Admin-Password": pwd,
          "X-Filename": encodeURIComponent(file.name),
          "Content-Type": file.type || "application/octet-stream"
        },
        body: file
      });

      if (res.status === 401) {
        return {
          success: false,
          reason: "unauthorized",
          message: "Authentication failed: Invalid Admin Key."
        };
      }

      if (res.ok) {
        const json = await res.json();
        return { success: true, url: json.url };
      }

      const errText = await res.text();
      return { success: false, message: `Upload failed (${res.status}): ${errText}` };
    } catch (err) {
      console.error("[CMS] Video upload error:", err);
      return { success: false, message: `Upload failed: ${err.message}` };
    }
  }

  getData() {
    return this.data;
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    window.dispatchEvent(new CustomEvent("portfolio-cms-updated", { detail: this.data }));
    return this.data;
  }

  generateDataJsContent() {
    return `/**
 * Portfolio Data Catalog (Exported from CMS Studio)
 * Generated at: ${new Date().toISOString()}
 */

export const PROJECTS = ${JSON.stringify(this.data.projects, null, 2)};

export const CAPABILITIES = ${JSON.stringify(this.data.capabilities, null, 2)};

export const CAREER_TIMELINE = ${JSON.stringify(this.data.timeline, null, 2)};
`;
  }
}

export const cmsStorage = new CMSStorage();
