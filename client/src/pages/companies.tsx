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
import { fetchCompanies, Company, NewCompanyData, createCompany, updateCompany, deleteCompany } from '@/lib/api';
import CompanyDialog, { ExtendedCompanyData } from '@/components/companies/company-dialog';
import { toast } from 'sonner';

const CompaniesPage: React.FC = () => {
  // State for managing company dialogs
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  // React Query setup
  const queryClient = useQueryClient();

  // Fetch companies from the API using React Query
  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  });

  // Mutation for creating companies
  const createCompanyMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: (newCompany: Company, variables: NewCompanyData) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company created successfully!');
      
      // Handle saving custom fields and tags for the new company
      const extendedData = variables as ExtendedCompanyData;
      if (extendedData.customFields || extendedData.tagsList) {
        saveAdditionalCompanyData(newCompany.id, extendedData.customFields, extendedData.tagsList);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to create company: ${error.message}`);
    },
  });

  // Mutation for updating companies
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NewCompanyData> }) => 
      updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update company: ${error.message}`);
    },
  });

  // Mutation for deleting companies
  const deleteCompanyMutation = useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete company: ${error.message}`);
    },
  });

  // Function to save custom fields and tags for a new company
  const saveAdditionalCompanyData = (companyId: number, customFields?: Record<string, any>, tags?: string[]) => {
    try {
      // Save custom field data
      if (customFields && Object.keys(customFields).length > 0) {
        const dataKey = 'customFieldData_companies';
        const existingData = JSON.parse(localStorage.getItem(dataKey) || '{}');
        existingData[companyId.toString()] = customFields;
        localStorage.setItem(dataKey, JSON.stringify(existingData));
      }

      // Save tags
      if (tags && tags.length > 0) {
        const tagsKey = 'itemTags_companies';
        const existingTags = JSON.parse(localStorage.getItem(tagsKey) || '{}');
        existingTags[companyId.toString()] = tags;
        localStorage.setItem(tagsKey, JSON.stringify(existingTags));
      }

      // Dispatch custom event to notify DataTable of localStorage changes
      window.dispatchEvent(new Event('localStorageUpdate'));

      // Force a re-render of the DataTable to show the new tags and custom fields
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    } catch (error) {
      console.error('Error saving additional company data:', error);
    }
  };

  // Define main columns for the data table (without actions)
  const columns: ColumnDef<Company>[] = [
    {
      accessorKey: "company_name",
      header: "Company Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("company_name")}</div>
      ),
    },
    {
      accessorKey: "industry",
      header: "Industry",
      cell: ({ row }) => {
        const industry = row.getValue("industry") as string | null;
        return <div>{industry || '-'}</div>;
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string | null;
        return <div>{phone || '-'}</div>;
      },
    },
    {
      accessorKey: "website",
      header: "Website",
      cell: ({ row }) => {
        const website = row.getValue("website") as string | null;
        if (!website) return <div>-</div>;
        
        return (
          <a 
            href={website.startsWith('http') ? website : `https://${website}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {website}
          </a>
        );
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
      accessorKey: "company_owner",
      header: "Company Owner",
      cell: ({ row }) => {
        const owner = row.getValue("company_owner") as string | null;
        return <div>{owner || '-'}</div>;
      },
    },
  ];

  // Define actions column separately
  const actionsColumn: ColumnDef<Company> = {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const company = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditCompany(company)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteCompany(company)}
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
    console.log('Company clicked:', row.original);
    // Could open a company details view here
  };

  const handleAddField = () => {
    console.log('Add field clicked');
    // This will be expanded to allow adding custom fields
  };

  const handleNewCompany = () => {
    console.log('New Company button clicked');
    setEditingCompany(null); // Ensure we're creating a new company
    setIsCompanyDialogOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    console.log('Edit company clicked:', company);
    setEditingCompany(company);
    setIsCompanyDialogOpen(true);
  };

  const handleDeleteCompany = (company: Company) => {
    if (window.confirm(`Are you sure you want to delete "${company.company_name}"? This action cannot be undone.`)) {
      deleteCompanyMutation.mutate(company.id);
    }
  };

  const handleSaveCompany = async (companyData: ExtendedCompanyData) => {
    // Extract the base company data (without custom fields and tags)
    const { customFields, tagsList, ...baseCompanyData } = companyData;
    
    if (editingCompany) {
      // Update existing company
      await updateCompanyMutation.mutateAsync({
        id: editingCompany.id,
        data: baseCompanyData
      });
    } else {
      // Create new company - the mutation's onSuccess will handle saving custom fields and tags
      await createCompanyMutation.mutateAsync(companyData);
    }
  };

  // Bulk action handlers
  const handleBulkUpdate = async (selectedIds: string[], updates: any) => {
    console.log('Bulk update:', selectedIds, updates);
    // For now, just show a success message
    // In a real app, you'd call an API endpoint to update multiple companies
    toast.success(`Bulk update would be applied to ${selectedIds.length} companies`);
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    console.log('Bulk delete:', selectedIds);
    // For now, just show a success message
    // In a real app, you'd call an API endpoint to delete multiple companies
    for (const id of selectedIds) {
      try {
        await deleteCompany(parseInt(id));
      } catch (error) {
        console.error(`Failed to delete company ${id}:`, error);
      }
    }
    queryClient.invalidateQueries({ queryKey: ['companies'] });
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading companies...</div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">
          Error loading companies: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={companies}
        title="Companies"
        description="Manage your company records"
        searchPlaceholder="Search companies..."
        pageType="companies"
        onRowClick={handleRowClick}
        onAddField={handleAddField}
        onNewItem={handleNewCompany}
        actionsColumn={actionsColumn}
        onBulkUpdate={handleBulkUpdate}
        onBulkDelete={handleBulkDelete}
      />
      
      <CompanyDialog
        open={isCompanyDialogOpen}
        onOpenChange={setIsCompanyDialogOpen}
        onSave={handleSaveCompany}
        company={editingCompany}
        isLoading={createCompanyMutation.isPending || updateCompanyMutation.isPending}
      />
    </>
  );
};

export default CompaniesPage;