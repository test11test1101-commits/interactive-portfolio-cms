/**
 * Portfolio Data Catalog
 * High-fidelity project records, capabilities, and timeline data.
 */

export const PROJECTS = [
  {
    id: "proj-1793539866177",
    title: "Auxiliary IT Helpdesk & Currency Terminal",
    tagline: "Enterprise IT Operations, Real-Time Forex Telemetry & Live Desk",
    category: "FinTech & Systems",
    year: "2026",
    badge: "HYBRID CLOUD / ZERO-FAILOVER",
    tech: ["JavaScript (ES6+)", "Python 3", "Node.js", "TiDB Cloud (MySQL 8.0)", "REST APIs", "CSS3 Glassmorphism"],
    image: "./assets/images/auxiliary_dashboard.jpg",
    metrics: [
      { label: "Relational Sync", value: "" },
      { label: "Schema Tables", value: "14 Relational" },
      { label: "failloer loss", value: "10k" },
      { label: "system uptime", value: "99.98" }
    ],
    overview: "A mission-critical enterprise IT operations and foreign exchange monitoring platform combining real-time denomination rate telemetry with an active helpdesk queue, staff duty management, and full administrative CMS control.",
    architecture: "Engineered with a hybrid multi-runtime backend (Python 3 PyMySQL and Node.js Express) connected via SSL/TLS to TiDB Cloud Serverless (MySQL 8.0). Built with automated multi-layer failover caching to local persistent JSON storage, real-time ticket queue synchronization, and a high-performance vanilla CSS glassmorphic dashboard interface free of framework overhead.",
    highlights: [
      "Real-time USD & 3rd currency exchange rate monitoring with banknote denomination breakdown ($1–$100)",
      "Live visitor helpdesk desk with queue registration, ticket tracking, and automated officer dispatch",
      "Administrative CMS console for live rate adjustments, personnel shift schedules, and tamper-resistant audit logs",
      "Dual-layer persistence ensuring 100% operational uptime via cloud relational sync and local JSON caching"
    ],
    github: "https://github.com/your-username/auxiliary-dashboard",
    demo: "https://auxiliary-dashboard.onrender.com"
  },
  {
    id: "apex-core",
    title: "Apex Core",
    tagline: "High-Frequency Liquidity & Market Analytics Dashboard",
    category: "FinTech & Systems",
    year: "2026",
    badge: "SUB-5MS LATENCY",
    tech: ["Rust", "TypeScript", "WebSockets", "WebGPU", "TimescaleDB"],
    image: "./assets/images/apex_dashboard.jpg",
    metrics: [
      { label: "Throughput", value: "1.2M msg/s" },
      { label: "P99 Latency", value: "3.8ms" },
      { label: "Data Telemetry", value: "Zero Drop" },
      { label: "Active Volume", value: "$4.8B / mo" }
    ],
    overview: "A mission-critical financial trading terminal providing institutional liquidity density mapping, real-time depth visualizers, and algorithmic order flow tracking across 40+ global exchanges.",
    architecture: "Engineered with a high-throughput Rust backend streaming delta updates over binary WebSockets into a custom WebGPU-accelerated rendering pipeline on the browser. Features zero-copy deserialization and a lock-free ring buffer for rock-solid 120 FPS rendering under market turbulence.",
    highlights: [
      "Real-time 3D order book depth terrain visualization using WebGPU compute shaders",
      "Sub-5ms tick-to-trade visualization telemetry with offline memory replay",
      "Dynamic multi-monitor docking workspace with persistent state sync"
    ],
    github: "https://github.com",
    demo: "https://apex-core.dev"
  },
  {
    id: "verve-studio",
    title: "Aetheris // 001-Tech",
    tagline: "Luxury Modular Streetwear & 3D Garment Configurator",
    category: "Creative & 3D",
    year: "2026",
    badge: "AOTM NOMINEE",
    tech: ["Next.js 15", "Three.js", "GLSL Shaders", "Shopify Storefront", "GSAP"],
    image: "./assets/images/verve_fashion.jpg",
    metrics: [
      { label: "Conversion Lift", value: "+38%" },
      { label: "Avg Session", value: "4m 12s" },
      { label: "3D Asset Size", value: "<1.4MB" },
      { label: "Client NPS", value: "98/100" }
    ],
    overview: "Inspired by avant-garde architectural tailoring, Aetheris is a next-generation luxury commerce experience. Users can inspect dynamic cloth drape simulations, customize modular hardware accessories, and purchase with instant headless checkout.",
    architecture: "Built on headless Shopify Storefront GraphQL API with Next.js App Router. 3D garments are rendered via WebGL/Three.js with custom PBR fabric shaders simulating iridescent ballistic nylon, tactile stitching, and real-time physical lighting.",
    highlights: [
      "Interactive 360 cloth drape simulation with tension heatmaps",
      "Sub-second page navigation powered by edge routing and image optimizations",
      "Modular swatch customizer with instant reactive state update"
    ],
    github: "https://github.com",
    demo: "https://aetheris-garments.io"
  },
  {
    id: "aura-soundscape",
    title: "Spektrum Sound",
    tagline: "Generative Spatial Audio & Soundwave Visualizer",
    category: "Creative & 3D",
    year: "2026",
    badge: "FWA OF THE DAY",
    tech: ["Web Audio API", "WebGL", "TypeScript", "Math.js", "Canvas2D"],
    image: "./assets/images/aura_soundscape.jpg",
    metrics: [
      { label: "Audio Nodes", value: "64-channel" },
      { label: "Render Rate", value: "60 FPS" },
      { label: "Track Streams", value: "350k+" },
      { label: "Community", value: "14k Producers" }
    ],
    overview: "An experimental web-native synthesizer and spatialized binaural audio laboratory that transforms frequency data into fluid, luminescent harmonic ribbons in real time.",
    architecture: "Harnesses Web Audio AudioWorklet nodes for glitch-free DSP calculation off the main thread. FFT frequency spectrum is channeled into custom vertex displacement shaders that generate undulating ribbons reacting to bass, mids, and spatial resonance.",
    highlights: [
      "Hardware-accelerated frequency spectrogram with 1024 FFT resolution",
      "Binaural 3D panner positioning audio sources anywhere around the listener's head",
      "Exportable lossless stem recorder and MIDI controller plug-and-play"
    ],
    github: "https://github.com",
    demo: "https://spektrum-audio.dev"
  },
  {
    id: "neuroflow-ai",
    title: "NeuroFlow",
    tagline: "Autonomous Multi-Agent Reasoning IDE & Node Graph",
    category: "Systems & AI",
    year: "2026",
    badge: "PRODUCT OF THE WEEK",
    tech: ["Python", "React", "Rust", "FastAPI", "WebSockets", "Docker"],
    image: "./assets/images/neuroflow_ai.jpg",
    metrics: [
      { label: "Agent Speedup", value: "4.6x" },
      { label: "GitHub Stars", value: "4.2k" },
      { label: "Active Nodes", value: "12,000+" },
      { label: "Memory Footprint", value: "18MB" }
    ],
    overview: "A visual collaborative IDE for building, debugging, and tracing distributed autonomous AI agent networks. Visualizes live chain-of-thought steps, parallel tool calls, and error recovery in real time.",
    architecture: "Combines an asynchronous event-driven Python daemon with a lightweight virtualized canvas UI in React. Node updates are synchronized via delta-compressed WebSockets, delivering fluid 60fps graph layout even with hundreds of executing agents.",
    highlights: [
      "Real-time visual execution timeline tracking LLM token streams and subagent branching",
      "Interactive time-travel replay debugger for generative multi-step planning",
      "Self-healing agent fault isolation with fallback routing"
    ],
    github: "https://github.com",
    demo: "https://neuroflow.ai"
  }
];

