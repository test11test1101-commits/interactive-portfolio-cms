#!/usr/bin/env python3
"""
Interactive Portfolio & CMS Production Server
Supports:
- Render Cloud Deployment (Gunicorn + Flask + TiDB Serverless)
- Local Zero-Dependency Execution (Standard library http.server + SQLite)
- Automated Database Migration & Seeding
"""

import os
import sys
import json
import ssl
import sqlite3

# Try loading .env if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    if k not in os.environ:
                        os.environ[k] = v

# Environment Configuration
PORT = int(os.environ.get("PORT", 8080))
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "studio2026")
TIDB_HOST = os.environ.get("TIDB_HOST") or "gateway01.ap-southeast-1.prod.aws.tidbcloud.com"
TIDB_PORT = int(os.environ.get("TIDB_PORT", 4000))
TIDB_USER = os.environ.get("TIDB_USER") or "43eghUc9ZhsAxAo.root"
TIDB_PASSWORD = os.environ.get("TIDB_PASSWORD") or "brY7OoRIozdKsK2j"
TIDB_DATABASE = os.environ.get("TIDB_DATABASE") or "test"
if TIDB_DATABASE == "sys":
    TIDB_DATABASE = "test"

# Default Initial Seed Data
DEFAULT_DATA = {
    "brand": {
        "monogram": "W.",
        "name": "LYRCH // STUDIO",
        "role": "Creative Engineer",
        "statusText": "Available Q4 2026",
        "statusActive": True,
        "email": "contact@portfolio.dev"
    },
    "rail": {
        "defaultTension": 0.55,
        "showTags": True,
        "swayOnHover": True
    },
    "projects": [
        {
            "id": "proj-1793539866177",
            "title": "Auxiliary IT Helpdesk & Currency Terminal",
            "tagline": "Enterprise IT Operations, Real-Time Forex Telemetry & Live Desk",
            "category": "FinTech & Systems",
            "year": "2026",
            "badge": "HYBRID CLOUD / ZERO-FAILOVER",
            "tech": ["JavaScript (ES6+)", "Python 3", "Node.js", "TiDB Cloud (MySQL 8.0)", "REST APIs", "CSS3 Glassmorphism"],
            "image": "./assets/images/auxiliary_dashboard.jpg",
            "metrics": [
                {"label": "Relational Sync", "value": ""},
                {"label": "Schema Tables", "value": "14 Relational"},
                {"label": "failloer loss", "value": "10k"},
                {"label": "system uptime", "value": "99.98"}
            ],
            "overview": "A mission-critical enterprise IT operations and foreign exchange monitoring platform combining real-time denomination rate telemetry with an active helpdesk queue, staff duty management, and full administrative CMS control.",
            "architecture": "Engineered with a hybrid multi-runtime backend (Python 3 PyMySQL and Node.js Express) connected via SSL/TLS to TiDB Cloud Serverless (MySQL 8.0). Built with automated multi-layer failover caching to local persistent JSON storage, real-time ticket queue synchronization, and a high-performance vanilla CSS glassmorphic dashboard interface free of framework overhead.",
            "highlights": [
                "Real-time USD & 3rd currency exchange rate monitoring with banknote denomination breakdown ($1–$100)",
                "Live visitor helpdesk desk with queue registration, ticket tracking, and automated officer dispatch",
                "Administrative CMS console for live rate adjustments, personnel shift schedules, and tamper-resistant audit logs",
                "Dual-layer persistence ensuring 100% operational uptime via cloud relational sync and local JSON caching"
            ],
            "github": "https://github.com/your-username/auxiliary-dashboard",
            "demo": "https://auxiliary-dashboard.onrender.com"
        },
        {
            "id": "apex-core",
            "title": "Apex Core",
            "tagline": "High-Frequency Liquidity & Market Analytics Dashboard",
            "category": "FinTech & Systems",
            "year": "2026",
            "badge": "SUB-5MS LATENCY",
            "tech": ["Rust", "TypeScript", "WebSockets", "WebGPU", "TimescaleDB"],
            "image": "./assets/images/apex_dashboard.jpg",
            "metrics": [
                {"label": "Throughput", "value": "1.2M msg/s"},
                {"label": "P99 Latency", "value": "3.8ms"},
                {"label": "Data Telemetry", "value": "Zero Drop"},
                {"label": "Active Volume", "value": "$4.8B / mo"}
            ],
            "overview": "A mission-critical financial trading terminal providing institutional liquidity density mapping, real-time depth visualizers, and algorithmic order flow tracking across 40+ global exchanges.",
            "architecture": "Engineered with a high-throughput Rust backend streaming delta updates over binary WebSockets into a custom WebGPU-accelerated rendering pipeline on the browser.",
            "highlights": [
                "Real-time 3D order book depth terrain visualization using WebGPU compute shaders",
                "Sub-5ms tick-to-trade visualization telemetry with offline memory replay",
                "Dynamic multi-monitor docking workspace with persistent state sync"
            ],
            "github": "https://github.com",
            "demo": "https://apex-core.dev"
        },
        {
            "id": "verve-studio",
            "title": "Aetheris // 001-Tech",
            "tagline": "Luxury Modular Streetwear & 3D Garment Configurator",
            "category": "Creative & 3D",
            "year": "2026",
            "badge": "AOTM NOMINEE",
            "tech": ["Next.js 15", "Three.js", "GLSL Shaders", "Shopify Storefront", "GSAP"],
            "image": "./assets/images/verve_fashion.jpg",
            "metrics": [
                {"label": "Conversion Lift", "value": "+38%"},
                {"label": "Avg Session", "value": "4m 12s"},
                {"label": "3D Asset Size", "value": "<1.4MB"},
                {"label": "Client NPS", "value": "98/100"}
            ],
            "overview": "Inspired by avant-garde architectural tailoring, Aetheris is a next-generation luxury commerce experience with 3D cloth drape simulation.",
            "architecture": "Built on headless Shopify Storefront GraphQL API with Next.js App Router and Three.js WebGL shaders.",
            "highlights": [
                "Interactive 360 cloth drape simulation with tension heatmaps",
                "Sub-second page navigation powered by edge routing",
                "Modular swatch customizer with instant reactive state update"
            ],
            "github": "https://github.com",
            "demo": "https://aetheris-garments.io"
        },
        {
            "id": "aura-soundscape",
            "title": "Spektrum Sound",
            "tagline": "Generative Spatial Audio & Soundwave Visualizer",
            "category": "Creative & 3D",
            "year": "2026",
            "badge": "FWA OF THE DAY",
            "tech": ["Web Audio API", "WebGL", "TypeScript", "Math.js", "Canvas2D"],
            "image": "./assets/images/aura_soundscape.jpg",
            "metrics": [
                {"label": "Audio Nodes", "value": "64-channel"},
                {"label": "Render Rate", "value": "60 FPS"},
                {"label": "Track Streams", "value": "350k+"},
                {"label": "Community", "value": "14k Producers"}
            ],
            "overview": "An experimental web-native synthesizer and spatialized binaural audio laboratory transforming frequency data into harmonic ribbons.",
            "architecture": "Harnesses Web Audio AudioWorklet nodes for glitch-free DSP calculation off the main thread.",
            "highlights": [
                "Hardware-accelerated frequency spectrogram with 1024 FFT resolution",
                "Binaural 3D panner positioning audio sources anywhere around listener",
                "Exportable lossless stem recorder and MIDI controller plug-and-play"
            ],
            "github": "https://github.com",
            "demo": "https://spektrum-audio.dev"
        },
        {
            "id": "neuroflow-ai",
            "title": "NeuroFlow",
            "tagline": "Autonomous Multi-Agent Reasoning IDE & Node Graph",
            "category": "Systems & AI",
            "year": "2026",
            "badge": "PRODUCT OF THE WEEK",
            "tech": ["Python", "React", "Rust", "FastAPI", "WebSockets", "Docker"],
            "image": "./assets/images/neuroflow_ai.jpg",
            "metrics": [
                {"label": "Agent Speedup", "value": "4.6x"},
                {"label": "GitHub Stars", "value": "4.2k"},
                {"label": "Active Nodes", "value": "12,000+"},
                {"label": "Memory Footprint", "value": "18MB"}
            ],
            "overview": "A visual collaborative IDE for building, debugging, and tracing distributed autonomous AI agent networks.",
            "architecture": "Combines an asynchronous event-driven Python daemon with a lightweight virtualized canvas UI in React.",
            "highlights": [
                "Real-time visual execution timeline tracking LLM token streams",
                "Interactive time-travel replay debugger for multi-step planning",
                "Self-healing agent fault isolation with fallback routing"
            ],
            "github": "https://github.com",
            "demo": "https://neuroflow.ai"
        }
    ],
    "capabilities": [
        {
            "icon": "⚡",
            "title": "Systems & Performance",
            "desc": "Architecting high-throughput, low-latency client and server systems. Deep profiling in WebSockets, WebGPU, and memory-safe Rust/C++ bindings."
        },
        {
            "icon": "✨",
            "title": "Creative Technology",
            "desc": "Bridging the gap between engineering and art. Award-winning 3D WebGL experiences, shader programming, and tactile interactive physics."
        },
        {
            "icon": "🤖",
            "title": "Autonomous Agent Architecture",
            "desc": "Designing resilient tool-augmented LLM architectures, multi-agent orchestrators, and contextual memory graphs with strict evaluation harnesses."
        },
        {
            "icon": "💎",
            "title": "Modern E-Commerce",
            "desc": "Developing bespoke luxury digital flagships with headless Shopify, tailored micro-animations, and frictionless checkout optimization."
        }
    ],
    "timeline": [
        {
            "period": "2024 - Present",
            "role": "Lead Creative Technologist & Architect",
            "company": "Autonomous Studio",
            "location": "Remote / Global",
            "summary": "Spearheading high-impact 3D visual experiences, high-performance distributed dashboards, and bespoke flagship interfaces for Fortune 500 brands."
        },
        {
            "period": "2022 - 2024",
            "role": "Senior Full-Stack Engineer",
            "company": "Hyperion Digital",
            "location": "San Francisco, CA",
            "summary": "Led frontend architecture across real-time crypto telemetry engines, cutting P99 latency by 62% and scaling to 1.5M monthly active traders."
        },
        {
            "period": "2020 - 2022",
            "role": "Creative Frontend Developer",
            "company": "Form & Function Lab",
            "location": "New York, NY",
            "summary": "Crafted interactive WebGL editorial stories, responsive design systems, and digital product campaigns earning multiple Awwwards and FWA honors."
        }
    ]
}

