import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "../ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select';

export interface CustomField {
  id: string;
  name: string;
  type: FieldType;
  options?: string[]; // For select type
}

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddField: (field: CustomField) => void;
}

/**
 * Dialog for adding custom fields to tables
 * @param open - Whether the dialog is open
 * @param onOpenChange - Function to handle dialog open state changes
 * @param onAddField - Function to handle adding a new field
 * @returns A Dialog component for adding custom fields
 */
const AddFieldDialog: React.FC<AddFieldDialogProps> = ({
  open,
  onOpenChange,
  onAddField
}) => {
  const [fieldName, setFieldName] = useState<string>('');
  const [fieldType, setFieldType] = useState<FieldType>('text');
  const [selectOptions, setSelectOptions] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fieldName.trim()) {
      return; // Don't submit if field name is empty
    }
    
    const newField: CustomField = {
      id: `custom_${Date.now()}`,
      name: fieldName,
      type: fieldType,
    };
    
    // For select fields, add options
    if (fieldType === 'select' && selectOptions.trim()) {
      newField.options = selectOptions.split(',').map(option => option.trim());
    }
    
    onAddField(newField);
    resetForm();
    onOpenChange(false);
  };
  
  const resetForm = () => {
    setFieldName('');
    setFieldType('text');
    setSelectOptions('');
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
            <DialogTitle>Add New Field</DialogTitle>
            <DialogDescription>
              Create a custom field to add to the table.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fieldName" className="text-right">
                Field Name
              </Label>
              <Input
                id="fieldName"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Policy Number"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fieldType" className="text-right">
                Field Type
              </Label>
              <Select 
                value={fieldType} 
                onValueChange={(value) => setFieldType(value as FieldType)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Yes/No</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {fieldType === 'select' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="selectOptions" className="text-right">
                  Options
                </Label>
                <Input
                  id="selectOptions"
                  value={selectOptions}
                  onChange={(e) => setSelectOptions(e.target.value)}
                  className="col-span-3"
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Add Field</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFieldDialog; 