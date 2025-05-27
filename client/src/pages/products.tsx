import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { fetchProducts, Product } from '@/lib/api';

const ProductsPage: React.FC = () => {
  // Fetch products from the API using React Query
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  // Define columns for the data table
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

  const handleRowClick = (row: any) => {
    console.log('Product clicked:', row.original);
    // This will be expanded to show product details or edit product
  };

  const handleAddField = () => {
    console.log('Add field clicked');
    // This will be expanded to allow adding custom fields
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
    <DataTable
      columns={columns}
      data={products}
      title="Products"
      description="Manage your product catalog"
      searchPlaceholder="Search products..."
      onRowClick={handleRowClick}
      onAddField={handleAddField}
    />
  );
};

export default ProductsPage;