# Vyom 3D Lok - Futuristic Gaming & Animation Platform

Welcome to **Vyom 3D Lok** (Vyom = Space/Universe, Lok = Realm) — a visually premium, responsive, and cinematic portal designed for digital animators, visual effect editors, indie gaming developers, and creator communities.

This project is built as a state-of-the-art Single Page Application (SPA) using clean, high-performance HTML5, CSS3, and ES6+ JavaScript. It runs fully client-side with no complex build setups or installations required.

---

## 🚀 Key Features

* **Cinematic Landing Page:** Immersive deep space canvas particles that react to mouse dynamics and hover neon glow elements.
* **SPA Routing Engine:** Fast page shifting without full window reloads (Home, Animations, Games Showcase, Community Forums, Chronicles Blog, and Dashboards).
* **Gamified XP Progression System:** Earn Sentinel XP and level up by liking videos (+30 XP), leaving feedback comments (+30 XP), sharing forum updates (+60 XP), and uploading animations (+100 XP). State is persisted in your browser's `localStorage`.
* **Verified Creator Dashboard:** A stylized gaming control dashboard to track your Level, XP logs, followed creators, uploaded videos list, achievements badges room, and mock partner monetization streams.
* **AI Tool Suite:**
  * **AI Chat Assistant:** A smart conversational assistant to search titles, suggest games, recommend animations, or check XP rates.
  * **AI Thumbnail Generator:** An interactive neural render tool to generate custom visual templates.
* **Superuser Admin Panel:** Live metrics tracking site health, an interactive SVG viewership graph, and content moderation queue approval panels.

---

## 🛠️ Tech Stack & Libraries

* **Core Structure:** HTML5
* **Visual System:** Vanilla CSS3 (HSL design variables, responsive flexbox/grid layout, custom animations, and backdrop-filter glassmorphism)
* **Logic Controller:** ES6+ JavaScript (State management, fuzzy search algorithms, and client routing)
* **Background Effects:** HTML5 Canvas (Particle physics simulation)
* **Icons:** Lucide Icons (imported via CDN)

---

## ⚡ How to Run Locally

Since this is a client-side SPA, you can launch it instantly without Node.js or npm:

### Option A: Python Server (Recommended)
If you have Python installed, open your terminal in the project directory and run:
```bash
python -m http.server 8000
```
Then, open your web browser and navigate to: **`http://localhost:8000`**

### Option B: Direct Launch
Simply double-click the `index.html` file in your file explorer to open it in any modern browser.
