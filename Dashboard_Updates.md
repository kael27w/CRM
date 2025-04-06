Okay, here are those instructions structured for Cursor:

Subject: Dashboard UI Adjustments and Task Component Enhancements

Please implement the following fixes and features related to the dashboards and task components:

1. UI Adjustment: Remove Redundant Refresh Button

Location: All dashboards (Overview, Pipelines, Events, Tasks, etc.).

Element: The specific "Refresh" button located next to the main "Components" button (or similar button used for adding/managing components).

Problem: This button is considered unnecessary or redundant.

Action: Remove this specific refresh button element from the UI template/code used across all dashboard pages. Ensure the primary page refresh mechanism (if any) or component-specific refresh is still functional if needed elsewhere.

2. UI Enhancement: Tooltip for Truncated Titles

Problem: When the browser window or dashboard area is resized, component titles (and potentially other text elements) are shortened using ellipsis (...), preventing users from seeing the full text.

Requirement: Users should be able to see the full text when it's truncated.

Action: Implement a hover effect on elements that might display truncated text (primarily component titles, but consider other relevant labels). When a user hovers over truncated text, the full, original text should be displayed, typically using a standard HTML title attribute or a custom tooltip component.

3. 405 Bug Fix: Correct "View all tasks" Routing

Problem: Clicking the "View all tasks →" link/button (likely within the 'Upcoming Renewals/Tasks' component on the Overview dashboard) currently leads to a "404 Page Not Found" error.

Likely Cause: The target route (/activities/tasks or the equivalent path for the main Tasks page) is either incorrect in the link's definition or is missing from the application's router configuration.

Action:

Confirm the exact, correct URL path for the main Tasks page within the application.

Verify that this path is properly defined within the application's routing setup (e.g., in react-router, vue-router, etc.), mapping it to the correct Tasks page component.

Ensure the "View all tasks →" link/button is configured to navigate to this exact, defined path.

4. Feature Request: Task Completion within Dashboard Components

Goal: Allow users to mark tasks as complete directly from the task lists displayed within dashboard components.

Location: Applicable components on the Overview dashboard ('Upcoming Renewals/Tasks') and the Tasks dashboard.

UI/UX: Each task item listed in these components should have a checkbox.

Expected Behavior: When a user checks the checkbox next to a task:

An action should be triggered to update the status of that task to 'completed' in the backend data store.

Upon successful update, the task item should visually disappear from that specific component's list (as it likely no longer meets the component's filter criteria, e.g., "show incomplete tasks").

Action:

Add interactive checkboxes to the task items within the relevant dashboard components.

Implement an event handler (e.g., onChange or onClick) for these checkboxes.

This handler should call the appropriate API endpoint to update the corresponding task's status.

On successful API response, refresh the data for that specific component or directly remove the item from the component's view to reflect the change.

5. Feature Request: Quick Task Creation from Dashboard

Goal: Allow users to add new tasks without leaving the dashboard context.

Location: A plus (+) icon/button should be present within task-related components (e.g., the header or footer of the 'Upcoming Renewals/Tasks' component).

Expected Behavior: Clicking this plus (+) button should open a quick-add form or modal, allowing the user to input the necessary details for a new task (e.g., title, due date, assignee). Submitting this form should create the task in the backend.

Action:

Ensure the plus (+) button is correctly placed in the relevant task components.

Implement an onClick handler for this button.

This handler should trigger the display of a task creation modal or inline form.

Connect this form's submission to the API endpoint responsible for creating new tasks.

After successful creation, close the form/modal. Consider refreshing the component's data to potentially show the newly added task immediately.

## Implemented Updates - Task Component Enhancement

All task-related issues have been successfully addressed with the following implementations:

1. **Task Data Persistence**
   - Added localStorage implementation in the useTasks hook to maintain task state between page refreshes and navigation
   - This simulates database persistence until a real backend is implemented
   - Task completion state is now preserved across the entire application

2. **Fixed "View all tasks" Navigation**
   - Updated link from "/activities/tasks" to "/activities?tab=task"
   - Added URL query parameter support to automatically select the correct tab
   - All navigation paths throughout the application now correctly link to the Tasks tab

3. **Task Completion Functionality**
   - Implemented checkbox functionality across all task components
   - Tasks are visually marked as completed with a strikethrough effect
   - Completed tasks disappear on page reload to maintain a clean task list

4. **Task Creation From Dashboard**
   - Added "Add Task" button functionality on the dashboard
   - Implemented a modal dialog for creating new tasks
   - New tasks are immediately displayed in all relevant components
   - Created a centralized task management system through the useTasks hook

5. **Consistent Task UI Across Application**
   - Standardized the task display format in both Dashboard and Activities pages
   - Ensured checkboxes behave consistently across the application
   - Applied proper styling to task items (dates, descriptions, status indicators)

6. **Dashboard Integration**
   - Updated Dashboard to use real task data from the useTasks hook instead of dummy data
   - Removed duplicate UI elements (like redundant "Add Task" buttons)
   - Fixed inconsistent variable names and component props