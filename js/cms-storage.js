/**
 * CMS Storage & Data Synchronization Engine
 * Handles persistent localStorage caching, defaults fallback,
 * backend REST API synchronization (TiDB Cloud / SQLite), and export.
 */

import { PROJECTS, CAPABILITIES, CAREER_TIMELINE } from "./data.js";

const STORAGE_KEY = "portfolio_cms_store_v1";
const AUTH_KEY = "portfolio_cms_auth_token";

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
    this.syncWithServer();
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
      const res = await fetch("/api/portfolio");
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          this.data = result.data;
          this.dbEngine = result.engine || "server";
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          window.dispatchEvent(new CustomEvent("portfolio-cms-updated", { 
            detail: { ...this.data, _engine: this.dbEngine } 
          }));
        }
      }
    } catch (e) {
      // Backend not running (static file mode), safe fallback
    }
  }

  getAdminPassword() {
    return localStorage.getItem(AUTH_KEY) || "";
  }

  setAdminPassword(pwd) {
    localStorage.setItem(AUTH_KEY, pwd);
  }

  async save(newData) {
    this.data = { ...this.data, ...newData };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    window.dispatchEvent(new CustomEvent("portfolio-cms-updated", { 
      detail: { ...this.data, _engine: this.dbEngine } 
    }));

    // Attempt saving to backend API (TiDB Cloud)
    const pwd = this.getAdminPassword();
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${pwd}`,
          "X-Admin-Password": pwd
        },
        body: JSON.stringify(this.data)
      });

      if (res.status === 401) {
        return { success: false, reason: "unauthorized" };
      }
      if (res.ok) {
        const json = await res.json();
        this.dbEngine = json.engine || "server";
        return { success: true, engine: this.dbEngine };
      }
    } catch (err) {
      // Offline or static mode
    }

    return { success: true, engine: "local" };
  }

  getData() {
    return this.data;
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    localStorage.removeItem(STORAGE_KEY);
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
