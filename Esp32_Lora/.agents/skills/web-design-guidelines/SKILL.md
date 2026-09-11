---
name: web-design-guidelines
description: Standard UI/UX quality, responsive web design patterns, and aesthetic guidelines.
---

# Web Design Guidelines

This skill defines UI/UX quality standards, design system tokens, responsive web design patterns, and visual aesthetics for frontend interfaces.

## Design Aesthetics & Standards

### 1. Modern Color & Themes
- **Palette Harmony**: Prefer curated, harmonious CSS variables or Tailwind color configurations (e.g., Slate/Zinc neutral bases, vibrant HSL accents) over default basic colors.
- **Dark Mode Support**: Design dark themes from the ground up, utilizing proper contrast adjustments, softer text weights, and subtle border shadows.
- **Glassmorphism & Depth**: Utilize clean depth patterns like `backdrop-blur`, translucent background colors (e.g., `bg-white/10`), and fine borders to represent layers.

### 2. Typography & Hierarchy
- **Font Choices**: Apply clean, modern typography (e.g., Google Fonts like Inter, Outfit, or Roboto) with distinct scale factors for headings (`h1` to `h6`).
- **Readability**: Maintain appropriate line heights (`leading-relaxed` or `leading-loose` for copy, `leading-tight` for headings) and max-widths for reading lists (`max-w-2xl`).

### 3. Layouts & Responsiveness
- **Responsive Flex/Grid**: Always build responsive containers. Default to mobile layouts and expand to complex layouts using responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
- **Layout Consistency**: Keep spacing consistent using a 4px/8px grid system. Maintain uniform margins (`px-4 md:px-8`) and standard content gaps (`space-y-4` or `gap-6`).

### 4. Interactive UX & Micro-interactions
- **Hover & Active States**: Every interactive element must have smooth transitions (`transition-all duration-200`) and visually pleasing `:hover`, `:focus`, and `:active` states.
- **Loading & Skeleton States**: Use animated loader indicators or shimmering skeleton cards (`animate-pulse`) for components that retrieve async data.
