# InsuranceTracker CRM Tasks

## Current Tasks (April 5, 2024)

1. [ ] **Dashboard Component Addition**
   - [ ] Implement functionality for adding new dashboard components based on selection
   - [ ] Ensure components persist across sessions
   - [ ] Add ability to remove or rearrange dashboard components

2. [ ] **Records Management**
   - [ ] **Contacts Page**
     - [ ] Enhance Contacts page with "Create Field" button functionality
     - [ ] Implement bulk actions for Contacts (change owner, add/remove tags, delete)
     - [ ] Add email sending capabilities to Contacts page
   - [ ] **Companies Page**
     - [ ] Implement "Create Field" button functionality for adding custom columns
     - [ ] Add bulk actions when rows are selected (Change Owner, Add Tags, Remove Tags, Update Field, Delete)
   - [ ] **Products Page**
     - [ ] Implement "Create Field" button functionality for adding custom columns
     - [ ] Add bulk actions when rows are selected (Change Owner, Add Tags, Remove Tags, Update Field, Delete)

3. [x] **Task Management**
   - [x] Fix task completion functionality (display crossed-out tasks before hiding)
   - [x] Fix navigation between pages when viewing tasks
   - [x] Ensure new tasks appear correctly in both task widget and activities page
   - [x] Fix navigation between dashboard and Activities page task list
   - [x] Fix dashboard Tasks Widget to use real tasks data from useTasks hook
   - [x] Remove redundant "Add Task" button when no tasks are displayed
   - [x] Make all task completion checkboxes functional across the application
   - [x] Implement localStorage persistence for tasks to maintain state between refreshes

4. [ ] **Calendar Integration**
   - [ ] Fix display consistency across Calendar, Tasks, Events, and Calls tabs
   - [ ] Ensure all mock data appears correctly on calendar

5. [x] **Pipeline View Enhancements**
   - [x] Redesign pipeline tabs to vertical sidebar layout
   - [x] Update pipeline categories with new names (Sales Pipeline, Customer Support, Living Trust Flow, Index Universal Life)
   - [x] Implement drag-and-drop functionality for deals between stages
   - [x] Add deal editing and deletion capabilities

6. [ ] **UI/UX Improvements**
   - [ ] Fix inconsistent spacing and alignment across pages
   - [ ] Improve form validation and error handling
   - [ ] Enhance accessibility of interactive elements

7. [ ] **API Endpoints Implementation**
   - [x] Implement GET /api/contacts endpoint for contact lookup by phone number
   - [x] Implement POST /api/contacts endpoint for creating new contacts
   - [x] Implement POST /api/calls endpoint for call journaling
   - [x] Create documentation for testing the new API endpoints

8. [ ] **Reporting**
   - [ ] Create basic reports for pipeline performance
   - [ ] Implement data visualization for sales metrics
   - [ ] Add export capabilities for report data

## Completed Tasks

- [x] **Pipeline View Redesign** (08/12/2024)
  - [x] Changed pipeline layout to vertical tabs for better category navigation
  - [x] Updated stage names to match specific insurance business processes
  - [x] Implemented cross-category drag and drop functionality
  - [x] Added deal editing and deletion features

- [x] **Task Management and Navigation Improvements** (08/11/2024)
  - [x] Fixed task completion functionality
  - [x] Restored original tab appearance in Activities page
  - [x] Made all task completion checkboxes functional

- [x] **Dashboard UI Improvements** (08/10/2024)
  - [x] Fixed TypeScript typing issues for `changeType` properties
  - [x] Implemented mock data fallbacks for dashboard components
  - [x] Corrected layout issues in dashboard views

- [x] **API Endpoints Implementation** (08/09/2024)
  - [x] Added contact lookup endpoint with phone number matching
  - [x] Created contact creation functionality for new caller information
  - [x] Implemented call logging with detailed information storage
  - [x] Documented all endpoints in API_ENDPOINTS.md

## Discovered During Work
- Dialog components need to be standardized to use open/onOpenChange pattern for consistency
- Need to create a consistent task management system that works across all pages
- URL parameters should be used to set initial tab state in Activities page
- Consider implementing a full state management solution (Redux, Zustand) as the application grows

## Discovered During Work (April 7, 2024)
- [ ] Handle errors gracefully in API requests with user-friendly error messages
- [ ] Implement proper loading states for all async operations
- [ ] Add confirmation dialogs for destructive actions (delete, complete, etc.)

## Debugging (Today's Date - Replace with Actual Date)
- [ ] **Investigate API Connectivity Issue (Render)**
  - [ ] Client (localhost:5173) to Render (crm-2lmw.onrender.com) requests for GET /api/stats/overview and GET /api/tasks result in 500 errors but no server-side logs on Render.
  - [ ] Verify client-side fetch logic and URL construction (VITE_API_BASE_URL).
  - [ ] Investigate Vite proxy interference.
  - [ ] Simulate client requests with curl.
  - [ ] Review backend for any pre-routing middleware.
