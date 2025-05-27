import React, { useState, useEffect } from 'react';
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
import { Badge } from "../ui/badge";
import { Company, NewCompanyData } from '@/lib/api';
import { CustomField } from '../shared/add-field-dialog';

// Extended interface to include custom fields and tags
export interface ExtendedCompanyData extends NewCompanyData {
  customFields?: Record<string, any>;
  tagsList?: string[]; // Use different name to avoid conflict with tags string property
}

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (companyData: ExtendedCompanyData) => Promise<void>;
  company?: Company | null; // For editing existing companies
  isLoading?: boolean;
}

/**
 * Dialog for adding or editing companies
 * @param open - Whether the dialog is open
 * @param onOpenChange - Function to handle dialog open state changes
 * @param onSave - Function to handle saving the company
 * @param company - Existing company data for editing (null for new company)
 * @param isLoading - Whether the save operation is in progress
 * @returns A Dialog component for company management
 */
const CompanyDialog: React.FC<CompanyDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  company = null,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<NewCompanyData>({
    company_name: '',
    industry: '',
    phone: '',
    website: '',
    status: 'active',
    company_owner: '',
    tags: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Load custom fields from localStorage
  useEffect(() => {
    const storageKey = 'customFields_companies';
    const savedFields = localStorage.getItem(storageKey);
    if (savedFields) {
      try {
        const parsedFields = JSON.parse(savedFields);
        setCustomFields(parsedFields);
      } catch (error) {
        console.error('Error parsing saved custom fields:', error);
      }
    }
  }, []);

  // Populate form when editing an existing company
  useEffect(() => {
    if (company) {
      setFormData({
        company_name: company.company_name,
        industry: company.industry || '',
        phone: company.phone || '',
        website: company.website || '',
        status: company.status,
        company_owner: company.company_owner || '',
        tags: company.tags || ''
      });

      // Load custom field data for this company
      const dataKey = 'customFieldData_companies';
      const savedData = localStorage.getItem(dataKey);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          const companyData = parsedData[company.id.toString()] || {};
          setCustomFieldValues(companyData);
        } catch (error) {
          console.error('Error parsing saved custom field data:', error);
        }
      }

      // Load tags for this company
      const tagsKey = 'itemTags_companies';
      const savedTags = localStorage.getItem(tagsKey);
      if (savedTags) {
        try {
          const parsedTags = JSON.parse(savedTags);
          const companyTags = parsedTags[company.id.toString()] || [];
          setTags(companyTags);
        } catch (error) {
          console.error('Error parsing saved tags:', error);
        }
      }
    } else {
      // Reset form for new company
      setFormData({
        company_name: '',
        industry: '',
        phone: '',
        website: '',
        status: 'active',
        company_owner: '',
        tags: ''
      });
      setCustomFieldValues({});
      setTags([]);
    }
    setErrors({});
    setNewTag('');
  }, [company, open]);

  // Common industry categories
  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Insurance',
    'Manufacturing',
    'Retail',
    'Real Estate',
    'Education',
    'Consulting',
    'Legal',
    'Marketing',
    'Construction',
    'Transportation',
    'Energy',
    'Entertainment',
    'Food & Beverage',
    'Automotive',
    'Telecommunications',
    'Government',
    'Non-Profit',
    'Other'
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    // Validate phone format if provided
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = formData.phone.replace(/[\s\-\(\)\.]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    // Validate website format if provided
    if (formData.website && formData.website.trim()) {
      const websiteRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!websiteRegex.test(formData.website)) {
        newErrors.website = 'Please enter a valid website URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Clean up the data before sending
      const cleanedData: ExtendedCompanyData = {
        ...formData,
        company_name: formData.company_name.trim(),
        industry: formData.industry?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        website: formData.website?.trim() || undefined,
        company_owner: formData.company_owner?.trim() || undefined,
        tags: formData.tags?.trim() || undefined,
        // Include custom fields and tags in the data
        customFields: customFieldValues,
        tagsList: tags
      };

      await onSave(cleanedData);

      // For existing companies, save custom field data and tags to localStorage
      if (company) {
        // Save custom field data
        const dataKey = 'customFieldData_companies';
        const existingData = JSON.parse(localStorage.getItem(dataKey) || '{}');
        existingData[company.id.toString()] = customFieldValues;
        localStorage.setItem(dataKey, JSON.stringify(existingData));

        // Save tags
        const tagsKey = 'itemTags_companies';
        const existingTags = JSON.parse(localStorage.getItem(tagsKey) || '{}');
        existingTags[company.id.toString()] = tags;
        localStorage.setItem(tagsKey, JSON.stringify(existingTags));
      }
      // For new companies, the parent component will handle saving the tags and custom fields

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving company:', error);
      // Error handling is done in the parent component
    }
  };

  const handleCancel = () => {
    setFormData({
      company_name: '',
      industry: '',
      phone: '',
      website: '',
      status: 'active',
      company_owner: '',
      tags: ''
    });
    setCustomFieldValues({});
    setTags([]);
    setNewTag('');
    setErrors({});
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof NewCompanyData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {company ? 'Edit Company' : 'Add New Company'}
            </DialogTitle>
            <DialogDescription>
              {company 
                ? 'Update the company information below.' 
                : 'Fill in the details to create a new company.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Company Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="companyName" className="text-right">
                Company Name *
              </Label>
              <div className="col-span-3">
                <Input
                  id="companyName"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  className={errors.company_name ? 'border-red-500' : ''}
                />
                {errors.company_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
                )}
              </div>
            </div>

            {/* Industry */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="industry" className="text-right">
                Industry
              </Label>
              <div className="col-span-3">
                <Select 
                  value={formData.industry} 
                  onValueChange={(value) => handleInputChange('industry', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Phone */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <div className="col-span-3">
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="e.g., (555) 123-4567"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Website */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="website" className="text-right">
                Website
              </Label>
              <div className="col-span-3">
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="e.g., www.company.com"
                  className={errors.website ? 'border-red-500' : ''}
                />
                {errors.website && (
                  <p className="text-red-500 text-sm mt-1">{errors.website}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status *
              </Label>
              <div className="col-span-3">
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-red-500 text-sm mt-1">{errors.status}</p>
                )}
              </div>
            </div>

            {/* Company Owner */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="companyOwner" className="text-right">
                Company Owner
              </Label>
              <div className="col-span-3">
                <Input
                  id="companyOwner"
                  value={formData.company_owner}
                  onChange={(e) => handleInputChange('company_owner', e.target.value)}
                  placeholder="e.g., John Smith"
                />
              </div>
            </div>

            {/* Custom Fields */}
            {customFields.length > 0 && (
              <>
                <div className="col-span-4 border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Custom Fields</h3>
                </div>
                {customFields.map((field) => (
                  <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={field.id} className="text-right">
                      {field.name}
                    </Label>
                    <div className="col-span-3">
                      {field.type === 'text' && (
                        <Input
                          id={field.id}
                          value={customFieldValues[field.id] || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          placeholder={`Enter ${field.name.toLowerCase()}`}
                        />
                      )}
                      {field.type === 'number' && (
                        <Input
                          id={field.id}
                          type="number"
                          value={customFieldValues[field.id] || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, parseFloat(e.target.value) || 0)}
                          placeholder={`Enter ${field.name.toLowerCase()}`}
                        />
                      )}
                      {field.type === 'select' && field.options && (
                        <Select
                          value={customFieldValues[field.id] || ''}
                          onValueChange={(value) => handleCustomFieldChange(field.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {field.type === 'boolean' && (
                        <Select
                          value={customFieldValues[field.id]?.toString() || 'false'}
                          onValueChange={(value) => handleCustomFieldChange(field.id, value === 'true')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Tags */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">
                Tags
              </Label>
              <div className="col-span-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (company ? 'Update Company' : 'Create Company')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyDialog; 