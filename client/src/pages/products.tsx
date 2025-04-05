import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';

// This will be replaced with the actual Product type from schema.ts
// when we update the backend
interface Product {
  id: number;
  name: string;
  code: string;
  category: string;
  price: number;
  status: string;
  description: string;
}

const ProductsPage: React.FC = () => {
  // Sample data - this will be replaced with actual API data
  const sampleProducts: Product[] = [
    {
      id: 1,
      name: "Term Life 10",
      code: "TL-10",
      category: "Life Insurance",
      price: 500,
      status: "active",
      description: "10-year term life insurance policy"
    },
    {
      id: 2,
      name: "Term Life 20",
      code: "TL-20",
      category: "Life Insurance",
      price: 750,
      status: "active",
      description: "20-year term life insurance policy"
    },
    {
      id: 3,
      name: "Whole Life Basic",
      code: "WL-B",
      category: "Life Insurance",
      price: 1200,
      status: "active",
      description: "Basic whole life insurance policy"
    },
    {
      id: 4,
      name: "Whole Life Premium",
      code: "WL-P",
      category: "Life Insurance",
      price: 2000,
      status: "inactive",
      description: "Premium whole life insurance with investment component"
    },
    {
      id: 5,
      name: "Critical Illness",
      code: "CI-STD",
      category: "Health Insurance",
      price: 350,
      status: "active",
      description: "Critical illness coverage"
    }
  ];

  // Define columns for the data table
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Product Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "code",
      header: "SKU/Code",
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
        const description = row.getValue("description") as string;
        return (
          <div className="max-w-[300px] truncate" title={description}>
            {description}
          </div>
        );
      },
    },
    {
      id: "createField",
      header: () => (
        <div className="text-blue-600 cursor-pointer text-right" onClick={(e) => {
          e.stopPropagation();
          handleAddField();
        }}>
          +Create Field
        </div>
      ),
      cell: () => null,
    },
  ];

  // For now we'll use the sample data. Later this will be replaced with actual API data
  // const { data: products = [], isLoading, error } = useQuery({
  //   queryKey: ['/api/products'],
  //   queryFn: () => apiRequest('/api/products'),
  // });

  const handleRowClick = (row: any) => {
    console.log('Product clicked:', row.original);
    // This will be expanded to show product details or edit product
  };

  const handleAddField = () => {
    console.log('Add field clicked');
    // This will be expanded to allow adding custom fields
  };

  return (
    <DataTable
      columns={columns}
      data={sampleProducts}
      title="Products"
      description="Manage your product catalog"
      searchPlaceholder="Search products..."
      onRowClick={handleRowClick}
      onAddField={handleAddField}
    />
  );
};

export default ProductsPage;