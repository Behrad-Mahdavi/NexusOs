# 🌌 Nexus OS

> **Your Personal Operating System for Productivity & Growth**
>
> Nexus OS is a futuristic, glass-morphic web application designed to centralize every aspect of your life—from university assignments and freelance projects to financial tracking and knowledge management.



---

## ✨ Features

### 🎯 Dashboard & Focus
- **Central Hub**: A unified view of your most urgent tasks and metrics.
- **Focus Mode**: A dedicated, distraction-free timer with immersive visuals to keep you in the flow.
- **Aurora UI**: Beautiful, animated backgrounds and glass-morphic components powered by `framer-motion`.

### 🧠 Second Brain (Knowledge Graph)
- **Interactive Graph**: Visualize your ideas and their connections using a dynamic node-link diagram (D3 + Recharts).
- **Insight Mapping**: Capture thoughts and link them together to build a personal knowledge base.

### 🎓 University Module
- **Course Management**: Track courses, schedules, and professors.
- **Assignment Tracker**: Never miss a deadline with a visual timeline of homework, exams, and projects.

### 💼 Freelance Board
- **Project Kanban**: Manage client work with a drag-and-drop style interface.
- **Client & Revenue Tracking**: Keep tabs on active clients and income sources.

### 💰 Finance Dashboard
- **Income & Expense Analysis**: Visualize your financial health.
- **Revenue Goals**: Set and track financial targets linked to your freelance and life tasks.

### 🌍 Internationalization
- **Bilingual Support**: Fully localized for **English** and **Persian (Farsi)**.
- **RTL Support**: Native Right-to-Left layout support with Vazirmatn font for Persian users.

---

## 🛠 Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Libraries**: [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/), [D3.js](https://d3js.org/)
- **Backend**: [Supabase](https://supabase.com/) (Auth & Database)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A Supabase account

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/nexus-os.git
    cd nexus-os
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Setup Database**
    Run the SQL script provided in `supabase_schema.sql` in your Supabase SQL Editor to create the necessary tables (`tasks`, `courses`, `assignments`, `nodes`, `links`).

5.  **Run the App**
    ```bash
    npm run dev
    ```

---

## 🎨 UI Highlight

Nexus OS utilizes a custom **Glassmorphism** design system.
check out `components/GlassCard.tsx` and `index.css` to see how the frosted glass effect is achieved using backdrop-filters and semi-transparent borders.

---

## 📄 License

Private / Proprietary.
