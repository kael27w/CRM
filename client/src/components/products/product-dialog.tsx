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
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Product, NewProductData } from '@/lib/api';
import { CustomField } from '../shared/add-field-dialog';

// Extended interface to include custom fields and tags
export interface ExtendedProductData extends NewProductData {
  customFields?: Record<string, any>;
  tags?: string[];
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (productData: ExtendedProductData) => Promise<void>;
  product?: Product | null; // For editing existing products
  isLoading?: boolean;
}

/**
 * Dialog for adding or editing products
 * @param open - Whether the dialog is open
 * @param onOpenChange - Function to handle dialog open state changes
 * @param onSave - Function to handle saving the product
 * @param product - Existing product data for editing (null for new product)
 * @param isLoading - Whether the save operation is in progress
 * @returns A Dialog component for product management
 */
const ProductDialog: React.FC<ProductDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  product = null,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<NewProductData>({
    product_name: '',
    sku_code: '',
    category: '',
    price: 0,
    status: 'active',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Load custom fields from localStorage
  useEffect(() => {
    const storageKey = 'customFields_products';
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

  // Populate form when editing an existing product
  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name,
        sku_code: product.sku_code || '',
        category: product.category,
        price: product.price,
        status: product.status,
        description: product.description || ''
      });

      // Load custom field data for this product
      const dataKey = 'customFieldData_products';
      const savedData = localStorage.getItem(dataKey);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          const productData = parsedData[product.id.toString()] || {};
          setCustomFieldValues(productData);
        } catch (error) {
          console.error('Error parsing saved custom field data:', error);
        }
      }

      // Load tags for this product
      const tagsKey = 'itemTags_products';
      const savedTags = localStorage.getItem(tagsKey);
      if (savedTags) {
        try {
          const parsedTags = JSON.parse(savedTags);
          const productTags = parsedTags[product.id.toString()] || [];
          setTags(productTags);
        } catch (error) {
          console.error('Error parsing saved tags:', error);
        }
      }
    } else {
      // Reset form for new product
      setFormData({
        product_name: '',
        sku_code: '',
        category: '',
        price: 0,
        status: 'active',
        description: ''
      });
      setCustomFieldValues({});
      setTags([]);
    }
    setErrors({});
    setNewTag('');
  }, [product, open]);

  // Common product categories
  const categories = [
    'Life Insurance',
    'Health Insurance',
    'Auto Insurance',
    'Home Insurance',
    'Business Insurance',
    'Travel Insurance',
    'Disability Insurance',
    'Annuities',
    'Investment Products',
    'Other'
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_name.trim()) {
      newErrors.product_name = 'Product name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (isNaN(formData.price)) {
      newErrors.price = 'Price must be a valid number';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
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
      const cleanedData: ExtendedProductData = {
        ...formData,
        product_name: formData.product_name.trim(),
        sku_code: formData.sku_code?.trim() || undefined,
        category: formData.category.trim(),
        description: formData.description?.trim() || undefined,
        price: Number(formData.price),
        // Include custom fields and tags in the data
        customFields: customFieldValues,
        tags: tags
      };

      await onSave(cleanedData);

      // For existing products, save custom field data and tags to localStorage
      if (product) {
        // Save custom field data
        const dataKey = 'customFieldData_products';
        const existingData = JSON.parse(localStorage.getItem(dataKey) || '{}');
        existingData[product.id.toString()] = customFieldValues;
        localStorage.setItem(dataKey, JSON.stringify(existingData));

        // Save tags
        const tagsKey = 'itemTags_products';
        const existingTags = JSON.parse(localStorage.getItem(tagsKey) || '{}');
        existingTags[product.id.toString()] = tags;
        localStorage.setItem(tagsKey, JSON.stringify(existingTags));
      }
      // For new products, the parent component will handle saving the tags and custom fields

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving product:', error);
      // Error handling is done in the parent component
    }
  };

  const handleCancel = () => {
    setFormData({
      product_name: '',
      sku_code: '',
      category: '',
      price: 0,
      status: 'active',
      description: ''
    });
    setCustomFieldValues({});
    setTags([]);
    setNewTag('');
    setErrors({});
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof NewProductData, value: string | number) => {
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
              {product ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {product 
                ? 'Update the product information below.' 
                : 'Fill in the details to create a new product.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Product Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productName" className="text-right">
                Product Name *
              </Label>
              <div className="col-span-3">
                <Input
                  id="productName"
                  value={formData.product_name}
                  onChange={(e) => handleInputChange('product_name', e.target.value)}
                  placeholder="e.g., Term Life Insurance"
                  className={errors.product_name ? 'border-red-500' : ''}
                />
                {errors.product_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.product_name}</p>
                )}
              </div>
            </div>

            {/* SKU Code */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="skuCode" className="text-right">
                SKU Code
              </Label>
              <div className="col-span-3">
                <Input
                  id="skuCode"
                  value={formData.sku_code}
                  onChange={(e) => handleInputChange('sku_code', e.target.value)}
                  placeholder="e.g., TLI-001"
                />
              </div>
            </div>

            {/* Category */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category *
              </Label>
              <div className="col-span-3">
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price *
              </Label>
              <div className="col-span-3">
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
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

            {/* Description */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right mt-2">
                Description
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional product description..."
                  rows={3}
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
              {isLoading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog; 