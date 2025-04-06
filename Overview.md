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
    *   Dynamic "+ Add Deal" button that creates new deals with detailed properties
    *   Card-based interface showing deal name, company, amount, and key dates
    *   Cross-category drag-and-drop functionality allowing deals to be moved between any stages
    *   Deal management capabilities including editing deal properties and deletion
    *   Visual feedback during drag operations with highlighted drop targets
    


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
    *   **dnd-kit:** Modern drag-and-drop toolkit for interactive UI elements.

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
   - Pipelines page with multiple pipeline types, specialized stages, and Kanban board view
   - Initial implementations of tables for Contacts, Companies, Products
   - Task management with localStorage persistence
   - Activities page with calendar integration

2. **Recently Completed:**
   - **Pipelines Page:**
     - Updated stage names to match specific insurance business processes
     - Enhanced drag-and-drop functionality to move deals between any stages
     - Implemented proper empty column support for drag operations
     - Added edit and delete functionality for deals
     - Streamlined UI by removing redundant buttons and options
     - Improved visual feedback for drag-and-drop operations

   - **Tasks Component:**
     - Fixed task completion functionality
     - Implemented task persistence across page refreshes
     - Ensured proper display of completed vs. open tasks

   - **General Fixes:**
     - Dashboard TypeScript typing issues for `changeType` properties
     - Mock data implementation for dashboard views with error fallbacks
     - Fixed various UI inconsistencies and layout issues

3. **Need to do:**
   - Dashboard component button addition functionality (being able to add components based on selection)
   - Records Management:
     - Implement "Create Field" button functionality to add custom fields to tables
     - Add row selection actions (change owner, tags, delete) for Companies and Products pages
     - Implement email sending functionality for Contacts page
   - Activities page improvements:
     - Ensure consistent data display across Calendar, Tasks, Events, and Calls tabs
     - Fix mock data integration issues

## Next Development Focus

Based on the progress so far and what needs to be done, the immediate tasks involve:

1. **Dashboard:** Complete component addition functionality to allow users to customize their dashboard views.

2. **Records Management:** Implement custom field creation, bulk actions, and row selection features for all record tables.

3. **Activities Page:** Fix data consistency issues and ensure proper integration between calendar and list views.

4. **Backend Integration Preparation:** Prepare components to transition from mock data to real API endpoints when backend is ready.

A detailed breakdown of the recent Pipelines page improvements can be found in `Pipelines_Update.md`.

