import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';

// This will be replaced with the actual Company type from schema.ts
// when we update the backend
interface Company {
  id: number;
  name: string;
  phone: string;
  website: string;
  industry: string;
  status: string;
  owner: string;
}

const CompaniesPage: React.FC = () => {
  // Sample data - this will be replaced with actual API data
  const sampleCompanies: Company[] = [
    {
      id: 1,
      name: "Acme Corp",
      phone: "(555) 123-4567",
      website: "www.acmecorp.com",
      industry: "Manufacturing",
      status: "active",
      owner: "Alex Davis"
    },
    {
      id: 2,
      name: "TechStart Inc",
      phone: "(555) 987-6543",
      website: "www.techstart.io",
      industry: "Technology",
      status: "active",
      owner: "Sarah Johnson"
    },
    {
      id: 3,
      name: "Global Innovations",
      phone: "(555) 567-8901",
      website: "www.globalinnovations.com",
      industry: "Consulting",
      status: "inactive",
      owner: "Michael Rodriguez"
    },
    {
      id: 4,
      name: "Brown Enterprises",
      phone: "(555) 234-5678",
      website: "www.brownent.com",
      industry: "Retail",
      status: "active",
      owner: "Emily Chen"
    },
    {
      id: 5,
      name: "Medical Solutions",
      phone: "(555) 345-6789",
      website: "www.medsolutions.org",
      industry: "Healthcare",
      status: "active",
      owner: "Alex Davis"
    }
  ];

  // Define columns for the data table
  const columns: ColumnDef<Company>[] = [
    {
      accessorKey: "name",
      header: "Company Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "industry",
      header: "Industry",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "website",
      header: "Website",
      cell: ({ row }) => (
        <a 
          href={`https://${row.getValue("website")}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.getValue("website")}
        </a>
      ),
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
      accessorKey: "owner",
      header: "Company Owner",
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
  // const { data: companies = [], isLoading, error } = useQuery({
  //   queryKey: ['/api/companies'],
  //   queryFn: () => apiRequest('/api/companies'),
  // });

  const handleRowClick = (row: any) => {
    console.log('Company clicked:', row.original);
    // This will be expanded to show company details or edit company
  };

  const handleAddField = () => {
    console.log('Add field clicked');
    // This will be expanded to allow adding custom fields
  };

  return (
    <DataTable
      columns={columns}
      data={sampleCompanies}
      title="Companies"
      description="Manage your company records"
      searchPlaceholder="Search companies..."
      onRowClick={handleRowClick}
      onAddField={handleAddField}
    />
  );
};

export default CompaniesPage;