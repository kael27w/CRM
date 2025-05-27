import React, { useState, useMemo, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  Row,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import {
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  Filter,
  Plus,
  Tags,
  User,
  Pencil,
  Trash2,
  Mail,
  MoreHorizontal,
} from 'lucide-react';
import AddFieldDialog, { CustomField } from './add-field-dialog';
import { Badge } from '../ui/badge';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title: string;
  description?: string;
  searchPlaceholder?: string;
  searchColumn?: string;
  onRowClick?: (row: Row<TData>) => void;
  onAddField?: () => void;
  onNewItem?: () => void; // Handler for the "New [Item]" button
  pageType?: 'contacts' | 'companies' | 'products'; // To determine which bulk actions to show
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title,
  description,
  searchPlaceholder = "Search...",
  searchColumn = "name",
  onRowClick,
  onAddField,
  onNewItem,
  pageType = 'contacts',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');

  // State for adding new field
  const [isAddingField, setIsAddingField] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Load custom fields from localStorage on component mount
  useEffect(() => {
    const storageKey = `customFields_${pageType}`;
    const savedFields = localStorage.getItem(storageKey);
    if (savedFields) {
      try {
        const parsedFields = JSON.parse(savedFields);
        setCustomFields(parsedFields);
      } catch (error) {
        console.error('Error parsing saved custom fields:', error);
      }
    }
  }, [pageType]);

  // Save custom fields to localStorage whenever they change
  useEffect(() => {
    const storageKey = `customFields_${pageType}`;
    localStorage.setItem(storageKey, JSON.stringify(customFields));
  }, [customFields, pageType]);
  
  // Define additional columns based on custom fields
  const customColumns = useMemo(() => {
    return customFields.map((field): ColumnDef<TData, TValue> => ({
      accessorKey: field.id,
      header: field.name,
      cell: ({ row }) => {
        const value = row.getValue(field.id);
        
        // Format value based on field type
        if (field.type === 'boolean' && typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
        }
        
        if (field.type === 'select' && typeof value === 'string' && field.options) {
          return <Badge variant="outline">{value}</Badge>;
        }
        
        return value || '-';
      },
    }));
  }, [customFields]);
  
  // Function to handle adding a new custom field
  const handleAddCustomField = (field: CustomField) => {
    setCustomFields(prev => [...prev, field]);
    
    // Add the field to all existing data rows with a default value
    // This would normally be handled by a backend update
    console.log(`Added new field: ${field.name} (${field.type})`);
  };

  // Handle bulk actions
  const handleChangeOwner = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    alert(`Change owner for ${selectedRows.length} items`);
    // This would connect to API in real implementation
  };
  
  const handleAddTags = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    alert(`Add tags to ${selectedRows.length} items`);
    // This would connect to API in real implementation
  };
  
  const handleRemoveTags = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    alert(`Remove tags from ${selectedRows.length} items`);
    // This would connect to API in real implementation
  };
  
  const handleUpdateField = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    alert(`Update field for ${selectedRows.length} items`);
    // This would connect to API in real implementation
  };
  
  const handleDelete = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    alert(`Delete ${selectedRows.length} items`);
    // This would connect to API in real implementation
  };
  
  const handleSendEmail = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    alert(`Send email to ${selectedRows.length} contacts`);
    // This would connect to API in real implementation
  };

  // Add selection column to start of columns and create field at the end
  const allColumns = useMemo(() => {
    const baseColumns = [
      {
        id: "select",
        header: ({ table }: { table: any }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }: { row: any }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...columns,
      ...customColumns,
    ];
    
    // Add "Create Field" column
    baseColumns.push({
      id: "createField",
      header: () => (
        <div 
          className="cursor-pointer text-blue-600 hover:text-blue-800 flex items-center justify-center"
          onClick={() => setIsAddingField(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Create Field
        </div>
      ),
      cell: () => null,
      enableSorting: false,
      enableHiding: false,
    } as ColumnDef<TData, TValue>);
    
    return baseColumns as ColumnDef<TData, TValue>[];
  }, [columns, customColumns]);

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  const hasRowsSelected = table.getFilteredSelectedRowModel().rows.length > 0;
  
  // List of bulk actions based on page type
  const getBulkActions = () => {
    const commonActions = [
      { label: 'Change Owner', icon: <User className="mr-2 h-4 w-4" />, onClick: handleChangeOwner },
      { label: 'Add Tags', icon: <Tags className="mr-2 h-4 w-4" />, onClick: handleAddTags },
      { label: 'Remove Tags', icon: <Tags className="mr-2 h-4 w-4" />, onClick: handleRemoveTags },
      { label: 'Update Field', icon: <Pencil className="mr-2 h-4 w-4" />, onClick: handleUpdateField },
      { label: 'Delete', icon: <Trash2 className="mr-2 h-4 w-4 text-red-500" />, onClick: handleDelete },
    ];
    
    // Add Send Email option only for contacts
    if (pageType === 'contacts') {
      return [
        ...commonActions,
        { label: 'Send Email', icon: <Mail className="mr-2 h-4 w-4" />, onClick: handleSendEmail },
      ];
    }
    
    return commonActions;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
          {description && (
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="default" 
            size="sm" 
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2"
            onClick={onNewItem}
          >
            <Plus className="mr-2 h-4 w-4" />
            {title === "Companies" ? "New Company" : `New ${title.slice(0, -1)}`}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between py-4 gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-64"
          />
          
          {hasRowsSelected && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-2">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {getBulkActions().map((action, i) => (
                  <DropdownMenuItem key={i} onClick={action.onClick} className="cursor-pointer">
                    {action.icon}
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                // Get the display name for the column
                const displayName = typeof column.columnDef.header === 'string' 
                  ? column.columnDef.header 
                  : column.id;
                
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {displayName}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? "cursor-pointer hover:bg-muted" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Dialog for adding a new field */}
      <AddFieldDialog
        open={isAddingField}
        onOpenChange={setIsAddingField}
        onAddField={handleAddCustomField}
      />

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}