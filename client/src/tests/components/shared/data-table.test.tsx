import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DataTable } from '../../../components/shared/data-table';
import { ColumnDef } from '@tanstack/react-table';

// Mock data and columns for testing
interface TestData {
  id: number;
  name: string;
  email: string;
  status: string;
}

describe('DataTable', () => {
  const mockData: TestData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  ];
  
  const mockColumns: ColumnDef<TestData, any>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
  ];
  
  const mockOnRowClick = vi.fn();
  
  beforeEach(() => {
    mockOnRowClick.mockReset();
    vi.clearAllMocks();
    
    // Mock window.alert
    window.alert = vi.fn();
  });
  
  it('renders the table with correct data', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        title="Test Table"
        onRowClick={mockOnRowClick}
      />
    );
    
    // Check that the title is rendered
    expect(screen.getByText('Test Table')).toBeInTheDocument();
    
    // Check that data is rendered in the table
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    
    // Check that all columns are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
  
  it('handles row selection for bulk actions', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        title="Test Table"
        pageType="contacts"
      />
    );
    
    // Get the select checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    
    // Check that actions button is not visible initially
    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    
    // Select the first row
    fireEvent.click(checkboxes[1]); // First data row checkbox (index 0 is the header checkbox)
    
    // Check that the Actions button is now visible
    expect(screen.getByText('Actions')).toBeInTheDocument();
    
    // Open the actions dropdown
    fireEvent.click(screen.getByText('Actions'));
    
    // Check that all expected actions are in the dropdown
    const dropdown = screen.getByText('Bulk Actions').parentElement;
    expect(dropdown).toBeInTheDocument();
    
    // For contacts, we should have the Send Email option
    expect(within(dropdown!).getByText('Send Email')).toBeInTheDocument();
    expect(within(dropdown!).getByText('Change Owner')).toBeInTheDocument();
    expect(within(dropdown!).getByText('Add Tags')).toBeInTheDocument();
    expect(within(dropdown!).getByText('Remove Tags')).toBeInTheDocument();
    expect(within(dropdown!).getByText('Update Field')).toBeInTheDocument();
    expect(within(dropdown!).getByText('Delete')).toBeInTheDocument();
  });
  
  it('handles row clicks', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        title="Test Table"
        onRowClick={mockOnRowClick}
      />
    );
    
    // Find the row with John Doe and click it
    const johnDoeRow = screen.getByText('John Doe').closest('tr');
    fireEvent.click(johnDoeRow!);
    
    // Check that the onRowClick function was called with the correct row
    expect(mockOnRowClick).toHaveBeenCalledTimes(1);
    // The parameter would be a Row object which is complex to verify in this test
  });
  
  it('opens the Add Field dialog when "Create Field" is clicked', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        title="Test Table"
      />
    );
    
    // Find and click the "Create Field" button
    const createFieldButton = screen.getByText('Create Field');
    fireEvent.click(createFieldButton);
    
    // Check that the Add Field dialog is opened
    expect(screen.getByText('Add New Field')).toBeInTheDocument();
    expect(screen.getByLabelText('Field Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Field Type')).toBeInTheDocument();
  });
  
  it('renders different bulk actions for different page types', () => {
    // Test with "companies" page type
    const { unmount } = render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        title="Companies"
        pageType="companies"
      />
    );
    
    // Select the first row
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    
    // Open the actions dropdown
    fireEvent.click(screen.getByText('Actions'));
    
    // Check for common actions
    const dropdown = screen.getByText('Bulk Actions').parentElement;
    expect(within(dropdown!).getByText('Change Owner')).toBeInTheDocument();
    
    // The Send Email option should not be present for companies
    expect(within(dropdown!).queryByText('Send Email')).not.toBeInTheDocument();
    
    // Clean up
    unmount();
    
    // Test with "contacts" page type to make sure Send Email is present
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        title="Contacts"
        pageType="contacts"
      />
    );
    
    // Select the first row again
    const contactCheckboxes = screen.getAllByRole('checkbox');
    fireEvent.click(contactCheckboxes[1]);
    
    // Open the actions dropdown
    fireEvent.click(screen.getByText('Actions'));
    
    // The Send Email option should be present for contacts
    const contactsDropdown = screen.getByText('Bulk Actions').parentElement;
    expect(within(contactsDropdown!).getByText('Send Email')).toBeInTheDocument();
  });
}); 