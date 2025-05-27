import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { fetchProducts, Product, NewProductData, createProduct, updateProduct, deleteProduct } from '@/lib/api';
import ProductDialog, { ExtendedProductData } from '@/components/products/product-dialog';
import { toast } from 'sonner';

const ProductsPage: React.FC = () => {
  // State for managing product dialogs
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // React Query setup
  const queryClient = useQueryClient();

  // Fetch products from the API using React Query
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  // Mutation for creating products
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (newProduct: Product, variables: NewProductData) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully!');
      
      // Handle saving custom fields and tags for the new product
      const extendedData = variables as ExtendedProductData;
      if (extendedData.customFields || extendedData.tags) {
        saveAdditionalProductData(newProduct.id, extendedData.customFields, extendedData.tags);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });

  // Mutation for updating products
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NewProductData> }) => 
      updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });

  // Mutation for deleting products
  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });

  // Function to save custom fields and tags for a new product
  const saveAdditionalProductData = (productId: number, customFields?: Record<string, any>, tags?: string[]) => {
    try {
      // Save custom field data
      if (customFields && Object.keys(customFields).length > 0) {
        const dataKey = 'customFieldData_products';
        const existingData = JSON.parse(localStorage.getItem(dataKey) || '{}');
        existingData[productId.toString()] = customFields;
        localStorage.setItem(dataKey, JSON.stringify(existingData));
      }

      // Save tags
      if (tags && tags.length > 0) {
        const tagsKey = 'itemTags_products';
        const existingTags = JSON.parse(localStorage.getItem(tagsKey) || '{}');
        existingTags[productId.toString()] = tags;
        localStorage.setItem(tagsKey, JSON.stringify(existingTags));
      }

      // Dispatch custom event to notify DataTable of localStorage changes
      window.dispatchEvent(new Event('localStorageUpdate'));

      // Force a re-render of the DataTable to show the new tags and custom fields
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Error saving additional product data:', error);
    }
  };

  // Define main columns for the data table (without actions)
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "product_name",
      header: "Product Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("product_name")}</div>
      ),
    },
    {
      accessorKey: "sku_code",
      header: "SKU/Code",
      cell: ({ row }) => {
        const skuCode = row.getValue("sku_code") as string | null;
        return <div>{skuCode || '-'}</div>;
      },
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"));
        // Format the amount as a dollar amount
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(price);
        
        return <div>{formatted}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant={status === "active" ? "default" : "secondary"}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return (
          <div className="max-w-[300px] truncate" title={description || ''}>
            {description || '-'}
          </div>
        );
      },
    },
  ];

  // Define actions column separately
  const actionsColumn: ColumnDef<Product> = {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const product = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteProduct(product)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };

  // Event handlers
  const handleRowClick = (row: any) => {
    console.log('Product clicked:', row.original);
    // Could open a product details view here
  };

  const handleAddField = () => {
    console.log('Add field clicked');
    // This will be expanded to allow adding custom fields
  };

  const handleNewProduct = () => {
    console.log('New Product button clicked');
    setEditingProduct(null); // Ensure we're creating a new product
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    console.log('Edit product clicked:', product);
    setEditingProduct(product);
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.product_name}"? This action cannot be undone.`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleSaveProduct = async (productData: ExtendedProductData) => {
    // Extract the base product data (without custom fields and tags)
    const { customFields, tags, ...baseProductData } = productData;
    
    if (editingProduct) {
      // Update existing product
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        data: baseProductData
      });
    } else {
      // Create new product - the mutation's onSuccess will handle saving custom fields and tags
      await createProductMutation.mutateAsync(productData);
    }
  };

  // Bulk action handlers
  const handleBulkUpdate = async (selectedIds: string[], updates: any) => {
    console.log('Bulk update:', selectedIds, updates);
    // For now, just show a success message
    // In a real app, you'd call an API endpoint to update multiple products
    toast.success(`Bulk update would be applied to ${selectedIds.length} products`);
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    console.log('Bulk delete:', selectedIds);
    // For now, just show a success message
    // In a real app, you'd call an API endpoint to delete multiple products
    for (const id of selectedIds) {
      try {
        await deleteProduct(parseInt(id));
      } catch (error) {
        console.error(`Failed to delete product ${id}:`, error);
      }
    }
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">
          Error loading products: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={products}
        title="Products"
        description="Manage your product catalog"
        searchPlaceholder="Search products..."
        pageType="products"
        onRowClick={handleRowClick}
        onAddField={handleAddField}
        onNewItem={handleNewProduct}
        actionsColumn={actionsColumn}
        onBulkUpdate={handleBulkUpdate}
        onBulkDelete={handleBulkDelete}
      />
      
      <ProductDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        onSave={handleSaveProduct}
        product={editingProduct}
        isLoading={createProductMutation.isPending || updateProductMutation.isPending}
      />
    </>
  );
};

export default ProductsPage;