# ---------------------------------------------------------------------------
# Database Connector (TiDB Cloud Serverless or Local SQLite)
# ---------------------------------------------------------------------------

def get_db_connection():
    if TIDB_HOST:
        try:
            import pymysql
            import pymysql.cursors
            ctx = ssl.create_default_context()
            conn = pymysql.connect(
                host=TIDB_HOST,
                port=TIDB_PORT,
                user=TIDB_USER,
                password=TIDB_PASSWORD,
                database=TIDB_DATABASE,
                ssl=ctx,
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=True,
                connect_timeout=8,
                read_timeout=15,
                write_timeout=15
            )
            return conn, "tidb"
        except Exception as e:
            print(f"[Warning] Failed to connect to TiDB at {TIDB_HOST}: {e}. Falling back to SQLite.")

    # Local SQLite Fallback
    db_path = os.path.join(os.path.dirname(__file__), "portfolio.db")
    conn = sqlite3.connect(db_path, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn, "sqlite"

def init_tables():
    conn, engine = get_db_connection()
    cursor = conn.cursor()

    if engine == "tidb":
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS portfolio_store (
                id VARCHAR(20) PRIMARY KEY,
                payload JSON NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("SELECT id FROM portfolio_store WHERE id = 'main'")
        row = cursor.fetchone()
        if not row:
            cursor.execute(
                "INSERT INTO portfolio_store (id, payload) VALUES ('main', %s)",
                (json.dumps(DEFAULT_DATA),)
            )
            try:
                conn.commit()
            except Exception:
                pass
    else:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS portfolio_store (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("SELECT id FROM portfolio_store WHERE id = 'main'")
        row = cursor.fetchone()
        if not row:
            cursor.execute(
                "INSERT INTO portfolio_store (id, payload) VALUES ('main', ?)",
                (json.dumps(DEFAULT_DATA),)
            )
        conn.commit()

    conn.close()
    print(f"[Database] Initialized successfully using engine: {engine}")

try:
    init_tables()
except Exception as err:
    print(f"[Database Init Warning] {err}")

def load_portfolio_data():
    try:
        conn, engine = get_db_connection()
        cursor = conn.cursor()
        if engine == "tidb":
            cursor.execute("SELECT payload FROM portfolio_store WHERE id = 'main'")
            row = cursor.fetchone()
            conn.close()
            if row:
                payload = row.get("payload")
                return (json.loads(payload) if isinstance(payload, str) else payload), engine
        else:
            cursor.execute("SELECT payload FROM portfolio_store WHERE id = 'main'")
            row = cursor.fetchone()
            conn.close()
            if row:
                return json.loads(row["payload"]), engine
    except Exception as e:
        print(f"[Load Error] {e}")
    return DEFAULT_DATA, "defaults"

def save_portfolio_data(data):
    try:
        current, _ = load_portfolio_data()
        if isinstance(current, dict) and isinstance(data, dict):
            merged = {**current, **data}
            if "brand" in current and "brand" in data and isinstance(data["brand"], dict):
                merged["brand"] = {**current["brand"], **data["brand"]}
            if "rail" in current and "rail" in data and isinstance(data["rail"], dict):
                merged["rail"] = {**current["rail"], **data["rail"]}
            if "projects" in data and isinstance(data["projects"], list):
                merged["projects"] = data["projects"]
            if "capabilities" in data and isinstance(data["capabilities"], list):
                merged["capabilities"] = data["capabilities"]
            if "timeline" in data and isinstance(data["timeline"], list):
                merged["timeline"] = data["timeline"]
        else:
            merged = data

        conn, engine = get_db_connection()
        cursor = conn.cursor()
        payload_str = json.dumps(merged)

        if engine == "tidb":
            cursor.execute(
                "INSERT INTO portfolio_store (id, payload) VALUES ('main', %s) ON DUPLICATE KEY UPDATE payload = VALUES(payload)",
                (payload_str,)
            )
            try:
                conn.commit()
            except Exception:
                pass
        else:
            cursor.execute(
                "INSERT INTO portfolio_store (id, payload, updated_at) VALUES ('main', ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP",
                (payload_str,)
            )
            conn.commit()
        conn.close()
        return True, engine
    except Exception as e:
        print(f"[Save Error] {e}")
        return False, str(e)


# ---------------------------------------------------------------------------
# Flask Application Setup (Used by Gunicorn on Render)
# ---------------------------------------------------------------------------

try:
    from flask import Flask, jsonify, request, send_from_directory

    app = Flask(__name__, static_folder=".")

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Admin-Password, X-Filename"
        return response

    @app.route("/")
    def index():
        return send_from_directory(".", "index.html")

    @app.route("/admin")
    @app.route("/admin.html")
    def admin():
        return send_from_directory(".", "admin.html")

    @app.route("/<path:path>")
    def static_proxy(path):
        return send_from_directory(".", path)

    @app.route("/api/portfolio", methods=["GET", "OPTIONS"])
    def get_portfolio():
        if request.method == "OPTIONS":
            return jsonify({"status": "ok"})
        data, engine = load_portfolio_data()
        return jsonify({"data": data, "engine": engine, "status": "ok"})

    @app.route("/api/portfolio", methods=["POST"])
    def update_portfolio():
        auth = request.headers.get("Authorization", "")
        token = auth.replace("Bearer ", "").strip()
        custom_header = request.headers.get("X-Admin-Password", "").strip()

        if token != ADMIN_PASSWORD and custom_header != ADMIN_PASSWORD:
            return jsonify({"error": "Unauthorized. Invalid Admin Password."}), 401

        req_json = request.get_json(silent=True)
        if not req_json:
            return jsonify({"error": "Invalid JSON payload"}), 400

        success, info = save_portfolio_data(req_json)
        if success:
            return jsonify({"status": "saved", "engine": info})
        return jsonify({"error": info}), 500

    @app.route("/api/upload-video", methods=["POST", "OPTIONS"])
    def upload_video():
        if request.method == "OPTIONS":
            return jsonify({"status": "ok"})
        auth = request.headers.get("Authorization", "")
        token = auth.replace("Bearer ", "").strip()
        custom_header = request.headers.get("X-Admin-Password", "").strip()

        if token != ADMIN_PASSWORD and custom_header != ADMIN_PASSWORD:
            return jsonify({"error": "Unauthorized. Invalid Admin Password."}), 401

        target_dir = os.path.join(os.path.dirname(__file__), "assets", "videos")
        os.makedirs(target_dir, exist_ok=True)

        if "video" in request.files:
            file = request.files["video"]
            filename = "".join(c for c in os.path.basename(file.filename) if c.isalnum() or c in "._-") or "video.mp4"
            dest = os.path.join(target_dir, filename)
            file.save(dest)
            return jsonify({"status": "uploaded", "url": f"./assets/videos/{filename}"})
        else:
            filename = request.headers.get("X-Filename", "video.mp4")
            filename = "".join(c for c in os.path.basename(filename) if c.isalnum() or c in "._-") or "video.mp4"
            dest = os.path.join(target_dir, filename)
            with open(dest, "wb") as f:
                f.write(request.get_data())
            return jsonify({"status": "uploaded", "url": f"./assets/videos/{filename}"})

    @app.route("/api/verify-auth", methods=["POST", "OPTIONS"])
    def verify_auth():
        if request.method == "OPTIONS":
            return jsonify({"valid": True})
        req_json = request.get_json(silent=True) or {}
        password = req_json.get("password", "")
        if password == ADMIN_PASSWORD:
            return jsonify({"valid": True})
        return jsonify({"valid": False}), 401

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "healthy", "service": "interactive-portfolio"})

except ImportError:
    app = None


# ---------------------------------------------------------------------------
# Standalone Fallback Runner (Built-in http.server if Flask is not installed)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if app:
        print(f"[Server] Starting Flask server on http://localhost:{PORT}")
        app.run(host="0.0.0.0", port=PORT, debug=False)
    else:
        import http.server
        import urllib.parse

        class FallbackHandler(http.server.SimpleHTTPRequestHandler):
            def log_message(self, format, *args):
                try:
                    super().log_message(format, *args)
                except Exception:
                    # Ignore I/O errors from disconnected pseudo-terminals
                    pass

            def send_cors_headers(self):
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Password, X-Filename")

            def do_OPTIONS(self):
                self.send_response(204)
                self.send_cors_headers()
                self.end_headers()

            def do_GET(self):
                parsed = urllib.parse.urlparse(self.path)
                if parsed.path == "/api/portfolio":
                    data, engine = load_portfolio_data()
                    response = json.dumps({"data": data, "engine": engine, "status": "ok"}).encode("utf-8")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(response)
                elif parsed.path == "/api/health":
                    response = json.dumps({"status": "healthy"}).encode("utf-8")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(response)
                elif parsed.path in ["/admin", "/admin/"]:
                    self.path = "/admin.html"
                    super().do_GET()
                else:
                    super().do_GET()

            def do_POST(self):
                parsed = urllib.parse.urlparse(self.path)
                if parsed.path == "/api/portfolio":
                    auth = self.headers.get("Authorization", "").replace("Bearer ", "").strip()
                    custom_header = self.headers.get("X-Admin-Password", "").strip()
                    if auth != ADMIN_PASSWORD and custom_header != ADMIN_PASSWORD:
                        self.send_response(401)
                        self.send_header("Content-Type", "application/json")
                        self.send_cors_headers()
                        self.end_headers()
                        self.wfile.write(json.dumps({"error": "Unauthorized. Invalid Admin Key."}).encode("utf-8"))
                        return

                    length = int(self.headers.get("Content-Length", 0))
                    body = self.rfile.read(length)
                    try:
                        data = json.loads(body.decode("utf-8"))
                    except Exception as err:
                        self.send_response(400)
                        self.send_header("Content-Type", "application/json")
                        self.send_cors_headers()
                        self.end_headers()
                        self.wfile.write(json.dumps({"error": f"Invalid JSON payload: {err}"}).encode("utf-8"))
                        return

                    success, info = save_portfolio_data(data)
                    self.send_response(200 if success else 500)
                    self.send_header("Content-Type", "application/json")
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "saved" if success else "error", "engine": info}).encode("utf-8"))
                elif parsed.path == "/api/upload-video":
                    auth = self.headers.get("Authorization", "").replace("Bearer ", "").strip()
                    custom_header = self.headers.get("X-Admin-Password", "").strip()
                    if auth != ADMIN_PASSWORD and custom_header != ADMIN_PASSWORD:
                        self.send_response(401)
                        self.send_header("Content-Type", "application/json")
                        self.send_cors_headers()
                        self.end_headers()
                        self.wfile.write(json.dumps({"error": "Unauthorized. Invalid Admin Key."}).encode("utf-8"))
                        return

                    raw_filename = self.headers.get("X-Filename", "video.mp4")
                    filename = "".join(c for c in os.path.basename(raw_filename) if c.isalnum() or c in "._-") or "video.mp4"
                    target_dir = os.path.join(os.path.dirname(__file__), "assets", "videos")
                    os.makedirs(target_dir, exist_ok=True)
                    dest = os.path.join(target_dir, filename)

                    length = int(self.headers.get("Content-Length", 0))
                    with open(dest, "wb") as f:
                        remaining = length
                        while remaining > 0:
                            chunk = self.rfile.read(min(remaining, 65536))
                            if not chunk:
                                break
                            f.write(chunk)
                            remaining -= len(chunk)

                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "uploaded", "url": f"./assets/videos/{filename}"}).encode("utf-8"))
                elif parsed.path == "/api/verify-auth":
                    length = int(self.headers.get("Content-Length", 0))
                    body = self.rfile.read(length)
                    try:
                        data = json.loads(body.decode("utf-8"))
                    except Exception:
                        data = {}
                    valid = data.get("password") == ADMIN_PASSWORD
                    self.send_response(200 if valid else 401)
                    self.send_header("Content-Type", "application/json")
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps({"valid": valid}).encode("utf-8"))
                else:
                    self.send_response(404)
                    self.send_cors_headers()
                    self.end_headers()

        print(f"[Server] Running built-in Python HTTP server on http://localhost:{PORT}")
        server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), FallbackHandler)
        server.serve_forever()

