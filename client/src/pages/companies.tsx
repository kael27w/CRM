import React, { useState, useEffect, useCallback } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, Edit, Trash2, Building2, Building } from 'lucide-react';
import { fetchCompanies, Company, NewCompanyData, createCompany, updateCompany, deleteCompany } from '@/lib/api';
import CompanyDialog, { ExtendedCompanyData } from '@/components/companies/company-dialog';
import { useAuth } from '@/lib/context/AuthContext';
import { toast } from 'sonner';

const CompaniesPage: React.FC = () => {
  // State for managing company dialogs
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  // Auth context
  const { profile, isLoadingProfile, user } = useAuth();
  const currentUserId = user?.id;

  // Admin status checks
  const isConfirmedAdmin = !isLoadingProfile && !!profile && profile.is_admin === true;
  const isAuthenticatedUser = !isLoadingProfile && !!user;

  console.log(`[COMPANIES_PAGE_RENDER_START] isLoadingProfile: ${isLoadingProfile}, currentUserId: ${currentUserId}, isConfirmedAdmin: ${isConfirmedAdmin}, isAuthenticatedUser: ${isAuthenticatedUser}, profile_exists: ${!!profile}`);

  const initializeViewAllCompanies = useCallback(() => {
    let initialToggleState = false;
    if (currentUserId) {
      const storageKey = `companiesViewAll_${currentUserId}`;
      try {
        const storedPreference = localStorage.getItem(storageKey);
        initialToggleState = storedPreference === 'true';
        console.log(`[DEBUG_USESTATE_INIT] User ${currentUserId}: Reading storageKey '${storageKey}'. Stored: "${storedPreference}". InitialToggleState set to: ${initialToggleState}`);
      } catch (e) {
        console.warn(`[DEBUG_USESTATE_INIT] Error reading localStorage for key ${storageKey}`, e);
        initialToggleState = false;
      }
    } else {
      console.log("[DEBUG_USESTATE_INIT] No currentUserId at time of useState init. Defaulting toggle to false.");
    }
    return initialToggleState;
  }, [currentUserId]);

  const [viewAllCompanies, setViewAllCompanies] = useState(initializeViewAllCompanies);

  console.log(`[COMPANIES_RENDER] isLoadingProfile: ${isLoadingProfile}, isConfirmedAdmin: ${isConfirmedAdmin}, currentUserId: ${currentUserId}, viewAllCompanies (state): ${viewAllCompanies}, profile_exists: ${!!profile}`);

  // Effect to react to changes in authentication or confirmed admin status
  useEffect(() => {
    console.log(`[COMPANIES_EFFECT_SYNC] Running. isLoadingProfile: ${isLoadingProfile}, isConfirmedAdmin: ${isConfirmedAdmin}, currentUserId: ${currentUserId}, profile_exists: ${!!profile}`);

    if (isLoadingProfile) return;

    if (isAuthenticatedUser) {
      if (isConfirmedAdmin) {
        const storageKey = `companiesViewAll_${currentUserId}`;
        const storedPreference = localStorage.getItem(storageKey);
        const shouldViewAll = storedPreference === 'true';
        if (viewAllCompanies !== shouldViewAll) {
          console.log(`[COMPANIES_EFFECT_SYNC] Admin ${currentUserId}: State (${viewAllCompanies}) differs from localStorage (${shouldViewAll}). Syncing state.`);
          setViewAllCompanies(shouldViewAll);
        }
      } else if (profile === null && !isLoadingProfile) {
        console.log(`[COMPANIES_EFFECT_SYNC] User ${currentUserId}: Profile fetch failed/timed out. Retaining current viewAllCompanies: ${viewAllCompanies}`);
      } else if (!isConfirmedAdmin && profile !== undefined) {
        console.log(`[COMPANIES_EFFECT_SYNC] Not Admin (${currentUserId}). Ensuring viewAllCompanies is false and clearing storage.`);
        if (viewAllCompanies) setViewAllCompanies(false);
        localStorage.removeItem(`companiesViewAll_${currentUserId}`);
      }
    } else {
      console.log('[COMPANIES_EFFECT_SYNC] User logged out. Resetting viewAllCompanies to false.');
      if (viewAllCompanies) setViewAllCompanies(false);
      if (currentUserId) localStorage.removeItem(`companiesViewAll_${currentUserId}`);
    }
  }, [isLoadingProfile, isConfirmedAdmin, currentUserId, profile, viewAllCompanies]);
  
  const handleToggleChange = (checked: boolean) => {
    setViewAllCompanies(checked);
    if (isConfirmedAdmin && currentUserId) {
      localStorage.setItem(`companiesViewAll_${currentUserId}`, checked ? 'true' : 'false');
      console.log(`[COMPANIES_TOGGLE_SAVE] Admin ${currentUserId} saved pref for companiesViewAll_${currentUserId}: ${checked}`);
    }
  };

  // viewParam now depends on isConfirmedAdmin for 'all' view
  const viewParam: 'mine' | 'all' = isConfirmedAdmin && viewAllCompanies ? 'all' : 'mine';
  console.log(`[COMPANIES_VIEW_PARAM] Calculated viewParam: ${viewParam}`);
  
  // React Query setup
  const queryClient = useQueryClient();

  // Fetch companies from the API using React Query
  const { data: companies = [], isLoading: isLoadingCompanies, isError, error: companiesError } = useQuery({
    queryKey: ['companies', viewParam, isConfirmedAdmin, currentUserId],
    queryFn: () => {
      console.log(`[COMPANIES_QUERY] Fetching with viewParam: ${viewParam} for user ${currentUserId} (isConfirmedAdmin: ${isConfirmedAdmin})`);
      return fetchCompanies(viewParam);
    },
    enabled: !isLoadingProfile && !!currentUserId && profile !== undefined,
  });

  // Aliases for backward compatibility with existing code
  const isLoading = isLoadingCompanies;
  const error = companiesError;

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

  const showAdminToggle = !isLoadingProfile && !!profile && isConfirmedAdmin;
  console.log(`[COMPANIES_RENDER_TOGGLE_CHECK] showAdminToggle: ${showAdminToggle}`);

  // Show loading state if profile is still loading
  if (isLoadingProfile || profile === undefined) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Companies</h1>
          <Button disabled>
            <Building2 className="mr-2 h-4 w-4" /> Add Company
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading user profile...</div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isAuthError = errorMessage.includes('Unauthorized') || errorMessage.includes('401');
    
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Companies</h1>
            {showAdminToggle && (
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Switch
                  id="view-toggle"
                  checked={viewAllCompanies}
                  onCheckedChange={handleToggleChange}
                  disabled={true} // Disable during error
                />
                <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Label htmlFor="view-toggle" className="text-sm text-red-600 dark:text-red-400">
                  Error
                </Label>
              </div>
            )}
          </div>
          <Button onClick={handleNewCompany}>
            <Building2 className="mr-2 h-4 w-4" /> Add Company
          </Button>
        </div>
        <div className="border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-lg p-6">
          <div className="space-y-2">
            <p className="text-red-600 dark:text-red-400 font-medium">
              {isAuthError ? "Authentication Error" : "Error Fetching Companies"}
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm">
              {isAuthError 
                ? "You don't have permission to view companies. Please check your authentication and try again."
                : `Error: ${errorMessage}`
              }
            </p>
            {isAuthError && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Companies</h1>
            {showAdminToggle && (
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Switch
                  id="view-toggle"
                  checked={viewAllCompanies}
                  onCheckedChange={handleToggleChange}
                  disabled={true} // Disable during loading
                />
                <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Label htmlFor="view-toggle" className="text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </Label>
              </div>
            )}
          </div>
          <Button onClick={handleNewCompany}>
            <Building2 className="mr-2 h-4 w-4" /> Add Company
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading companies...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Companies</h1>
          {showAdminToggle && (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Switch
                id="view-toggle"
                checked={viewAllCompanies}
                onCheckedChange={handleToggleChange}
              />
              <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Label htmlFor="view-toggle" className="text-sm text-blue-600 dark:text-blue-400">
                {viewAllCompanies ? `All Companies (${companies.length})` : `My Companies (${companies.length})`}
              </Label>
            </div>
          )}
        </div>
        <Button onClick={handleNewCompany}>
          <Building2 className="mr-2 h-4 w-4" /> Add Company
        </Button>
      </div>
      
      <DataTable
        columns={columns}
        data={companies}
        title=""
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
    </div>
  );
};

export default CompaniesPage;