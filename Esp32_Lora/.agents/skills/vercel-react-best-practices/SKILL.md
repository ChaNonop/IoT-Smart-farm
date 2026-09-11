---
name: vercel-react-best-practices
description: Rules and guidelines for React, Next.js, Tailwind CSS, and fullstack backend development.
---

# Vercel React & Next.js Best Practices

This skill provides comprehensive, production-grade instructions for developing Next.js (App Router), React, Tailwind CSS, and Fullstack Backend applications.

## Core Guidelines

### 1. Next.js App Router & Server Components (RSC)
- **RSC by Default**: Keep components as React Server Components by default to reduce client-side bundle sizes. Only use `'use client'` when using hooks (`useState`, `useEffect`, `useContext`) or event listeners (`onClick`, etc.).
- **Async Components**: Fetch data directly inside Server Components using `async/await`. Avoid redundant Client Component wrapper fetchers.
- **Suspense Boundaries**: Wrap slow, data-fetching server components in `<Suspense fallback={<Skeleton />}>` to enable streaming UI.

### 2. Eliminating Data-Fetching Waterfalls (CRITICAL)
- **Parallel Requests**: Initiate independent fetch requests in parallel using `Promise.all()` or parallel component rendering.
- **Deduplication**: Leverage React's automatic fetch deduplication or use `React.cache()` for non-fetch database operations.
- **Server Actions**: Use Server Actions (`'use server'`) for data mutations, ensuring security and automatic cache revalidation using `revalidatePath` or `revalidateTag`.

### 3. Tailwind CSS & Styling
- **Utility Sorting**: Maintain clean utility class ordering (layout -> sizing -> typography -> colors -> interactive -> screens).
- **Arbitrary Values**: Limit arbitrary values (e.g., `w-[327px]`) in favor of standard design system spacing tokens (`w-80`).
- **Responsive Web Design**: Use mobile-first design, applying responsive prefixes like `md:`, `lg:` as modifications.

### 4. Backend & Fullstack Architecture
- **API Routes**: Write robust route handlers (`app/api/.../route.ts`) with appropriate error handling, Zod schema validation, and rate limiting.
- **Database Optimization**: Prevent N+1 queries using database joins or selective queries. Close connections correctly, and cache read-heavy requests.
- **Security**: Protect routes using middleware. Always sanitize user inputs and handle CORS, CSRF, and authentication tokens safely.
