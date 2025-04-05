import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { LayoutGrid, LineChart, Gauge } from 'lucide-react';

// Type definitions
export type ComponentType = 'stat' | 'chart' | 'targetMeter';
export type DashboardType = 'overview' | 'pipelines' | 'tasks' | 'events' | 'calls' | 'emails';

// Dashboard-specific metrics
const DASHBOARD_METRICS: Record<DashboardType, Array<{value: string, label: string}>> = {
  overview: [
    { value: 'contacts_created_this_month', label: 'Contacts Created - This Month' },
    { value: 'pipelines_won_this_month', label: 'Pipelines Won - This Month' },
    { value: 'pipelines_lost_this_month', label: 'Pipelines Lost - This Month' },
    { value: 'tasks_closed_this_month', label: 'Tasks Closed - This Month' },
    { value: 'events_completed_this_month', label: 'Events Completed - This Month' },
    { value: 'calls_completed_this_month', label: 'Calls Completed - This Month' },
    { value: 'top_companies_by_activity', label: 'Top 5 Companies' },
    { value: 'open_pipelines_by_stage_this_month', label: 'Open Pipelines by Stage - This Month' },
    { value: 'revenue_won_by_month', label: 'Revenue Won by Month' },
    { value: 'calls_completed_count_this_month', label: 'Number of Calls' }
  ],
  pipelines: [
    { value: 'pipelines_open_this_month', label: 'Open Pipelines - This Month' },
    { value: 'pipelines_won_this_month', label: 'Pipelines Won - This Month' },
    { value: 'pipelines_lost_this_month', label: 'Pipelines Lost - This Month' },
    { value: 'revenue_won_this_month', label: 'Revenue Won - This Month' },
    { value: 'top_users_by_pipeline_won', label: 'Top 5 Users - Pipelines' },
    { value: 'open_pipelines_amount_by_stage', label: 'Open Pipelines Amount by Stage' },
    { value: 'monthly_revenue_by_user', label: 'Monthly Revenue by Users' }
  ],
  events: [
    { value: 'events_created_this_month', label: 'Events Created - This Month' },
    { value: 'events_completed_this_month', label: 'Events Completed - This Month' },
    { value: 'events_upcoming_this_month', label: 'Upcoming Events - This Month' },
    { value: 'top_users_by_events_completed', label: 'Top 5 Users by Completed Events' },
    { value: 'events_completed_by_month', label: 'Completed Events by Month' }
  ],
  tasks: [
    { value: 'tasks_created_this_month', label: 'Tasks Created - This Month' },
    { value: 'tasks_open_this_month', label: 'Open Tasks - This Month' },
    { value: 'tasks_completed_this_month', label: 'Completed Tasks - This Month' },
    { value: 'tasks_overdue_this_month', label: 'Overdue Tasks - This Month' },
    { value: 'top_users_by_tasks_overdue', label: 'Top 5 Users by Overdue Tasks' },
    { value: 'tasks_by_pipeline_close_date', label: 'Tasks by Pipeline Closing Date' },
    { value: 'top_users_by_company_task_activity', label: 'Top 5 Users by Company' },
    { value: 'tasks_by_priority', label: 'Tasks by Priority' }
  ],
  calls: [
    { value: 'calls_completed_this_month', label: 'Calls Completed - This Month' },
    { value: 'calls_upcoming_this_month', label: 'Upcoming Calls - This Month' },
    { value: 'calls_inbound_this_month', label: 'Inbound Calls - This Month' },
    { value: 'calls_outbound_this_month', label: 'Outbound Calls - This Month' },
    { value: 'calls_inbound_duration_seconds_this_month', label: 'Inbound Seconds - This Month' },
    { value: 'calls_outbound_duration_seconds_this_month', label: 'Outbound Seconds - This Month' },
    { value: 'calls_missed_this_month', label: 'Missed Calls - This Month' },
    { value: 'calls_average_duration_this_month', label: 'Average Call Duration' }
  ],
  emails: [
    { value: 'emails_sent_this_month', label: 'Emails Sent - This Month' },
    { value: 'emails_opened_this_month', label: 'Emails Opened - This Month' },
    { value: 'emails_clicked_this_month', label: 'Emails Clicked - This Month' },
    { value: 'users_vs_emails_sent', label: 'Users vs Emails Sent' },
    { value: 'users_vs_emails_opened', label: 'Users vs Emails Opened' },
    { value: 'users_vs_emails_clicked', label: 'Users vs Emails Clicked' }
  ]
};

export interface ComponentConfig {
  id?: string;
  type: ComponentType;
  title: string;
  dashboardType: DashboardType; // Add dashboardType to associate components with specific dashboards
  metric: string; // Add metric to store the selected data source
  data?: any;
}

interface AddComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddComponent: (component: ComponentConfig) => void;
  currentDashboard: DashboardType; // Add currentDashboard prop to know which dashboard is active
}

/**
 * Dialog for adding new components to the dashboard
 * @param open - Whether the dialog is open
 * @param onOpenChange - Function to handle dialog open state changes
 * @param onAddComponent - Function to handle adding a new component
 * @param currentDashboard - The current dashboard type being viewed
 * @returns A Dialog component for adding dashboard components
 */
const AddComponentDialog: React.FC<AddComponentDialogProps> = ({
  open,
  onOpenChange,
  onAddComponent,
  currentDashboard
}) => {
  const [componentTitle, setComponentTitle] = useState('');
  const [componentType, setComponentType] = useState<ComponentType>('stat');
  const [metric, setMetric] = useState<string>('');

  // Get available metrics based on current dashboard type and component type
  const availableMetrics = DASHBOARD_METRICS[currentDashboard] || [];

  // Reset form when dialog opens (using the open prop)
  React.useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!componentTitle.trim() || !metric) {
      return; // Don't submit if title or metric is empty
    }
    
    const newComponent: ComponentConfig = {
      type: componentType,
      title: componentTitle,
      dashboardType: currentDashboard,
      metric: metric,
      data: {} // We would add specific data here based on component type
    };
    
    onAddComponent(newComponent);
    resetForm();
    onOpenChange(false);
  };
  
  const resetForm = () => {
    setComponentTitle('');
    setComponentType('stat');
    setMetric('');
  };
  
  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Dashboard Component</DialogTitle>
            <DialogDescription>
              Configure a new component to add to your dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="componentTitle" className="text-right">
                Title
              </Label>
              <Input
                id="componentTitle"
                value={componentTitle}
                onChange={(e) => setComponentTitle(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Revenue Comparison"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="componentType" className="text-right">
                Type
              </Label>
              <Select
                value={componentType}
                onValueChange={(value) => setComponentType(value as ComponentType)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select component type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stat">
                    <div className="flex items-center">
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      <span>KPI / Stat</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="chart">
                    <div className="flex items-center">
                      <LineChart className="mr-2 h-4 w-4" />
                      <span>Chart</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="targetMeter">
                    <div className="flex items-center">
                      <Gauge className="mr-2 h-4 w-4" />
                      <span>Target Meter</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Add Metric/Data Source selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="componentMetric" className="text-right">
                Metric
              </Label>
              <Select
                value={metric}
                onValueChange={setMetric}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select data to display" />
                </SelectTrigger>
                <SelectContent>
                  {availableMetrics.map((metricOption) => (
                    <SelectItem key={metricOption.value} value={metricOption.value}>
                      {metricOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Add Component</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddComponentDialog; 