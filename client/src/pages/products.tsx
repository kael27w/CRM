import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table'; // Ensure this path is correct
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, PlusCircle } from 'lucide-react'; // Added PlusCircle
import { 
  fetchProducts, 
  Product, 
  NewProductData, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '@/lib/api'; // Ensure this path is correct
import ProductDialog, { ExtendedProductData } from '@/components/products/product-dialog'; // Ensure path
import { toast } from 'sonner';
import { useAuth } from '@/lib/context/AuthContext'; // Ensure path

const ProductsPage: React.FC = () => {
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const { profile, user, isLoadingProfile } = useAuth();
  const currentUserId = user?.id; // For query key, though not strictly needed for product ownership

  // This is the definitive check for admin privileges for UI rendering
  const isConfirmedAdmin = !isLoadingProfile && !!profile && profile.is_admin === true;

  // Console log for debugging admin status
  console.log('[PRODUCTS_PAGE_FRESH_ATTEMPT] isLoadingProfile:', isLoadingProfile, 'isConfirmedAdmin:', isConfirmedAdmin);
  
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['products', currentUserId], // User-specific key to help with cache if user context ever matters here
    queryFn: fetchProducts,
    enabled: !isLoadingProfile && !!currentUserId && profile !== undefined, // Ensure profile attempt has resolved
  });

  const commonMutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', currentUserId] });
    },
  };

  const createProductMutation = useMutation({
    mutationFn: (productData: NewProductData) => createProduct(productData), // Adjusted for clarity
    ...commonMutationOptions,
    onSuccess: (newProduct: Product, variables: NewProductData) => {
      commonMutationOptions.onSuccess();
      toast.success('Product created successfully!');
      const extendedData = variables as ExtendedProductData;
      if (extendedData.customFields || extendedData.tags) {
        // Assuming saveAdditionalProductData is defined or you'll implement it
        // saveAdditionalProductData(newProduct.id, extendedData.customFields, extendedData.tags);
        console.log("Would save additional data for new product", newProduct.id, extendedData);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NewProductData> }) => updateProduct(id, data),
    ...commonMutationOptions,
    onSuccess: () => {
      commonMutationOptions.onSuccess();
      toast.success('Product updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: number) => deleteProduct(productId), // Corrected to pass only ID
    ...commonMutationOptions,
    onSuccess: () => {
      commonMutationOptions.onSuccess();
      toast.success('Product deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });
  
  // --- Define Columns ---
  const baseColumns: ColumnDef<Product>[] = [
    {
      accessorKey: "product_name",
      header: "Product Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("product_name")}</div>,
    },
    {
      accessorKey: "sku_code",
      header: "SKU/Code",
      cell: ({ row }) => <div>{row.getValue("sku_code") || '-'}</div>,
    },
    { accessorKey: "category", header: "Category" },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"));
        return <div>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={row.getValue("status") === "active" ? "default" : "secondary"}>{row.getValue("status")}</Badge>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const desc = row.getValue("description") as string | null;
        return <div className="max-w-[200px] truncate" title={desc || ''}>{desc || '-'}</div>;
      },
    },
    // Tags column is handled by DataTable component automatically
  ];

  const adminActionsColumn: ColumnDef<Product> = {
    id: "admin-actions",
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
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteProduct(product)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };
  
  const tableColumns = (!isLoadingProfile && profile && isConfirmedAdmin) 
                       ? [...baseColumns, adminActionsColumn] 
                       : baseColumns;

  // Debug logging for column changes
  console.log('[PRODUCTS_DEBUG] tableColumns length:', tableColumns.length, 'includes admin-actions:', tableColumns.some(col => (col as any).id === 'admin-actions'));

  // --- Event Handlers ---
  const handleNewProduct = () => {
    if (!isConfirmedAdmin) return; // Should be redundant if button isn't shown
    setEditingProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    if (!isConfirmedAdmin) return;
    setEditingProduct(product);
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (!isConfirmedAdmin) return;
    if (window.confirm(`Are you sure you want to delete "${product.product_name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleSaveProduct = async (productData: ExtendedProductData) => {
    if (!isConfirmedAdmin) return;
    const { customFields, tags, ...baseProductData } = productData; // Assuming ExtendedProductData structure
    if (editingProduct) {
      await updateProductMutation.mutateAsync({ id: editingProduct.id, data: baseProductData });
    } else {
      await createProductMutation.mutateAsync(baseProductData as NewProductData); // Pass baseProductData for creation
    }
    setIsProductDialogOpen(false); // Close dialog on save
  };

  // --- Loading and Error States ---
  if (isLoadingProfile) {
    return <div className="p-4"><p>Loading user permissions...</p></div>;
  }

  if (isLoadingProducts) {
    return <div className="p-4"><p>Loading products...</p></div>;
  }

  if (productsError) {
    return <div className="p-4 text-red-500"><p>Error loading products: {productsError.message}</p></div>;
  }

  // --- Render ---
  return (
    <div className="p-4 md:p-6"> {/* Added some padding */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        {/* Conditional "New Product" Button - Placed here for standard UI layout */}
        {isConfirmedAdmin && (
          <Button onClick={handleNewProduct}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Product
          </Button>
        )}
      </div>

      <DataTable
        columns={tableColumns}
        data={products}
        // Removed title & description, searchPlaceholder as they are part of page layout now
        searchPlaceholder="Search products..." // Keep search if DataTable implements it
        pageType="products" // Keep if used by DataTable
        // onNewItem is handled by the external button
        // actionsColumn is now part of 'tableColumns'
        // Pass other relevant props to your DataTable like pagination, selection, etc.
      />
      
      {/* Product Dialog - only render if admin to prevent any access */}
      {isConfirmedAdmin && (
        <ProductDialog
          open={isProductDialogOpen}
          onOpenChange={setIsProductDialogOpen}
          onSave={handleSaveProduct}
          product={editingProduct}
          isLoading={createProductMutation.isPending || updateProductMutation.isPending}
        />
      )}
    </div>
  );
};

export default ProductsPage;