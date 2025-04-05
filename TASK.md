# InsuranceTracker CRM Tasks

## Current Tasks (April 5, 2024)

1. [ ] **Dashboard Component Addition**
   - [ ] Implement functionality to add new components via the "Component" button
   - [ ] Enable adding different component types (KPI/Stat, Chart, Target Meter)
   - [ ] Allow placement within the dashboard grid

2. [ ] **Records Management**
   - [ ] **Contacts Page**
     - [ ] Implement "Create Field" button functionality for adding custom columns
     - [ ] Add bulk actions when rows are selected (Change Owner, Add Tags, Remove Tags, Update Field, Delete, Send Email)
   - [ ] **Companies Page**
     - [ ] Implement "Create Field" button functionality for adding custom columns
     - [ ] Add bulk actions when rows are selected (Change Owner, Add Tags, Remove Tags, Update Field, Delete)
   - [ ] **Products Page**
     - [ ] Implement "Create Field" button functionality for adding custom columns
     - [ ] Add bulk actions when rows are selected (Change Owner, Add Tags, Remove Tags, Update Field, Delete)

3. [x] **Task Management**
   - [x] Fix task completion functionality to properly cross out completed tasks
   - [x] Ensure completed tasks remain visible with strikethrough until page reload
   - [x] Ensure new tasks appear correctly when created from dashboard or activities page
   - [x] Fix navigation between dashboard and Activities page task list

4. [ ] **Calendar Integration**
   - [ ] Complete calendar event functionality
   - [ ] Add drag-and-drop for calendar events
   - [ ] Implement recurring events
   - [ ] Add notifications for upcoming events

5. [ ] **Pipeline View Enhancements**
   - [ ] Add card display for pipeline stages
   - [ ] Enable drag-and-drop between stages
   - [ ] Implement quick edit for deal cards
   - [ ] Add stage progress visualization

6. [ ] **UI/UX Improvements**
   - [ ] Make sidebar collapsible for more screen space
   - [ ] Enhance dark mode with better color contrast
   - [ ] Improve responsive design for mobile view
   - [ ] Add help tooltips for complex features

7. [ ] **Reporting**
   - [ ] Create basic reports for sales, policies, and renewals
   - [ ] Enable custom date ranges for reports
   - [ ] Add charts and graphs for data visualization
   - [ ] Implement report export (CSV, PDF)

## Completed Tasks

- [x] **Task Management and Navigation Improvements** (08/11/2024)
  - [x] Fixed task completion to properly mark tasks as completed without reloading the page
  - [x] Implemented proper task creation from dashboard that updates both the dashboard and tasks list
  - [x] Removed the separate /activities/tasks route and added a task tab within the Activities page
  - [x] Added proper navigation to tasks tab using URL query parameters
  - [x] Made dialog components consistent by standardizing on open/onOpenChange pattern
  - [x] Added tasks list view to Activities page for better task management
  - [x] Implemented immediate UI updates when completing tasks

- [x] **Dashboard UI and Task Management Improvements** (08/10/2024)
  - [x] Removed redundant refresh button from dashboard header
  - [x] Added tooltips for truncated titles in dashboard components
  - [x] Fixed "View all tasks" link routing by adding proper route in App.tsx
  - [x] Implemented task completion directly within dashboard components
  - [x] Added ability to hide completed tasks automatically from the tasks widget
  - [x] Created TaskDialog component for quick task creation from dashboard
  - [x] Connected dashboard task components with the tasks page

- [x] Fix scope issue with Dashboard components (08/09/2024)
  - Updated ComponentConfig to include dashboardType
  - Added metric selection to AddComponentDialog
  - Components are now filtered by dashboard type
  - Added predefined metrics for each dashboard type
  - Updated unit tests to work with new properties

- [x] Implement Dashboard Component Persistence (08/09/2024)
  - Added localStorage persistence for dashboard components
  - Components are now saved per dashboard type
  - Components can be deleted with a dropdown menu
  - Implemented component options menu with delete functionality

- [x] Fix 'Upcoming Renewals/Tasks' Component (08/09/2024)
  - Made the "View all tasks" link functional
  - Connected dashboard tasks with the Activities/Tasks page
  - Created a useTasks hook to share data and functionality between pages
  - Created a dedicated TasksPage component

## Discovered During Work
- Dialog components need to be standardized to use open/onOpenChange pattern for consistency
- Need to create a consistent task management system that works across all pages
- URL parameters should be used to set initial tab state in Activities page

## Discovered During Work (April 7, 2024)
- [ ] Handle errors gracefully in API requests with user-friendly error messages
- [ ] Implement proper loading states for all async operations
- [ ] Add confirmation dialogs for destructive actions (delete, complete, etc.)
