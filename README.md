# LinkedIn Automation — Frontend

## 1. Project Overview & Objectives

In modern professional life, maintaining a consistent posting schedule on LinkedIn is essential for career development and technical networking. However, students and working professionals frequently struggle with consistency due to academic pressure, work commitments, and project deadlines.

**LinkedIn Automation (Frontend)** is a high-performance, accessible, and reactive single-page dashboard built with **Angular 22** and **Tailwind CSS 4**. It provides a frictionless user interface to compose, schedule, manage, and monitor LinkedIn posts in real time, synchronizing seamlessly with the NestJS backend and LinkedIn REST API.

### Key Objectives
* **Frictionless Post Composition:** Intuitive commentary editor supporting up to 3,000 characters with live progress indicators, hashtag helper chips, and target destination preview.
* **Flexible Scheduling Engine:** One-click relative scheduling presets (`Right Now (< 60s)`, `In 15 Mins`, `Tonight (8 PM)`, `Tomorrow (10 AM)`) and an accessible custom popover datetime picker.
* **Queue Lifecycle Management:** Tabbed post filtering (`All`, `Pending`, `Published`, `Failed`), immediate cancellation of pending dispatches, one-click retries for failed posts, and clipboard copying.
* **Real-time Live Synchronization:** Native Server-Sent Events (SSE) listener that reflects publishing transitions (`POST_PROCESSING`, `POST_PUBLISHED`, `POST_FAILED`) and delivers rich toast notifications without manual page refreshes.
* **Resilient Offline & Error States:** Graceful handling of network disconnects, automated error deduplication, and fallback mechanisms that ensure action buttons remain accessible even when the server is offline.

---

## 2. System Architecture & UI Modules

The frontend is architected into modular, standalone features and core services following modern Angular 22 design principles:

### Module Breakdown
1. **Core API & Interceptors (`CoreModule`):**
   * `ApiService`: Centralized HTTP client managing REST calls with `withCredentials: true` to support secure `HttpOnly` cookie-based authentication.
   * `authInterceptor`: Automatically appends credentials and headers to all outgoing requests.
   * `errorInterceptor`: Intercepts HTTP errors, deduplicates concurrent network failure messages within a 2-second window, and displays user-friendly toast alerts.
2. **Authentication & Session Feature (`AuthFeature`):**
   * `OAuthCallbackComponent`: Dedicated route (`/auth/callback`) that processes LinkedIn OAuth redirect parameters, exchanges authorization codes, and redirects to the dashboard.
   * Session state verification via `/auth/linkedin/me`, automatically detecting active LinkedIn profiles without storing fragile tokens in `localStorage`.
3. **Scheduler & Composer Feature (`SchedulerFeature`):**
   * `DashboardComponent`: Parent container orchestrating metrics stat cards, post composer, and queue history.
   * `PostFormComponent`: Signal-based form with strict schema validation (`required`, `maxLength: 3000`), hashtag insertion chips, and live character progress indicators.
   * `SchedulePickerComponent`: Interactive scheduling control offering quick-select preset times and custom datetime popover selection.
4. **Queue Management & Card Components (`PostList` & `PostCard`):**
   * `PostListComponent`: Tabbed filter controls (`ALL`, `PENDING`, `PUBLISHED`, `FAILED`) and `@defer (on viewport)` lazy-rendered list items with smooth skeleton loaders.
   * `PostCardComponent`: Detailed card displaying target execution timestamp, publishing status badge, detailed error alerts with failure reasons, and action buttons (`Cancel`, `Retry`, `Copy`).
5. **Real-time Live Sync & Notifications (`SchedulerService`):**
   * Establishes a persistent SSE connection to `/posts/events/:userId` for real-time publishing status updates.
   * Integrated with `@radix-ng/primitives/toast` for accessible toast alerts on success, retry, and publication events.

---

## 3. State Management & Reactivity (Angular 22 Signals)

The application utilizes native **Angular 22 Signals** for fine-grained reactivity and zoneless change detection:

* **Signal-Based Data Fetching (`httpResource`):** Uses Angular's native `httpResource` for declarative, reactive data loading of accounts, posts, and backend health status.
* **Computed Derived State (`computed`):** Derived calculations such as filter counts, active account identification, and filtered post subsets are strictly memoized.
* **Signal Forms (`@angular/forms/signals`):** Provides type-safe form field access, real-time character counting, and schema validation.
* **Zoneless Architecture:** Runs with Angular 22's default zoneless change detection, eliminating `zone.js` runtime overhead for sub-millisecond UI updates.
* **Zero-Overhead Vector Icons:** Custom standalone SVG icon component packaging exact Lucide paths, eliminating heavy third-party runtime bundles and speeding up initial paint.

---

## 4. UI/UX Design System & Accessibility

* **Tailwind CSS 4:** Modern CSS engine utilizing custom design tokens for LinkedIn brand aesthetics, neutral slate palettes, and responsive mobile/desktop layouts.
* **Radix NG Headless Primitives:** Implements accessible headless UI components from `@radix-ng/primitives`:
  * `RdxMenuRoot` & `RdxMenuItem` for account profile management and dropdown actions.
  * `RdxAlertDialogRoot` for accessible confirmation modals when disconnecting accounts or canceling posts.
  * `RdxPopoverRoot` for the custom datetime calendar picker.
  * `RdxToastManager` for ARIA-compliant, high-priority status notifications.
* **WCAG AA Compliance:** High color contrast ratios, keyboard navigation support, semantic ARIA roles, and accessible skeleton placeholders.
* **Optimized Skeleton Loaders:** Skeleton placeholders dynamically adapt to network conditions, never blocking action buttons if a backend request fails.

---

## 5. Setup & Installation

### Prerequisites
* **Node.js:** v20.x or higher
* **Backend API:** Ensure the NestJS backend (`linkedin-automation`) is running on `http://localhost:3000`.

### 1. Clone the Repository
```bash
git clone https://github.com/rahul-shaw18/linkedin-automation-fe.git
cd linkedin-automation-fe
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Environment configurations are located in `src/environments/`:
* **Development (`src/environments/environment.development.ts`):**
  ```typescript
  export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000',
  };
  ```
* **Production (`src/environments/environment.ts`):**
  ```typescript
  export const environment = {
    production: true,
    apiUrl: 'https://your-api-domain.com',
  };
  ```

### 4. Run the Application
```bash
# Development Server (Vite + HMR)
npm start
# or: npx ng serve

# Unit Tests (Vitest)
npm test
# or: npx ng test --watch=false

# Production Build
npm run build
```

* **Frontend Dashboard:** [http://localhost:4200](http://localhost:4200)
* **Backend Health Check:** [http://localhost:3000/health](http://localhost:3000/health)

---

## 6. License & Acknowledgments

This project is developed for academic evaluation as part of the MCA degree program at **Uttaranchal University, Dehradun**.

Licensed under the [MIT License](LICENSE).
