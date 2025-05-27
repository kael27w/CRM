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
  Check,
  X,
} from 'lucide-react';
import AddFieldDialog, { CustomField } from './add-field-dialog';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

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
  actionsColumn?: ColumnDef<TData, TValue>; // Actions column to be positioned correctly
  onBulkUpdate?: (selectedIds: string[], updates: any) => Promise<void>; // Bulk update handler
  onBulkDelete?: (selectedIds: string[]) => Promise<void>; // Bulk delete handler
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
  actionsColumn,
  onBulkUpdate,
  onBulkDelete,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');

  // State for adding new field
  const [isAddingField, setIsAddingField] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // State for custom field data and editing
  const [customFieldData, setCustomFieldData] = useState<Record<string, Record<string, any>>>({});
  const [editingCell, setEditingCell] = useState<{ rowId: string; fieldId: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // State for tags
  const [itemTags, setItemTags] = useState<Record<string, string[]>>({});

  // State for bulk actions dialogs
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [showUpdateFieldDialog, setShowUpdateFieldDialog] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'add' | 'remove'>('add');

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

    // Load custom field data
    const dataKey = `customFieldData_${pageType}`;
    const savedData = localStorage.getItem(dataKey);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setCustomFieldData(parsedData);
      } catch (error) {
        console.error('Error parsing saved custom field data:', error);
      }
    }

    // Load tags data
    const tagsKey = `itemTags_${pageType}`;
    const savedTags = localStorage.getItem(tagsKey);
    if (savedTags) {
      try {
        const parsedTags = JSON.parse(savedTags);
        setItemTags(parsedTags);
      } catch (error) {
        console.error('Error parsing saved tags:', error);
      }
    }
  }, [pageType]);

  // Save custom fields to localStorage whenever they change
  useEffect(() => {
    const storageKey = `customFields_${pageType}`;
    localStorage.setItem(storageKey, JSON.stringify(customFields));
  }, [customFields, pageType]);

  // Save custom field data to localStorage whenever it changes
  useEffect(() => {
    const dataKey = `customFieldData_${pageType}`;
    localStorage.setItem(dataKey, JSON.stringify(customFieldData));
  }, [customFieldData, pageType]);

  // Save tags to localStorage whenever they change
  useEffect(() => {
    const tagsKey = `itemTags_${pageType}`;
    localStorage.setItem(tagsKey, JSON.stringify(itemTags));
  }, [itemTags, pageType]);
  
  // Define additional columns based on custom fields
  const customColumns = useMemo(() => {
    return customFields.map((field): ColumnDef<TData, TValue> => ({
      accessorKey: field.id,
      header: field.name,
      cell: ({ row }) => {
        const rowId = (row.original as any).id?.toString() || row.id;
        const value = customFieldData[rowId]?.[field.id] || '';
        const isEditing = editingCell?.rowId === rowId && editingCell?.fieldId === field.id;
        
        if (isEditing) {
          return (
            <div className="flex items-center space-x-2">
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                className="h-8 w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveCustomField(rowId, field.id, editingValue);
                  } else if (e.key === 'Escape') {
                    setEditingCell(null);
                    setEditingValue('');
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSaveCustomField(rowId, field.id, editingValue)}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingCell(null);
                  setEditingValue('');
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[24px] flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              setEditingCell({ rowId, fieldId: field.id });
              setEditingValue(value?.toString() || '');
            }}
          >
            {field.type === 'boolean' && typeof value === 'boolean' ? (
              value ? 'Yes' : 'No'
            ) : field.type === 'select' && typeof value === 'string' && field.options ? (
              <Badge variant="outline">{value}</Badge>
            ) : (
              value || <span className="text-gray-400">Click to edit</span>
            )}
          </div>
        );
      },
    }));
  }, [customFields, customFieldData, editingCell, editingValue]);

  // Add tags column
  const tagsColumn: ColumnDef<TData, TValue> = {
    id: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const rowId = (row.original as any).id?.toString() || row.id;
      const tags = itemTags[rowId] || [];
      
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(rowId, tag);
                }}
                className="ml-1 hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              const newTag = prompt('Enter tag name:');
              if (newTag && newTag.trim()) {
                addTag(rowId, newTag.trim());
              }
            }}
            className="h-5 w-5 p-0 text-xs"
          >
            +
          </Button>
        </div>
      );
    },
  };
  
  // Function to handle adding a new custom field
  const handleAddCustomField = (field: CustomField) => {
    setCustomFields(prev => [...prev, field]);
    console.log(`Added new field: ${field.name} (${field.type})`);
  };

  // Function to save custom field value
  const handleSaveCustomField = (rowId: string, fieldId: string, value: string) => {
    setCustomFieldData(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [fieldId]: value
      }
    }));
    setEditingCell(null);
    setEditingValue('');
    toast.success('Field updated successfully');
  };

  // Tag management functions
  const addTag = (rowId: string, tag: string) => {
    setItemTags(prev => ({
      ...prev,
      [rowId]: [...(prev[rowId] || []), tag]
    }));
  };

  const removeTag = (rowId: string, tagToRemove: string) => {
    setItemTags(prev => ({
      ...prev,
      [rowId]: (prev[rowId] || []).filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle bulk actions
  const handleChangeOwner = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const newOwner = prompt('Enter new owner name:');
    if (newOwner && onBulkUpdate) {
      try {
        const selectedIds = selectedRows.map(row => (row.original as any).id?.toString());
        await onBulkUpdate(selectedIds, { owner: newOwner });
        toast.success(`Owner changed for ${selectedRows.length} items`);
        setRowSelection({});
      } catch (error) {
        toast.error('Failed to change owner');
      }
    }
  };
  
  const handleAddTags = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const newTag = prompt('Enter tag to add:');
    if (newTag && newTag.trim()) {
      selectedRows.forEach(row => {
        const rowId = (row.original as any).id?.toString() || row.id;
        addTag(rowId, newTag.trim());
      });
      toast.success(`Tag "${newTag}" added to ${selectedRows.length} items`);
      setRowSelection({});
    }
  };
  
  const handleRemoveTags = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const tagToRemove = prompt('Enter tag to remove:');
    if (tagToRemove && tagToRemove.trim()) {
      selectedRows.forEach(row => {
        const rowId = (row.original as any).id?.toString() || row.id;
        removeTag(rowId, tagToRemove.trim());
      });
      toast.success(`Tag "${tagToRemove}" removed from ${selectedRows.length} items`);
      setRowSelection({});
    }
  };
  
  const handleUpdateField = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (customFields.length === 0) {
      toast.error('No custom fields available to update');
      return;
    }
    
    const fieldOptions = customFields.map(f => `${f.name} (${f.id})`).join('\n');
    const fieldChoice = prompt(`Choose field to update:\n${fieldOptions}\n\nEnter field name:`);
    if (!fieldChoice) return;
    
    const field = customFields.find(f => f.name === fieldChoice || f.id === fieldChoice);
    if (!field) {
      toast.error('Field not found');
      return;
    }
    
    const newValue = prompt(`Enter new value for ${field.name}:`);
    if (newValue !== null) {
      selectedRows.forEach(row => {
        const rowId = (row.original as any).id?.toString() || row.id;
        setCustomFieldData(prev => ({
          ...prev,
          [rowId]: {
            ...prev[rowId],
            [field.id]: newValue
          }
        }));
      });
      toast.success(`Field "${field.name}" updated for ${selectedRows.length} items`);
      setRowSelection({});
    }
  };
  
  const handleDelete = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} items? This action cannot be undone.`)) {
      if (onBulkDelete) {
        try {
          const selectedIds = selectedRows.map(row => (row.original as any).id?.toString());
          await onBulkDelete(selectedIds);
          toast.success(`${selectedRows.length} items deleted successfully`);
          setRowSelection({});
        } catch (error) {
          toast.error('Failed to delete items');
        }
      } else {
        toast.error('Delete functionality not implemented');
      }
    }
  };
  
  const handleSendEmail = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const emails = selectedRows
      .map(row => (row.original as any).email)
      .filter(email => email);
    
    if (emails.length === 0) {
      toast.error('No email addresses found for selected contacts');
      return;
    }
    
    const emailList = emails.join(';');
    window.open(`mailto:${emailList}`);
    toast.success(`Email client opened with ${emails.length} recipients`);
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
      tagsColumn,
    ];
    
    // Add actions column if provided (before Create Field)
    if (actionsColumn) {
      baseColumns.push(actionsColumn);
    }
    
    // Add "Create Field" column at the very end
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
  }, [columns, customColumns, actionsColumn, tagsColumn]);

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