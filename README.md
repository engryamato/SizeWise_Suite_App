# SizeWise Suite App

A modular, offline-first HVAC engineering and estimating platform with Air Duct Sizer, standards compliance (SMACNA/NFPA/ASHRAE), and Progressive Web App capabilities.

## Features

- **Glassmorphism UI Demo**: Beautiful glass-effect components with backdrop blur and animations
- **Next.js 15**: Latest Next.js with App Router
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first CSS framework with custom animations
- **Responsive Design**: Works on all device sizes

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/engryamato/SizeWise_Suite_App.git
cd SizeWise_Suite_App
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Glassmorphism Components

The app includes several reusable glassmorphism components:

### GlassEffect
Base wrapper component that provides the glass effect styling with backdrop blur, layered glass effects, and smooth transitions.

### GlassDock
A dock component that displays icons with glass effect and hover animations. Perfect for navigation or app launchers.

### GlassButton
A button component with glass effect and interactive animations. Supports both regular buttons and link buttons.

### GlassCard
A card component with glass effect, perfect for displaying content with beautiful backdrop blur.

### GlassFilter
SVG filter component that provides the glass distortion effect using advanced SVG filters.

## Demo Pages

- **Home Page** (`/`): Main glassmorphism demo with animated background
- **Demo Page** (`/demo`): Comprehensive showcase of all glassmorphism components

## Usage Examples

### Basic Glass Effect
```tsx
import { GlassEffect } from '@/components/glassmorphism';

<GlassEffect className="rounded-3xl p-6">
  <div className="text-white">Your content here</div>
</GlassEffect>
```

### Glass Button
```tsx
import { GlassButton } from '@/components/glassmorphism';

<GlassButton href="/demo">
  <span className="text-white">Click me</span>
</GlassButton>
```

### Glass Dock
```tsx
import { GlassDock, type DockIcon } from '@/components/glassmorphism';

const icons: DockIcon[] = [
  { src: "/icon1.png", alt: "App 1" },
  { src: "/icon2.png", alt: "App 2" },
];

<GlassDock icons={icons} />
```

## Project Structure

```
├── app/
│   ├── demo/
│   │   └── page.tsx         # Components demo page
│   ├── globals.css          # Global styles with keyframes
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page with demo
├── components/
│   └── glassmorphism/       # Glassmorphism components
│       ├── GlassEffect.tsx  # Base glass effect wrapper
│       ├── GlassDock.tsx    # Icon dock component
│       ├── GlassButton.tsx  # Glass button component
│       ├── GlassCard.tsx    # Glass card component
│       ├── GlassFilter.tsx  # SVG filter effects
│       └── index.ts         # Component exports
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind configuration with custom animations
└── package.json
```

## Technologies Used

- **Next.js 15**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **tailwindcss-animate**: Additional animation utilities

## License

MIT License - see [LICENSE](LICENSE) file for details.
