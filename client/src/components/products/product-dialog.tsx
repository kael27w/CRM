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
import { Product, NewProductData } from '@/lib/api';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (productData: NewProductData) => Promise<void>;
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
    }
    setErrors({});
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
             const cleanedData: NewProductData = {
         ...formData,
         product_name: formData.product_name.trim(),
         sku_code: formData.sku_code?.trim() || undefined,
         category: formData.category.trim(),
         description: formData.description?.trim() || undefined,
         price: Number(formData.price)
       };

      await onSave(cleanedData);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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