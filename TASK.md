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
   - [x] **Products Page**
     - [x] Implement "Create Field" button functionality for adding custom columns
     - [x] Add bulk actions when rows are selected (Change Owner, Add Tags, Remove Tags, Update Field, Delete)
     - [x] **Phase 1: Products API Integration** (12/30/2024)
       - [x] Created GET /api/products endpoint with comprehensive error handling
       - [x] Created POST /api/products endpoint with validation and duplicate checking
       - [x] Updated frontend to use real API data instead of dummy data
       - [x] Added loading and error states to Products page
       - [x] Implemented proper currency formatting and status badges
     - [x] **Phase 2: Full CRUD Operations** (12/30/2024)
       - [x] Created PATCH /api/products/:id endpoint for updating products
       - [x] Created DELETE /api/products/:id endpoint for deleting products
       - [x] Built ProductDialog component for adding/editing products with form validation
       - [x] Added Actions column with Edit/Delete dropdown menu
       - [x] Implemented React Query mutations for create/update/delete operations
       - [x] Added toast notifications for user feedback
       - [x] Integrated comprehensive error handling and loading states

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

9. [x] **Create/Update Client-Side Task Components (Today's Date)**
    - [x] Update `client/src/lib/api.ts` with `TaskEntry` interface, `fetchTasks`, and `updateTaskStatus` functions.
    - [x] Create `client/src/components/activities/TaskDisplay.tsx` to display tasks and handle updates.
    - [x] Integrate `TaskDisplay` into `client/src/pages/ActivitiesPage.tsx`.
    - [x] Update `server/routes.ts` `POST /api/activities` to correctly handle task creation with defaults.
    - [x] Add `createTask` function to `client/src/lib/api.ts`.
    - [x] Provide an example of `useMutation` for task creation in the client.
    - [ ] **Implement "Add Task" Form and `useMutation` Logic (Today's Date)**
        - [ ] Create/Modify component for "Add Task" form using shadcn/ui.
        - [ ] Implement `useMutation` for task creation, including `onSuccess` (invalidate queries, clear form) and `onError` (logging).
        - [ ] Ensure form submission handler collects data, calls mutation, and provides debug logs.
        - [ ] Integrate the form into the UI, potentially using a Dialog.

10. [x] **Implement "Add Contact" Functionality (Today's Date)**
    - [x] Created AddContactDialog.tsx component with React Hook Form integration
    - [x] Updated contacts.tsx page to include "Add Contact" button
    - [x] Modified POST /api/contacts endpoint in server/routes.ts to handle status field
    - [x] Updated GET /api/contacts/list endpoint to include status in response
    - [x] Added status column to contacts table with appropriate styling

11. [x] **Implement "Full Contact Detail View & Edit" Functionality (05/25/2025)**
    - [x] Created GET /api/contacts/:id endpoint in server/routes.ts
    - [x] Enhanced existing PATCH /api/contacts/:id endpoint
    - [x] Added fetchContactById and updateContact functions to client/src/lib/api.ts
    - [x] Updated contact links in contacts.tsx to navigate to detail page
    - [x] Enhanced ContactDetailPage.tsx to display contact information
    - [x] Created EditContactDialog.tsx component with form validation
    - [x] Added route for /contacts/:id in App.tsx

12. [x] **Enhance Contact Detail Page with Note Management (05/26/2025)**
    - [x] Fixed immediate UI update after contact editing using queryClient.setQueryData
    - [x] Removed status field from contact viewing and editing
    - [x] Created DELETE /api/activities/:id endpoint in server/routes.ts
    - [x] Enhanced PATCH /api/activities/:id endpoint for note updates
    - [x] Added updateActivity and deleteActivity functions to client/src/lib/api.ts
    - [x] Created NoteItem.tsx component with inline editing capability
    - [x] Implemented note deletion with confirmation dialog
    - [x] Integrated note editing and deletion into ContactDetailPage activity feed

13. [x] **Implement In-Call Note-Taking Feature (05/27/2025)**
    - [x] Enhanced Softphone.tsx to add note-taking UI during active calls
    - [x] Added state management for note content
    - [x] Integrated with existing createNoteActivity API function
    - [x] Implemented immediate UI feedback with toast notifications
    - [x] Added proper error handling for cases when contact ID is not available
    - [x] Included Call SID in note content for call reference
    - [x] Improved contact lookup for outbound calls to support note-taking
    - [x] Ensured proper cleanup of note state when calls end

14. [x] **Fix Database Errors for Task and Event Creation (01/27/2025)**
    - [x] Fixed Task Creation Error: Resolved "null value in column start_datetime violates not-null constraint"
      - [x] Updated POST /api/activities handler to exclude start_datetime and end_datetime for tasks
      - [x] Modified createTask function in client/src/lib/api.ts to send only task-relevant fields
      - [x] Ensured useTasks hook uses correct API endpoint (/api/activities instead of /api/tasks)
    - [x] Fixed Event Creation Error: Resolved "violates check constraint activities_type_check"
      - [x] Verified POST /api/activities handler correctly sets type to 'event' (lowercase)
      - [x] Updated backend to exclude task-specific fields (due_date, completed, priority) for events
      - [x] Ensured AddEventDialog sends correct payload structure with type: 'event'
    - [x] Enhanced backend validation and field filtering for different activity types
    - [x] Added comprehensive logging for debugging database constraint issues
    - [x] Created test script to verify both task and event creation work correctly

15. [x] **Enhance Calendar View and Activity Handling (01/27/2025)**
    - [x] Fixed Task Date and Time Display Issues:
      - [x] Resolved timezone off-by-one error for task due dates using date-only comparison
      - [x] Updated task time display to show "All day" instead of specific times
      - [x] Fixed date parsing to avoid timezone shifts that pushed tasks to previous day
    - [x] Improved Activity List Sorting in Calendar Sidebar:
      - [x] Changed sorting from latest-to-earliest to earliest-to-latest within each day
      - [x] Tasks (all-day items) now appear first, followed by timed events/calls
      - [x] Events and calls sorted by actual time within the day
    - [x] Implemented Multi-Day Event Support:
      - [x] Events with end_datetime now appear on all days from start to end date
      - [x] Updated calendar day rendering to properly count multi-day events
      - [x] Enhanced activity sidebar to show full date range for multi-day events
      - [x] Added proper date range filtering for multi-day events
    - [x] Simplified Event Creation:
      - [x] Removed status field from AddEventDialog form
      - [x] Backend now defaults new events to 'pending' status automatically
      - [x] Streamlined event creation process for better user experience
    - [x] Enhanced Activity Detail Display and Task Completion:
      - [x] Improved activity detail display in calendar sidebar with type-specific information
      - [x] Made task completion checkboxes functional with API integration
      - [x] Added priority display for tasks in sidebar
      - [x] Enhanced event details to show date ranges and times appropriately
      - [x] Added proper error handling and success feedback for task status changes
      - [x] Only show checkboxes for tasks (not events or calls)

16. [x] **Calendar and Activity Refinements (01/27/2025)**
    - [x] Fixed Event Spanning Multiple Days on Calendar:
      - [x] Events with both start_datetime and end_datetime now visually span all days from start to end
      - [x] Created helper function `isActivityOnDay()` for consistent multi-day event logic
      - [x] Updated calendar grid rendering to properly show multi-day events on all relevant days
      - [x] Enhanced calendar day activity indicators to work correctly with multi-day events
    - [x] Fixed Sidebar Activity List Click Behavior:
      - [x] Separated checkbox clicks from item clicks to prevent unintended detail view opening
      - [x] Checkbox clicks now only toggle task completion status without opening details
      - [x] Removed checkboxes from events (only tasks have completion checkboxes)
      - [x] Added click prevention on checkbox to stop event propagation
      - [x] Made clicking item title/body open activity details in sidebar
    - [x] Enhanced Activity Detail Display in Sidebar:
      - [x] Created comprehensive ActivityDetailView component
      - [x] Added detailed information display for tasks (due date, priority, related contacts/companies)
      - [x] Added detailed information display for events (date/time ranges, location, multi-day indicators)
      - [x] Added detailed information display for calls (date/time, contact information)
      - [x] Included back button and edit functionality in detail view
      - [x] Added proper status badges and priority indicators
    - [x] Restored Calendar Day Activity Indicators:
      - [x] Fixed activity type icons/badges on calendar days to work with new filtering logic
      - [x] Activity indicators now properly show task, event, and call icons on relevant days
      - [x] Icons correctly reflect filtered activities and multi-day events
      - [x] Maintained visual consistency with existing design patterns

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

1. [x] **Frontend Authentication Implementation (01/28/2025)**
   - [x] Create Supabase client instance for frontend
   - [x] Implement AuthContext for user session management  
   - [x] Create SignUp page with email/password form
   - [x] Create Login page with email/password form
   - [x] Implement protected routes and route guards
   - [x] Add logout functionality to main layout

2. [x] **Backend Profile Management Implementation (06/02/2025)**
   - [x] Install jsonwebtoken library and TypeScript types
   - [x] Create authentication middleware with JWT verification
   - [x] Implement GET /api/profile endpoint with authentication
   - [x] Implement PATCH /api/profile endpoint with validation
   - [x] Add proper error handling and logging
   - [ ] Set up SUPABASE_JWT_SECRET environment variable
   - [ ] Test profile endpoints with authenticated requests

3. [x] **Frontend Profile Settings Implementation (01/28/2025)**
   - [x] Created SettingsPage.tsx with Profile tab UI
   - [x] Added profile-related API functions (fetchProfile, updateProfile) to client/src/lib/api.ts
   - [x] Enhanced AuthContext with setProfileData function for updating profile state
   - [x] Updated Profile interface to include job_title and bio fields
   - [x] Implemented form state management with React useState
   - [x] Added React Query integration for data fetching and mutations
   - [x] Integrated toast notifications for success/error feedback
   - [x] Added loading and error states with proper UI feedback
   - [x] Ensured profile updates immediately reflect in AuthContext
   - [x] Updated routing in App.tsx to use new SettingsPage component
   - [x] Included placeholder tabs for future settings sections
