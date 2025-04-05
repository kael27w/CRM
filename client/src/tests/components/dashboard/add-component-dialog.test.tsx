import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom for DOM assertions
import AddComponentDialog, { ComponentConfig, DashboardType } from '../../../components/dashboard/add-component-dialog';

describe('AddComponentDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnAddComponent = vi.fn();
  const currentDashboard: DashboardType = 'overview';
  
  beforeEach(() => {
    mockOnOpenChange.mockReset();
    mockOnAddComponent.mockReset();
  });
  
  it('renders correctly when open', () => {
    render(
      <AddComponentDialog 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        onAddComponent={mockOnAddComponent}
        currentDashboard={currentDashboard}
      />
    );
    
    // Check that dialog content is rendered
    expect(screen.getByText('Add New Dashboard Component')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Metric')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Component/i })).toBeInTheDocument();
  });
  
  it('does not render when closed', () => {
    render(
      <AddComponentDialog 
        open={false} 
        onOpenChange={mockOnOpenChange} 
        onAddComponent={mockOnAddComponent}
        currentDashboard={currentDashboard}
      />
    );
    
    // Dialog should not be in the document
    expect(screen.queryByText('Add New Dashboard Component')).not.toBeInTheDocument();
  });
  
  it('submits the form with correct component data', async () => {
    render(
      <AddComponentDialog 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        onAddComponent={mockOnAddComponent}
        currentDashboard={currentDashboard}
      />
    );
    
    // Fill out the form
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'Test Component' } });
    
    // Open the metric dropdown and select a metric
    const metricTrigger = screen.getByLabelText('Metric');
    fireEvent.click(metricTrigger);
    // Need to select a metric - get the first one available
    const firstMetric = screen.getByText('Contacts Created - This Month');
    fireEvent.click(firstMetric);
    
    // Submit the form
    const addButton = screen.getByRole('button', { name: /Add Component/i });
    fireEvent.click(addButton);
    
    // Check that onAddComponent was called with correct data
    expect(mockOnAddComponent).toHaveBeenCalledWith({
      type: 'stat', // Default type is 'stat'
      title: 'Test Component',
      dashboardType: 'overview',
      metric: 'contacts_created_this_month',
      data: {}
    });
    
    // Dialog should be closed
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
  
  it('closes the dialog when Cancel is clicked', () => {
    render(
      <AddComponentDialog 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        onAddComponent={mockOnAddComponent}
        currentDashboard={currentDashboard}
      />
    );
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    // Dialog should be closed
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    
    // Component should not be added
    expect(mockOnAddComponent).not.toHaveBeenCalled();
  });
}); 