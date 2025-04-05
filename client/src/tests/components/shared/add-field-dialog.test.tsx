import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddFieldDialog, { CustomField } from '../../../components/shared/add-field-dialog';

describe('AddFieldDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnAddField = vi.fn();
  
  beforeEach(() => {
    mockOnOpenChange.mockReset();
    mockOnAddField.mockReset();
  });
  
  it('renders correctly when open', () => {
    render(
      <AddFieldDialog 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        onAddField={mockOnAddField} 
      />
    );
    
    // Check that dialog content is rendered
    expect(screen.getByText('Add New Field')).toBeInTheDocument();
    expect(screen.getByLabelText('Field Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Field Type')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Field/i })).toBeInTheDocument();
  });
  
  it('does not render when closed', () => {
    render(
      <AddFieldDialog 
        open={false} 
        onOpenChange={mockOnOpenChange} 
        onAddField={mockOnAddField} 
      />
    );
    
    // Dialog should not be in the document
    expect(screen.queryByText('Add New Field')).not.toBeInTheDocument();
  });
  
  it('submits the form with correct field data for text type', () => {
    render(
      <AddFieldDialog 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        onAddField={mockOnAddField} 
      />
    );
    
    // Fill out the form
    const nameInput = screen.getByLabelText('Field Name');
    fireEvent.change(nameInput, { target: { value: 'Test Field' } });
    
    // Submit the form
    const addButton = screen.getByRole('button', { name: /Add Field/i });
    fireEvent.click(addButton);
    
    // Check that onAddField was called with correct data
    expect(mockOnAddField).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test Field',
      type: 'text'
    }));
    
    // Dialog should be closed
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
  
  it('adds options for select field type', () => {
    render(
      <AddFieldDialog 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        onAddField={mockOnAddField} 
      />
    );
    
    // Fill out the form
    const nameInput = screen.getByLabelText('Field Name');
    fireEvent.change(nameInput, { target: { value: 'Test Select Field' } });
    
    // Change field type to select
    const typeSelect = screen.getByLabelText('Field Type');
    fireEvent.click(typeSelect);
    fireEvent.click(screen.getByText('Dropdown'));
    
    // Options input should now be visible
    const optionsInput = screen.getByLabelText('Options');
    fireEvent.change(optionsInput, { target: { value: 'Option 1, Option 2, Option 3' } });
    
    // Submit the form
    const addButton = screen.getByRole('button', { name: /Add Field/i });
    fireEvent.click(addButton);
    
    // Check that onAddField was called with correct data including options
    expect(mockOnAddField).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test Select Field',
      type: 'select',
      options: ['Option 1', 'Option 2', 'Option 3']
    }));
  });
  
  it('closes the dialog when Cancel is clicked', () => {
    render(
      <AddFieldDialog 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        onAddField={mockOnAddField} 
      />
    );
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    // Dialog should be closed
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    
    // Field should not be added
    expect(mockOnAddField).not.toHaveBeenCalled();
  });
}); 