# 🐟 Salmon Allocation

ระบบจัดสรรคำสั่งซื้อปลาแซลมอน (Salmon Order Allocation System) — เว็บแอปสำหรับจัดการและจัดสรรคำสั่งซื้อแซลมอนไปยังคลังสินค้าและซัพพลายเออร์โดยอัตโนมัติ

🔗 **Live Demo:** [https://puenyim.github.io/salmon-allocation/](https://puenyim.github.io/salmon-allocation/)

## Tech Stack

- **React 19** + **TypeScript** — UI framework
- **Vite** — Build tool & dev server
- **Tailwind CSS 4** — Styling
- **Zustand** — State management
- **react-i18next** — Internationalization (🇹🇭 TH / 🇬🇧 EN)
- **Vitest** — Unit testing & coverage
- **GitHub Actions** — CI/CD pipeline
- **GitHub Pages** — Deployment

## Getting Started

### Prerequisites

- Node.js >= 18
- npm

### Installation

```bash
git clone https://github.com/puenyim/salmon-allocation.git
cd salmon-allocation
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Project Structure

```
src/
├── components/       # React components
│   ├── LanguageSwitcher.tsx
│   ├── ManualAllocateModal.tsx
│   ├── OrderTable.tsx
│   ├── SummaryBar.tsx
│   └── Toolbar.tsx
├── store/            # Zustand stores
│   ├── allocationStore.ts
│   └── useLanguageStore.ts
├── data/             # Mock data
├── locales/          # i18n translations (en, th)
├── types/            # TypeScript types
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## Deployment

Deploy to GitHub Pages:

```bash
npm run deploy
```
