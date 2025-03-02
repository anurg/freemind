# .windsurfrules

## Project Overview

*   **Type:** windsurf_file
*   **Description:** FreeMind is a task tracking application aimed at empowering managers and team members to seamlessly manage official work assignments. The system supports task categorization, assignment to various team members across departments, detailed progress histories, and robust role-based security. It integrates secure authentication, in-app and email notifications, comprehensive analytics, and AI-driven insights for reports and summaries.
*   **Primary Goal:** To streamline task management by ensuring secure, role-based access and audit trails while providing data-driven insights and AI-enhanced reporting to boost operational efficiency.

## Project Structure

### Framework-Specific Routing

*   **Directory Rules:**

    *   Next.js 14: Enforce the App Router by using the `app/` directory with nested route folders (e.g., `app/[route]/page.tsx` for pages).
    *   Example 1: "Next.js 14 (App Router)" → `app/[route]/page.tsx` conventions
    *   Example 2: "Next.js (Pages Router)" → `pages/[route].tsx` pattern (not applicable here)
    *   Example 3: "React Router 6" → `src/routes/` with `createBrowserRouter`

### Core Directories

*   **Versioned Structure:**

    *   app/api: Next.js 14 API routes with Route Handlers for backend logic and server actions.
    *   Example 1: `app/api` → "Next.js 14 API routes handling authentication, task management, and AI integrations"
    *   Example 2: `src/views` → (For other frameworks like Vue 3, not applicable in this project)

### Key Files

*   **Stack-Versioned Patterns:**

    *   app/dashboard/layout.tsx: Next.js 14 root layout component for dashboard and main navigation.
    *   Example 1: `app/dashboard/layout.tsx` → "Defines the persistent layout for authenticated user dashboard with integrated sidebars and header elements"
    *   Example 2: `pages/_app.js` → (Used in Pages Router projects, not applicable here)

## Tech Stack Rules

*   **Version Enforcement:**

    *   next@14: App Router required; avoid using legacy patterns like `getInitialProps`. All routing and API logic should adhere strictly to Next.js 14 conventions.

## PRD Compliance

*   **Non-Negotiable:**

    *   "Only administrators can create and manage user accounts, with no public signup allowed" : This mandates that a default admin account (username: admin, password: admin) is provided to ensure controlled and secure onboarding.

## App Flow Integration

*   **Stack-Aligned Flow:**

    *   Next.js 14 Auth Flow → `app/auth/login/page.tsx` uses server actions for secure authentication, ensuring that users are routed to their personalized dashboards post-login based on their role (admin, manager, team member).