export const CAPABILITIES = [
  {
    icon: "⚡",
    title: "Systems & Performance",
    desc: "Architecting high-throughput, low-latency client and server systems. Deep profiling in WebSockets, WebGPU, and memory-safe Rust/C++ bindings."
  },
  {
    icon: "✨",
    title: "Creative Technology",
    desc: "Bridging the gap between engineering and art. Award-winning 3D WebGL experiences, shader programming, and tactile interactive physics."
  },
  {
    icon: "🤖",
    title: "Autonomous Agent Architecture",
    desc: "Designing resilient tool-augmented LLM architectures, multi-agent orchestrators, and contextual memory graphs with strict evaluation harnesses."
  },
  {
    icon: "💎",
    title: "Modern E-Commerce",
    desc: "Developing bespoke luxury digital flagships with headless Shopify, tailored micro-animations, and frictionless checkout optimization."
  }
];

export const CAREER_TIMELINE = [
  {
    period: "2024 - Present",
    role: "Lead Creative Technologist & Architect",
    company: "Autonomous Studio",
    location: "Remote / Global",
    summary: "Spearheading high-impact 3D visual experiences, high-performance distributed dashboards, and bespoke flagship interfaces for Fortune 500 brands."
  },
  {
    period: "2022 - 2024",
    role: "Senior Full-Stack Engineer",
    company: "Hyperion Digital",
    location: "San Francisco, CA",
    summary: "Led frontend architecture across real-time crypto telemetry engines, cutting P99 latency by 62% and scaling to 1.5M monthly active traders."
  },
  {
    period: "2020 - 2022",
    role: "Creative Frontend Developer",
    company: "Form & Function Lab",
    location: "New York, NY",
    summary: "Crafted interactive WebGL editorial stories, responsive design systems, and digital product campaigns earning multiple Awwwards and FWA honors."
  }
];
