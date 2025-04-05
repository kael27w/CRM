
## Overview

Welcome to the InsuranceTracker CRM frontend project! This application is being developed as a modern, web-based CRM specifically tailored for the life insurance industry. The goal is to create an intuitive and feature-rich interface for managing insurance policies, clients, sales pipelines, claims processing, and agent activities.

The InsuranceTracker CRM serves as a comprehensive solution for insurance agencies to streamline their workflow by centralizing client information, policy management, claims processing, and sales pipelines. It provides real-time analytics on revenue, policy performance, agent productivity, and sales metrics, enabling data-driven decision making for insurance professionals.

The project is currently **in active development**, undergoing significant UI/UX refinement to match specific design requirements and improve usability. The basic structure and many components exist, but require fixes, enhancements, and consistent implementation across modules.

**Reference materials** (original instructions, screenshots detailing target UI/UX) can be found in the `/attached_assets` directory. The latest screenshots provided show the *current state* of the application you are inheriting.

## Key Features (Implemented or In Progress)

*   **Dashboard:** 
    * Fully customizable overview of key insurance metrics
    * Multiple specialized dashboard views:
      * **Overview:** Revenue, Active Policies, Pending Claims, Active Clients stats
      * **Pipelines:** Deal values, win rates, and pipeline conversion metrics
      * **Tasks:** Task completion and distribution metrics
      * **Events:** Client meetings and appointment analytics
      * **Calls:** Call tracking and performance
      * **Emails:** Email campaign performance and engagement rates
    * Interactive component addition functionality via "Component" button
    * Individual components include StatCards, Charts, Target Meters, and Task Widgets
    * Mock data implementation with graceful error fallbacks when API endpoints fail

*   **Records Management (Contacts, Companies, Products):**
    *   Table-based views for displaying client and policy records
    *   Advanced search and filtering capabilities with saved views
    *   Ability to add Custom Fields directly to tables for specialized data via "Create Field" button on the table 
    *   Bulk actions on row selection (e.g., Add Tags, Delete, Export, Send Mail only for Contacts page)
    

*   **Pipelines:**
    *   Kanban-style board view for managing insurance deals/opportunities
    *   Support for **multiple distinct pipelines** tailored to different insurance products:
        * Sales Pipeline (general)
        * Customer Support (service tickets)
        * Living Trust Flow (estate planning)
        * Index Universal Life (specialized insurance product)
    *   Configurable stages within each pipeline matching real insurance sales processes
    *   Dynamic "+ Create" button that adapts to the selected pipeline (e.g., "+ New Deal", "+ New Inquiry")
    *   Card-based interface showing deal name, name of person,price, and key dates(for example Yearly Subscription at the top, Ted Watson in the middle, and then 5000 side to side with Today(date) below the name) and have the ability to drag and drop to any other stage
    *   Filtering on what cards we want to see 
    


*   **Activities:**
    *   Centralized management of client interactions:
        * Tasks (follow-ups, document requests)
        * Events (client meetings, internal meetings)
        * Calls (sales and service calls)
    *   Primary **Calendar view** displaying all scheduled activities
    *   Interactive right-side panel showing details for a selected date and filtering options
    *   Integrated with contact and policy records for context-aware activity management

*   **Settings:** 
    * User profile management
    * Company profile configuration
    * Team member access controls
    * Customization options for pipelines, fields, and workflow automation
    * Notification preferences

*   **General Layout:** 
    * Consistent Sidebar navigation providing access to all main modules
    * Header bar with global search, notifications, quick-create actions, and profile access
    * Responsive design supporting desktop and tablet views

## Tech Stack

*   **Frontend:**
    *   **React:** JavaScript library for building user interfaces.
    *   **TypeScript:** Strongly-typed JavaScript for enhanced code safety and developer experience.
    *   **Vite:** Fast frontend build tool and development server.
    *   **Tailwind CSS:** Utility-first CSS framework for consistent, responsive styling.
    *   **shadcn/ui:** Reusable UI components built using Radix UI and Tailwind CSS (found in `client/src/components/ui`). **This is the core UI library.**
    *   **React Query / TanStack Query:** Data fetching, caching, and state management.
    *   **React Router / Wouter:** For client-side routing between pages.

*   **Backend (Assumed):**
    *   **Node.js / Express:** JavaScript runtime and framework for the API server.
    *   **RESTful API:** Standard API endpoints for CRUD operations on all resources.
    *   **(Data):** Currently using mock data with plans to implement proper database storage.

## Project Structure

```
use tree command to see it 
```

**Key Frontend Locations:**

*   **Pages/Views:** Modify existing pages or create new ones in `client/src/pages/`.
*   **Reusable Components:** Find or create components in `client/src/components/`. Leverage the base components from `client/src/components/ui/` heavily.
*   **Layout:** Changes to header/sidebar are in `client/src/components/layouts/`.
*   **Routing:** Configured in `client/src/App.tsx` using Wouter or React Router.
*   **Styling:** Primarily done via Tailwind CSS utility classes directly in the components. Global styles in `client/src/index.css`.

## Getting Started

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install / pnpm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    # or yarn dev / pnpm dev
    or npx vite --config vite.config.ts
    ```
    This will typically start the Vite development server, and you can access the application at `http://localhost:5173` (or similar port).

4.  **(Optional) Run the Backend Server:** If required for API calls (even mock ones), you might need to run the server separately:
    ```bash
    # From the root directory
    cd server
    npm install
    npm run dev # Or node index.ts / equivalent start script
    cd .. # Return to root
    ```

## Current Development Status

The application currently has a functioning structure with:

1. **Completed Areas:**
   - Basic layout with sidebar navigation and header
   - Dashboard with multiple views and mock data fallbacks
   - Pipelines page with multiple pipeline types and Kanban board view
   - Initial implementations of tables for Contacts, Companies, Products

2. **Recently Fixed:**
   - Dashboard TypeScript typing issues for `changeType` properties
   - Mock data implementation for dashboard views with error fallbacks
   - Pipeline navigation and initial card creation

3. **Need to do:**
   - Dashboard component button addition functionality(being able to add components based on selection)
   - Contacts, Companies, Products pages all need the ability to have the "Create Filed" button working so that it can create a new field depending on what the user types in and be able to still do operations on that column like filtering
   -Companies, Products when selecting any or all the rows in the table the user should have the ability to change owner, add tags, remove tags, update field, delete using a dropdown button that appears only if selecting a row
   -The same for Contacts page except it should have the additional option to send email 
   - Activities page figure out why not all mock tasks,events, or calls are showing up on calendar. Information should be consistent throughout Calendar, Tasks, Events, Calls tabs
   

## Next Development Focus

Based on the progress so far and what needs to be done, the immediate tasks involve:

1.  **Dashboard:** 
2.  **Contacts/Companies/Products Tables:** 
3.  **Activities Page:** 

