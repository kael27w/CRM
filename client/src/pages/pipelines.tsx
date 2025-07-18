import React, { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchPipelines, 
  fetchPipelineData, 
  createDeal, 
  updateDeal, 
  deleteDeal,
  fetchCompanies,
  fetchContacts,
  type NewDealData
} from '../lib/api';
import { useAuth } from '../lib/context/AuthContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";

import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Plus, 
  MoreHorizontal,
  Calendar,
  BarChart3,
  HeartPulse,
  Home,
  Landmark,
  Building2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";

// Define types for deals and pipeline
interface Deal {
  id: number;
  name: string;
  amount: number;
  company: string;
  contact: string;
  closingDate: string;
  stageId: string;
  probability: number;
  status: 'open' | 'won' | 'lost';
}

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  deals: Deal[];
}

interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
}

// Add a type for the Add Deal dialog form
interface AddDealFormData {
  name: string;
  amount: number;
  company_id: number | null;
  contact_id: number | null;
  closingDate: string;
  probability: number;
  stageId: string;
}

// Utility function to parse date strings without timezone conversion issues
const parseLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  // If the date string includes 'T' (ISO format), extract just the date part
  const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  
  // Parse the date components manually to avoid timezone issues
  const [year, month, day] = dateOnly.split('-').map(Number);
  
  // Create a date in local timezone (month is 0-indexed in JavaScript)
  return new Date(year, month - 1, day);
};

// Sortable deal card component
const SortableDealCard: React.FC<{ deal: Deal; onEdit: (dealId: number) => void; onDelete: (dealId: number) => void }> = ({ deal, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: deal.id.toString() });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
};

// Component to display each card in the board
const DealCard: React.FC<{ deal: Deal; onEdit: (dealId: number) => void; onDelete: (dealId: number) => void }> = ({ deal, onEdit, onDelete }) => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(deal.amount);
  
  // Use the utility function to parse the date without timezone issues
  const dueDate = parseLocalDate(deal.closingDate);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(dueDate);
  
  const handleEditClick = () => {
    console.log(`[DEAL_CARD] Edit button clicked for deal ID: ${deal.id}`);
    console.log(`[DEAL_CARD] Deal data:`, deal);
    console.log(`[DEAL_CARD] Calling onEdit handler...`);
    onEdit(deal.id);
  };
  
  const handleDeleteClick = () => {
    console.log(`[DEAL_CARD] Delete button clicked for deal ID: ${deal.id}`);
    console.log(`[DEAL_CARD] Calling onDelete handler...`);
    onDelete(deal.id);
  };
  
  return (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow duration-200">
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-medium">{deal.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditClick}>Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteClick}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="text-sm mt-1">{deal.company}</CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            {formattedAmount}
          </div>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-1 h-3 w-3" />
            {formattedDate}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        <Badge variant="outline" className="rounded-full text-xs">
          {deal.probability}%
        </Badge>
        <div className="flex -space-x-2">
          <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
            {deal.contact.split(' ').map(name => name[0]).join('')}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

// Component for a pipeline stage column
const StageColumn: React.FC<{ 
  stage: PipelineStage, 
  stageTotal: number,
  deals: Deal[],
  onEdit: (dealId: number) => void;
  onDelete: (dealId: number) => void;
}> = ({ stage, stageTotal, deals, onEdit, onDelete }) => {
  // Make the column droppable, even when empty
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: 'column', stageId: stage.id }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`w-72 shrink-0 rounded-md ${isOver ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-800'} p-3 min-h-[12rem]`} 
      id={stage.id}
    >
      <div className="mb-3">
        <div>
          <h3 className="font-medium">{stage.name}</h3>
          <p className="text-sm text-muted-foreground">
            {deals.length} deals · ${stageTotal.toLocaleString()}
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {deals.map(deal => (
          <SortableDealCard key={deal.id} deal={deal} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
};

const PipelinesPage: React.FC = () => {
  const [activePipeline, setActivePipeline] = useState("sales-pipeline");
  const [activeItem, setActiveItem] = useState<Deal | null>(null);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [isEditDealOpen, setIsEditDealOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentDealId, setCurrentDealId] = useState<number | null>(null);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  
  // Auth context
  const { profile, isLoadingProfile, user } = useAuth();
  const isConfirmedAdmin = !isLoadingProfile && !!profile?.is_admin;
  const currentUserId = user?.id;

  // Toggle state for "My Deals" vs "All Deals" with localStorage persistence per user
  const [showAllDeals, setShowAllDeals] = useState(() => {
    if (!currentUserId) return false;
    const stored = localStorage.getItem(`pipelinesViewShowAll_${currentUserId}`);
    return stored === 'true' && isConfirmedAdmin;
  });

  // Save showAllDeals preference to localStorage when it changes (user-specific)
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`pipelinesViewShowAll_${currentUserId}`, showAllDeals.toString());
    }
  }, [showAllDeals, currentUserId]);

  // Reset to "My Deals" when user profile loads and user is not admin
  useEffect(() => {
    if (!isLoadingProfile && profile !== undefined && !isConfirmedAdmin && showAllDeals) {
      setShowAllDeals(false);
    }
  }, [isLoadingProfile, profile, isConfirmedAdmin, showAllDeals]);

  // Determine current view for API calls
  const currentView: 'mine' | 'all' = showAllDeals && isConfirmedAdmin ? 'all' : 'mine';
  
  // Get today's date in YYYY-MM-DD format without timezone issues
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [addDealForm, setAddDealForm] = useState<AddDealFormData>({
    name: '',
    amount: 0,
    company_id: null,
    contact_id: null,
    closingDate: getTodayString(),
    probability: 20,
    stageId: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Add logging for state changes to detect infinite loops
  React.useEffect(() => {
    console.log(`[STATE_MONITOR] isEditDealOpen changed to:`, isEditDealOpen);
  }, [isEditDealOpen]);

  React.useEffect(() => {
    console.log(`[STATE_MONITOR] currentDealId changed to:`, currentDealId);
  }, [currentDealId]);

  React.useEffect(() => {
    console.log(`[STATE_MONITOR] addDealForm changed to:`, addDealForm);
  }, [addDealForm]);

  React.useEffect(() => {
    console.log(`[STATE_MONITOR] activePipeline changed to:`, activePipeline);
  }, [activePipeline]);

  // Fetch all pipelines for the sidebar
  const { data: pipelinesList, isLoading: pipelinesLoading, error: pipelinesError } = useQuery({
    queryKey: ['pipelines', currentUserId], // Include user ID for cache isolation
    queryFn: fetchPipelines,
    enabled: !!currentUserId,
  });

  // Fetch companies for dropdowns - UPDATED: Respect user permissions
  const { data: companiesList = [], isLoading: companiesLoading, error: companiesError } = useQuery({
    queryKey: ['companies-dropdown', currentView, currentUserId, isConfirmedAdmin], // Include admin status for cache isolation
    queryFn: () => {
      console.log(`🔍 [DROPDOWN_COMPANIES] Fetching companies for dropdown with view: ${currentView}, user: ${currentUserId}, isAdmin: ${isConfirmedAdmin}`);
      // Admin users can see all companies, regular users only see their own
      return fetchCompanies(isConfirmedAdmin ? 'all' : 'mine');
    },
    enabled: !!currentUserId && profile !== null, // Wait for profile to be loaded
  });

  // Fetch contacts for dropdowns - UPDATED: Respect user permissions  
  const { data: contactsList = [], isLoading: contactsLoading, error: contactsError } = useQuery({
    queryKey: ['contacts-dropdown', currentView, currentUserId, isConfirmedAdmin], // Include admin status for cache isolation
    queryFn: () => {
      console.log(`🔍 [DROPDOWN_CONTACTS] Fetching contacts for dropdown with view: ${currentView}, user: ${currentUserId}, isAdmin: ${isConfirmedAdmin}`);
      // Admin users can see all contacts, regular users only see their own
      return fetchContacts(isConfirmedAdmin ? 'all' : 'mine');
    },
    enabled: !!currentUserId && profile !== null, // Wait for profile to be loaded
  });

  // CRITICAL: Debug logging for dropdown data
  useEffect(() => {
    console.log(`🔍 [DROPDOWN_DEBUG] Dropdown data state:`, {
      companiesCount: companiesList?.length || 0,
      contactsCount: contactsList?.length || 0,
      companiesLoading,
      contactsLoading,
      companiesError: companiesError?.message,
      contactsError: contactsError?.message,
      isConfirmedAdmin,
      currentUserId,
      currentView
    });
    
    if (companiesList && companiesList.length > 0) {
      console.log(`🔍 [DROPDOWN_DEBUG] Sample companies:`, companiesList.slice(0, 3).map(c => ({
        id: c.id,
        name: c.company_name
      })));
    }
    
    if (contactsList && contactsList.length > 0) {
      console.log(`🔍 [DROPDOWN_DEBUG] Sample contacts:`, contactsList.slice(0, 3).map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`
      })));
    }
  }, [companiesList, contactsList, companiesLoading, contactsLoading, companiesError, contactsError, isConfirmedAdmin]);

  // CRITICAL: Debug logging when Add Deal dialog opens
  useEffect(() => {
    if (isAddDealOpen) {
      console.log(`🔍 [ADD_DEAL_DEBUG] Add Deal dialog opened!`);
      console.log(`🔍 [ADD_DEAL_DEBUG] Available companies:`, companiesList?.length || 0);
      console.log(`🔍 [ADD_DEAL_DEBUG] Available contacts:`, contactsList?.length || 0);
      console.log(`🔍 [ADD_DEAL_DEBUG] Form state:`, addDealForm);
      console.log(`🔍 [ADD_DEAL_DEBUG] User permissions:`, { isConfirmedAdmin, currentUserId });
      
      if ((!companiesList || companiesList.length === 0) && !companiesLoading) {
        console.warn(`⚠️ [ADD_DEAL_DEBUG] No companies available for dropdown!`);
        if (companiesError) {
          console.error(`❌ [ADD_DEAL_DEBUG] Companies error:`, companiesError);
        }
      }
      
      if ((!contactsList || contactsList.length === 0) && !contactsLoading) {
        console.warn(`⚠️ [ADD_DEAL_DEBUG] No contacts available for dropdown!`);
        if (contactsError) {
          console.error(`❌ [ADD_DEAL_DEBUG] Contacts error:`, contactsError);
        }
      }
    }
  }, [isAddDealOpen, companiesList, contactsList, companiesLoading, contactsLoading, companiesError, contactsError, addDealForm, isConfirmedAdmin, currentUserId]);

  // Focus management for edit dialog - IMPROVED VERSION
  React.useEffect(() => {
    if (isEditDealOpen && currentDealId) {
      console.log(`[EDIT_DIALOG_FOCUS] Dialog opened for deal ID: ${currentDealId}`);
      
      // Dialog ready - no complex focus management needed
      
      // Optional: Focus the name input after a short delay to ensure DOM is ready
      // Only if no Select components are causing issues
      const focusTimer = setTimeout(() => {
        if (nameInputRef.current && document.activeElement !== nameInputRef.current) {
          console.log(`[EDIT_DIALOG_FOCUS] Attempting to focus name input...`);
          try {
            nameInputRef.current.focus();
            console.log(`[EDIT_DIALOG_FOCUS] Name input focused successfully`);
          } catch (error) {
            console.warn(`[EDIT_DIALOG_FOCUS] Focus failed, but continuing:`, error);
          }
        }
      }, 100); // Short delay to ensure DOM is ready
      
      return () => {
        clearTimeout(focusTimer);
      };
    } else {
      console.log(`[EDIT_DIALOG_FOCUS] Dialog closed or no deal ID`);
    }
  }, [isEditDealOpen, currentDealId]);

  // Monitor edit dialog opening (after data is declared)
  React.useEffect(() => {
    if (isEditDealOpen) {
      console.log(`[EDIT_DIALOG_MONITOR] Edit dialog opened!`);
      console.log(`[EDIT_DIALOG_MONITOR] Current deal ID:`, currentDealId);
      console.log(`[EDIT_DIALOG_MONITOR] Form data:`, addDealForm);
      console.log(`[EDIT_DIALOG_MONITOR] Companies available:`, companiesList?.length || 0);
      console.log(`[EDIT_DIALOG_MONITOR] Contacts available:`, contactsList?.length || 0);
    } else {
      console.log(`[EDIT_DIALOG_MONITOR] Edit dialog closed.`);
    }
  }, [isEditDealOpen, currentDealId, addDealForm, companiesList, contactsList]);

  // Global error handler for unhandled errors
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error(`[GLOBAL_ERROR] Unhandled error detected:`, event.error);
      console.error(`[GLOBAL_ERROR] Error message:`, event.message);
      console.error(`[GLOBAL_ERROR] Error filename:`, event.filename);
      console.error(`[GLOBAL_ERROR] Error line:`, event.lineno);
      console.error(`[GLOBAL_ERROR] Error column:`, event.colno);
      console.error(`[GLOBAL_ERROR] This error might be causing the UI freeze!`);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error(`[GLOBAL_ERROR] Unhandled promise rejection:`, event.reason);
      console.error(`[GLOBAL_ERROR] This promise rejection might be causing the UI freeze!`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Fetch the active pipeline data - CRITICAL FIX: Include user ID in queryKey for proper cache isolation
  const { data: currentPipelineData, isLoading: pipelineLoading, error: pipelineError } = useQuery({
    queryKey: ['pipeline', activePipeline, currentView, currentUserId], // SECURITY: Added currentUserId
    queryFn: () => fetchPipelineData(activePipeline, currentView),
    enabled: !!activePipeline && !!currentUserId, // PERFORMANCE FIX: Only enabled when user is loaded
  });

  // Mutation for creating a new deal
  const createDealMutation = useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      // SECURITY FIX: Include user ID in cache invalidation
      queryClient.invalidateQueries({ queryKey: ['pipeline', activePipeline, currentView, currentUserId] });
      setIsAddDealOpen(false);
      // Reset form state immediately
      resetFormState();
      toast({
        title: "Success",
        description: "Deal created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create deal. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Ensure form is always reset even if there's an error
      resetFormState();
    }
  });

  // Mutation for updating a deal
  const updateDealMutation = useMutation({
    mutationFn: ({ dealId, dealData }: { dealId: number; dealData: Partial<any> }) => 
      updateDeal(dealId, dealData),
    onSuccess: () => {
      // SECURITY FIX: Include user ID in cache invalidation
      queryClient.invalidateQueries({ queryKey: ['pipeline', activePipeline, currentView, currentUserId] });
      setIsEditDealOpen(false);
      setCurrentDealId(null);
      // Reset form state immediately
      resetFormState();
      toast({
        title: "Success",
        description: "Deal updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update deal. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Ensure form is always reset and dialogs closed
      setIsEditDealOpen(false);
      setCurrentDealId(null);
      resetFormState();
    }
  });

  // Mutation for deleting a deal
  const deleteDealMutation = useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      // SECURITY FIX: Include user ID in cache invalidation
      queryClient.invalidateQueries({ queryKey: ['pipeline', activePipeline, currentView, currentUserId] });
      setIsDeleteDialogOpen(false);
      setDealToDelete(null);
      // Reset form state immediately
      resetFormState();
      toast({
        title: "Success",
        description: "Deal deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete deal. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Ensure dialogs are always closed and state reset
      setIsDeleteDialogOpen(false);
      setDealToDelete(null);
      resetFormState();
    }
  });

  // Fallback to mock data if API fails or is not available
  const [mockPipelines] = useState<Pipeline[]>([
    {
      id: "sales-pipeline",
      name: "Sales Pipeline",
      stages: [
        {
          id: "qualification",
          name: "Qualification",
          order: 1,
          deals: [
            {
              id: 1,
              name: "New Business Opportunity",
              amount: 5000,
              company: "Acme Corp",
              contact: "Sarah Johnson",
              closingDate: "2025-05-15",
              stageId: "qualification",
              probability: 20,
              status: 'open'
            },
            {
              id: 2,
              name: "Small Business Package",
              amount: 8500,
              company: "TechStart Inc",
              contact: "Robert Thompson",
              closingDate: "2025-04-30",
              stageId: "qualification",
              probability: 30,
              status: 'open'
            }
          ]
        },
        {
          id: "needs-analysis",
          name: "Needs Analysis",
          order: 2,
          deals: [
            {
              id: 3,
              name: "Enterprise Solution",
              amount: 15000,
              company: "Global Innovations",
              contact: "Jennifer Williams",
              closingDate: "2025-05-10",
              stageId: "needs-analysis",
              probability: 40,
              status: 'open'
            }
          ]
        },
        {
          id: "proposal",
          name: "Proposal/Price Quote",
          order: 3,
          deals: [
            {
              id: 4,
              name: "Executive Package",
              amount: 25000,
              company: "Brown Enterprises",
              contact: "Michael Brown",
              closingDate: "2025-04-25",
              stageId: "proposal",
              probability: 60,
              status: 'open'
            }
          ]
        },
        {
          id: "negotiation",
          name: "Negotiation/Review",
          order: 4,
          deals: []
        },
        {
          id: "closed-won",
          name: "Closed Won",
          order: 5,
          deals: []
        },
        {
          id: "closed-lost",
          name: "Closed Lost",
          order: 6,
          deals: []
        }
      ]
    },
    {
      id: "customer-support",
      name: "Customer Support",
      stages: [
        {
          id: "new-ticket",
          name: "New Ticket",
          order: 1,
          deals: [
            {
              id: 101,
              name: "Billing Inquiry",
              amount: 0,
              company: "Smith Family",
              contact: "John Smith",
              closingDate: "2025-05-15",
              stageId: "new-ticket",
              probability: 100,
              status: 'open'
            }
          ]
        },
        {
          id: "in-progress",
          name: "In Progress",
          order: 2,
          deals: [
            {
              id: 102,
              name: "Coverage Question",
              amount: 0,
              company: "Johnson LLC",
              contact: "Amy Johnson",
              closingDate: "2025-04-20",
              stageId: "in-progress",
              probability: 100,
              status: 'open'
            }
          ]
        },
        {
          id: "on-hold",
          name: "On Hold",
          order: 3,
          deals: []
        },
        {
          id: "closed",
          name: "Closed",
          order: 4,
          deals: []
        },
        {
          id: "deferred",
          name: "Deferred",
          order: 5,
          deals: []
        },
        {
          id: "not-an-issue",
          name: "Not an Issue",
          order: 6,
          deals: []
        }
      ]
    },
    {
      id: "living-trust-flow",
      name: "Living Trust Flow",
      stages: [
        {
          id: "living-trust-presentation",
          name: "Living Trust Presentation",
          order: 1,
          deals: [
            {
              id: 201,
              name: "Family Trust Planning",
              amount: 3000,
              company: "Wilson Family",
              contact: "David Wilson",
              closingDate: "2025-06-10",
              stageId: "living-trust-presentation",
              probability: 20,
              status: 'open'
            }
          ]
        },
        {
          id: "estate-funded",
          name: "Estate Funded",
          order: 2,
          deals: []
        },
        {
          id: "notarizing-documents",
          name: "Notarizing Documents",
          order: 3,
          deals: [
            {
              id: 202,
              name: "Estate Planning Package",
              amount: 5000,
              company: "Davis Family",
              contact: "Richard Davis",
              closingDate: "2025-05-20",
              stageId: "notarizing-documents",
              probability: 80,
              status: 'open'
            }
          ]
        },
        {
          id: "preparation",
          name: "Preparation",
          order: 4,
          deals: []
        },
        {
          id: "needs-customer-application",
          name: "Needs Customer Application",
          order: 5,
          deals: []
        },
        {
          id: "packaging",
          name: "Packaging",
          order: 6,
          deals: []
        },
        {
          id: "cancelled",
          name: "Cancelled",
          order: 7,
          deals: []
        }
      ]
    },
    {
      id: "index-universal-life",
      name: "Index Universal Life",
      stages: [
        {
          id: "new-inquiry",
          name: "New Inquiry",
          order: 1,
          deals: [
            {
              id: 301,
              name: "IUL Premium Plan",
              amount: 12000,
              company: "Anderson Family",
              contact: "Mark Anderson",
              closingDate: "2025-07-15",
              stageId: "new-inquiry",
              probability: 20,
              status: 'open'
            }
          ]
        },
        {
          id: "follow-up-done",
          name: "Follow Up Done",
          order: 2,
          deals: [
            {
              id: 302,
              name: "Retirement Solution",
              amount: 8500,
              company: "Taylor Inc",
              contact: "Susan Taylor",
              closingDate: "2025-06-20",
              stageId: "follow-up-done",
              probability: 40,
              status: 'open'
            }
          ]
        },
        {
          id: "brochure-sent",
          name: "Brochure Sent",
          order: 3,
          deals: []
        },
        {
          id: "plan-selected",
          name: "Plan Selected",
          order: 4,
          deals: []
        },
        {
          id: "payment-done",
          name: "Payment Done",
          order: 5,
          deals: []
        },
        {
          id: "policy-sold",
          name: "Policy Sold",
          order: 6,
          deals: []
        },
        {
          id: "lost",
          name: "Lost",
          order: 7,
          deals: []
        }
      ]
    }
  ]);
  
  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px of movement required before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Create a map of pipeline icons
  const pipelineIcons = {
    "sales-pipeline": <BarChart3 className="h-4 w-4 mr-2" />,
    "customer-support": <HeartPulse className="h-4 w-4 mr-2" />,
    "living-trust-flow": <Landmark className="h-4 w-4 mr-2" />,
    "index-universal-life": <Home className="h-4 w-4 mr-2" />
  };
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const currentPipelineData = getActivePipeline();
    
    if (currentPipelineData) {
      // Find the deal being dragged
      let draggedDeal: Deal | null = null;
      for (const stage of currentPipelineData.stages) {
        const deal = stage.deals.find(d => d.id.toString() === active.id);
        if (deal) {
          draggedDeal = deal;
          break;
        }
      }
      setActiveItem(draggedDeal);
    }
  };
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    
    if (!over) return;
    
    const dealId = parseInt(active.id.toString());
    const newStageId = over.id.toString();
    
    const activePipelineData = getActivePipeline();
    if (!activePipelineData) return;
    
    // Find the current deal and its current stage
    let currentDeal: Deal | null = null;
    let currentStageId: string | null = null;
    
    for (const stage of activePipelineData.stages) {
      const deal = stage.deals.find(d => d.id === dealId);
      if (deal) {
        currentDeal = deal;
        currentStageId = stage.id;
        break;
      }
    }
    
    // Only update if the deal was moved to a different stage
    if (currentDeal && currentStageId && currentStageId !== newStageId) {
      // Only call API if we're using API data from React Query (not mock data)
      if (currentPipelineData && !pipelineError) {
        // Use the same mutation with targeted cache invalidation
        updateDealMutation.mutate({
          dealId,
          dealData: { stage_id: newStageId }
        });
      } else {
        // For mock data, just show a message that this is not implemented yet
        toast({
          title: "Info",
          description: "Drag and drop will be fully functional once connected to the database.",
        });
      }
    }
  };
  
  const getActivePipeline = () => {
    // Use API data if available, otherwise fall back to mock data
    if (currentPipelineData) {
      return currentPipelineData;
    }
    return mockPipelines.find(p => p.id === activePipeline);
  };
  
  const getPipelineSummary = (pipeline: Pipeline) => {
    let totalDeals = 0;
    let totalAmount = 0;
    
    pipeline.stages.forEach(stage => {
      totalDeals += stage.deals.length;
      stage.deals.forEach(deal => {
        totalAmount += deal.amount;
      });
    });
    
    return { totalDeals, totalAmount };
  };
  
  const getStageTotalAmount = (stage: PipelineStage) => {
    return stage.deals.reduce((sum, deal) => sum + deal.amount, 0);
  };
  
  // Handle clicking the edit option in the deal dropdown
  const handleEditDeal = (dealId: number) => {
    console.log('[HANDLE_EDIT_DEAL] === CLICKED - VERY FIRST LINE ===');
    console.log('[HANDLE_EDIT_DEAL] Deal ID to edit:', dealId);
    console.log('[HANDLE_EDIT_DEAL] Type of dealId:', typeof dealId);
    console.log('[HANDLE_EDIT_DEAL] Current state before processing:');
    console.log('[HANDLE_EDIT_DEAL] - isEditDealOpen:', isEditDealOpen);
    console.log('[HANDLE_EDIT_DEAL] - currentDealId:', currentDealId);
    console.log('[HANDLE_EDIT_DEAL] - addDealForm:', JSON.stringify(addDealForm, null, 2));
    
    console.log(`[EDIT_DEAL_CLICK] === STARTING EDIT DEAL PROCESS ===`);
    console.log(`[EDIT_DEAL_CLICK] Attempting to edit deal ID: ${dealId}`);
    console.log(`[EDIT_DEAL_CLICK] Type of dealId:`, typeof dealId);
    
    try {
      // Ensure dialog is closed and state is clean before starting
      console.log(`[EDIT_DEAL_CLICK] Step 0: Ensuring clean state...`);
      setIsEditDealOpen(false);
      setCurrentDealId(null);
      
      console.log(`[EDIT_DEAL_CLICK] Step 1: Getting active pipeline data...`);
      const currentPipelineData = getActivePipeline();
      console.log(`[EDIT_DEAL_CLICK] Current pipeline data:`, currentPipelineData);
      
      if (!currentPipelineData) {
        console.error(`[EDIT_DEAL_CLICK] ERROR: No current pipeline data found!`);
        return;
      }
      
      console.log(`[EDIT_DEAL_CLICK] Step 2: Searching for deal in ${currentPipelineData.stages.length} stages...`);
      
      // Find the deal to edit
      let dealToEdit: Deal | undefined;
      
      for (const stage of currentPipelineData.stages) {
        console.log(`[EDIT_DEAL_CLICK] Searching in stage "${stage.name}" with ${stage.deals.length} deals...`);
        const deal = stage.deals.find(d => d.id === dealId);
        if (deal) {
          dealToEdit = deal;
          console.log(`[EDIT_DEAL_CLICK] Found deal:`, JSON.stringify(deal, null, 2));
          break;
        }
      }
      
      if (!dealToEdit) {
        console.error(`[EDIT_DEAL_CLICK] ERROR: Deal with ID ${dealId} not found in any stage!`);
        return;
      }
      
      console.log(`[EDIT_DEAL_CLICK] Step 3: Looking up company and contact data...`);
      console.log(`[EDIT_DEAL_CLICK] Companies list:`, companiesList);
      console.log(`[EDIT_DEAL_CLICK] Contacts list:`, contactsList);
      
      // Find company_id and contact_id by matching names
      const companyId = companiesList?.find(c => c.company_name === dealToEdit!.company)?.id || null;
      const contactId = contactsList?.find(c => `${c.first_name} ${c.last_name}` === dealToEdit!.contact)?.id || null;
      
      console.log(`[EDIT_DEAL_CLICK] Found company ID: ${companyId} for company: "${dealToEdit.company}"`);
      console.log(`[EDIT_DEAL_CLICK] Found contact ID: ${contactId} for contact: "${dealToEdit.contact}"`);
      
      console.log(`[EDIT_DEAL_CLICK] Step 4: Processing closing date...`);
      console.log(`[EDIT_DEAL_CLICK] Original closing date:`, dealToEdit.closingDate);
      
      // Use the utility function to properly handle the date without timezone issues
      let formattedClosingDate = dealToEdit.closingDate;
      if (formattedClosingDate) {
        // If it's an ISO string with time, extract just the date part
        if (formattedClosingDate.includes('T')) {
          formattedClosingDate = formattedClosingDate.split('T')[0];
        }
        // Ensure the date is in YYYY-MM-DD format for the date input
        const parsedDate = parseLocalDate(formattedClosingDate);
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        formattedClosingDate = `${year}-${month}-${day}`;
      }
      console.log(`[EDIT_DEAL_CLICK] Formatted closing date:`, formattedClosingDate);
      
      console.log(`[EDIT_DEAL_CLICK] Step 5: Setting up form data...`);
      const formData = {
        name: dealToEdit.name,
        amount: dealToEdit.amount,
        company_id: companyId,
        contact_id: contactId,
        closingDate: formattedClosingDate,
        probability: dealToEdit.probability,
        stageId: dealToEdit.stageId
      };
      console.log(`[EDIT_DEAL_CLICK] Form data to set:`, JSON.stringify(formData, null, 2));
      
      console.log(`[EDIT_DEAL_CLICK] Step 6: Setting form state...`);
      console.log('[HANDLE_EDIT_DEAL] Setting dealToEdit and attempting to open dialog...');
      setAddDealForm(formData);
      
      console.log(`[EDIT_DEAL_CLICK] Step 7: Setting current deal ID...`);
      setCurrentDealId(dealId);
      
      console.log(`[EDIT_DEAL_CLICK] Step 8: Opening edit dialog...`);
      console.log('[HANDLE_EDIT_DEAL] About to call setIsEditDealOpen(true)...');
      setIsEditDealOpen(true);
      console.log('[HANDLE_EDIT_DEAL] setIsEditDealOpen(true) called successfully');
      
      console.log(`[EDIT_DEAL_CLICK] === EDIT DEAL PROCESS COMPLETED SUCCESSFULLY ===`);
      
    } catch (error) {
      console.error(`[EDIT_DEAL_CLICK] CRITICAL ERROR in handleEditDeal:`, error);
      console.error(`[EDIT_DEAL_CLICK] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      
      // Show user-friendly error
      toast({
        title: "Error",
        description: "Failed to open edit dialog. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle saving edited deal data
  const handleSaveEdit = () => {
    console.log(`[HANDLE_SAVE_EDIT] Starting save process...`);
    console.log(`[HANDLE_SAVE_EDIT] Current deal ID:`, currentDealId);
    console.log(`[HANDLE_SAVE_EDIT] Form data:`, addDealForm);
    
    if (!currentDealId) {
      console.error(`[HANDLE_SAVE_EDIT] No current deal ID found!`);
      toast({
        title: "Error",
        description: "No deal selected for editing.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate required fields
    if (!addDealForm.name.trim()) {
      toast({
        title: "Error",
        description: "Deal name is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (!addDealForm.stageId) {
      toast({
        title: "Error",
        description: "Please select a stage.",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare the update data with company_id and contact_id
    const updateData = {
      name: addDealForm.name.trim(),
      amount: addDealForm.amount,
      company_id: addDealForm.company_id,
      contact_id: addDealForm.contact_id,
      closing_date: addDealForm.closingDate,
      probability: addDealForm.probability,
      stage_id: addDealForm.stageId
    };
    
    console.log(`[HANDLE_SAVE_EDIT] Prepared update data:`, updateData);
    
    updateDealMutation.mutate({
      dealId: currentDealId,
      dealData: updateData
    });
  };
  
  // Handle delete deal
  const handleDeleteDeal = (dealId: number) => {
    const currentPipelineData = getActivePipeline();
    if (!currentPipelineData) return;
    
    // Find the deal to delete
    let dealToDelete: Deal | undefined;
    
    for (const stage of currentPipelineData.stages) {
      const deal = stage.deals.find(d => d.id === dealId);
      if (deal) {
        dealToDelete = deal;
        break;
      }
    }
    
    if (dealToDelete) {
      setDealToDelete(dealToDelete);
      setIsDeleteDialogOpen(true);
    }
  };

  // Handle confirming delete
  const handleConfirmDelete = () => {
    if (dealToDelete) {
      deleteDealMutation.mutate(dealToDelete.id);
    }
  };
  
  // Handle opening the add deal dialog
  const handleAddDealOpen = () => {
    const currentPipelineData = getActivePipeline();
    if (currentPipelineData && currentPipelineData.stages.length > 0) {
      // Set the default stage to the first stage in the pipeline
      setAddDealForm(prev => ({
        ...prev,
        stageId: currentPipelineData.stages[0].id
      }));
    }
    setIsAddDealOpen(true);
  };
  
  // Handle form field changes
  const handleFormChange = (field: keyof AddDealFormData, value: string | number | null) => {
    console.log(`[FORM_CHANGE] Field "${field}" changing to:`, value);
    console.log(`[FORM_CHANGE] Current form state before change:`, addDealForm);
    
    setAddDealForm(prev => {
      const newState = {
        ...prev,
        [field]: value
      };
      console.log(`[FORM_CHANGE] New form state after change:`, newState);
      return newState;
    });
  };
  
  // Handle adding a new deal
  const handleAddDeal = () => {
    if (!addDealForm.name.trim() || !addDealForm.stageId) {
      toast({
        title: "Error",
        description: "Please fill in the deal name and select a stage.",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare the deal data for the API
    const dealData: NewDealData = {
      name: addDealForm.name,
      amount: addDealForm.amount,
      company_id: addDealForm.company_id,
      contact_id: addDealForm.contact_id,
      closing_date: addDealForm.closingDate || undefined,
      stage_id: addDealForm.stageId,
      pipeline_id: activePipeline,
      probability: addDealForm.probability,
      status: 'open'
    };
    
    createDealMutation.mutate(dealData);
  };
  
  const currentPipeline = getActivePipeline();
  const summary = currentPipeline ? getPipelineSummary(currentPipeline) : { totalDeals: 0, totalAmount: 0 };
  
  // Reset form state
  const resetFormState = () => {
    // Get today's date in YYYY-MM-DD format without timezone issues
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    setAddDealForm({
      name: '',
      amount: 0,
      company_id: null,
      contact_id: null,
      closingDate: todayString,
      probability: 20,
      stageId: ''
    });
  };
  
  // CRITICAL: Debug logging to track data leakage issues
  useEffect(() => {
    console.log(`🔍 [PIPELINES_DEBUG] User session state:`, {
      currentUserId,
      profileId: profile?.id,
      isConfirmedAdmin,
      currentView,
      activePipeline,
      showAllDeals
    });
  }, [currentUserId, profile?.id, isConfirmedAdmin, currentView, activePipeline, showAllDeals]);

  // CRITICAL: Debug logging when pipeline data changes
  useEffect(() => {
    if (currentPipelineData) {
      const totalDeals = currentPipelineData.stages?.reduce((sum, stage) => sum + (stage.deals?.length || 0), 0) || 0;
      console.log(`🔍 [PIPELINE_DATA_DEBUG] Data loaded for user ${currentUserId}:`, {
        pipelineId: currentPipelineData.id,
        pipelineName: currentPipelineData.name,
        totalDeals,
        currentView,
        isAdmin: isConfirmedAdmin,
        queryKey: ['pipeline', activePipeline, currentView, currentUserId]
      });
      
      // Log first few deals for debugging ownership
      if (totalDeals > 0) {
        const firstFewDeals = currentPipelineData.stages
          ?.flatMap(stage => stage.deals || [])
          .slice(0, 3)
          .map(deal => ({ id: deal.id, name: deal.name }));
        console.log(`🔍 [PIPELINE_DATA_DEBUG] Sample deals:`, firstFewDeals);
      }
    }
  }, [currentPipelineData, currentUserId, currentView, isConfirmedAdmin, activePipeline]);

  return (
    <div className="flex flex-col h-full">
      <div className="py-4 px-5 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Pipelines</h1>
        <p className="text-muted-foreground">
          Manage your deal pipelines and track opportunities.
        </p>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Vertical side tabs */}
        <div className="w-64 bg-slate-50 dark:bg-slate-900 p-4 border-r border-gray-200 dark:border-gray-800 min-h-0">
          <h2 className="font-medium text-sm text-muted-foreground mb-3">PIPELINE VIEWS</h2>
          <div className="space-y-1">
            {pipelinesLoading ? (
              <div className="text-sm text-muted-foreground">Loading pipelines...</div>
            ) : pipelinesError ? (
              <div className="text-sm text-red-500">Error loading pipelines</div>
            ) : (pipelinesList || mockPipelines).map(pipeline => (
              <Button
                key={pipeline.id}
                variant={activePipeline === pipeline.id ? "secondary" : "ghost"}
                className="w-full justify-start text-sm font-normal"
                onClick={() => setActivePipeline(pipeline.id)}
              >
                {pipelineIcons[pipeline.id as keyof typeof pipelineIcons]}
                {pipeline.name}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {pipelineLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-muted-foreground">Loading pipeline data...</div>
            </div>
          ) : pipelineError ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-red-500">Error loading pipeline data</div>
            </div>
          ) : currentPipeline && (
            <>
              <div className="p-4 bg-background border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">{currentPipeline.name}</h2>
                      {!isLoadingProfile && !!profile && isConfirmedAdmin && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4" />
                          <span className="text-muted-foreground">My Deals</span>
                          <Switch
                            checked={showAllDeals}
                            onCheckedChange={setShowAllDeals}
                            className="data-[state=checked]:bg-blue-600"
                          />
                          <span className="text-muted-foreground">All Deals</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {summary.totalDeals} deals · ${summary.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleAddDealOpen}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Deal
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-x-auto p-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex gap-4">
                    {currentPipeline.stages.map(stage => {
                      const stageDeals = stage.deals.filter(deal => deal.stageId === stage.id);
                      return (
                        <StageColumn
                          key={stage.id}
                          stage={stage}
                          stageTotal={getStageTotalAmount(stage)}
                          deals={stageDeals}
                          onEdit={handleEditDeal}
                          onDelete={handleDeleteDeal}
                        />
                      );
                    })}
                  </div>
                  <DragOverlay>
                    {activeItem && <DealCard deal={activeItem} onEdit={handleEditDeal} onDelete={handleDeleteDeal} />}
                  </DragOverlay>
                </DndContext>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Add Deal Dialog */}
      <Dialog open={isAddDealOpen} onOpenChange={setIsAddDealOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
            <DialogDescription>
              Create a new deal for the {currentPipeline?.name} pipeline.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Deal Name
              </Label>
              <Input
                id="name"
                className="col-span-3"
                value={addDealForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                className="col-span-3"
                value={addDealForm.amount}
                onChange={(e) => handleFormChange('amount', parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <Select 
                value={addDealForm.company_id?.toString() || undefined} 
                onValueChange={(value) => handleFormChange('company_id', value ? parseInt(value) : null)}
                disabled={companiesLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={
                    companiesLoading 
                      ? "Loading companies..." 
                      : (companiesList && companiesList.length > 0) 
                        ? "Select a company" 
                        : isConfirmedAdmin 
                          ? "No companies available" 
                          : "No companies found (check your permissions)"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {companiesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading companies...
                    </SelectItem>
                  ) : companiesList && companiesList.length > 0 ? (
                    companiesList.map(company => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.company_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      {isConfirmedAdmin 
                        ? "No companies available" 
                        : "No companies found - you may need to create one first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact" className="text-right">
                Contact
              </Label>
              <Select 
                value={addDealForm.contact_id?.toString() || undefined} 
                onValueChange={(value) => handleFormChange('contact_id', value ? parseInt(value) : null)}
                disabled={contactsLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={
                    contactsLoading 
                      ? "Loading contacts..." 
                      : (contactsList && contactsList.length > 0) 
                        ? "Select a contact" 
                        : isConfirmedAdmin 
                          ? "No contacts available" 
                          : "No contacts found (check your permissions)"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {contactsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading contacts...
                    </SelectItem>
                  ) : contactsList && contactsList.length > 0 ? (
                    contactsList.map(contact => (
                      <SelectItem key={contact.id} value={contact.id.toString()}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      {isConfirmedAdmin 
                        ? "No contacts available" 
                        : "No contacts found - you may need to create one first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="closingDate" className="text-right">
                Closing Date
              </Label>
              <Input
                id="closingDate"
                type="date"
                className="col-span-3"
                value={addDealForm.closingDate}
                onChange={(e) => handleFormChange('closingDate', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="probability" className="text-right">
                Probability (%)
              </Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                className="col-span-3"
                value={addDealForm.probability}
                onChange={(e) => handleFormChange('probability', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stage" className="text-right">
                Stage
              </Label>
              <Select 
                value={addDealForm.stageId} 
                onValueChange={(value) => handleFormChange('stageId', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  {currentPipeline?.stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDealOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDeal} disabled={createDealMutation.isPending}>
              {createDealMutation.isPending ? "Creating..." : "Add Deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Deal Dialog - FULLY FUNCTIONAL VERSION */}
      <Dialog 
        open={isEditDealOpen} 
        modal={true}
        onOpenChange={(open) => {
          console.log(`[EDIT_DIALOG_FULL] Dialog onOpenChange called with:`, open);
          console.log(`[EDIT_DIALOG_FULL] Current state - isEditDealOpen:`, isEditDealOpen, 'currentDealId:', currentDealId);
          
          if (!open) {
            console.log(`[EDIT_DIALOG_FULL] Dialog is being closed`);
            // Clean up state when dialog closes
            setIsEditDealOpen(false);
            setCurrentDealId(null);
            resetFormState();
          } else if (!isEditDealOpen) {
            // Only set to open if it's not already open (prevent duplicate opens)
            console.log(`[EDIT_DIALOG_FULL] Dialog is being opened`);
            setIsEditDealOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
            <DialogDescription>
              Update the deal information for the {currentPipeline?.name} pipeline.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Deal Name
              </Label>
              <Input
                ref={nameInputRef}
                id="edit-name"
                className="col-span-3"
                value={addDealForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Enter deal name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="edit-amount"
                type="number"
                className="col-span-3"
                value={addDealForm.amount}
                onChange={(e) => handleFormChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="Enter amount"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-probability" className="text-right">
                Probability (%)
              </Label>
              <Input
                id="edit-probability"
                type="number"
                min="0"
                max="100"
                className="col-span-3"
                value={addDealForm.probability}
                onChange={(e) => handleFormChange('probability', parseInt(e.target.value) || 0)}
                placeholder="Enter probability"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-closingDate" className="text-right">
                Closing Date
              </Label>
              <Input
                id="edit-closingDate"
                type="date"
                className="col-span-3"
                value={addDealForm.closingDate}
                onChange={(e) => handleFormChange('closingDate', e.target.value)}
              />
            </div>
            
            {/* Stage Select - Step B: Add back Stage Select first */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-stage" className="text-right">
                Stage
              </Label>
              <Select 
                value={addDealForm.stageId} 
                onValueChange={(value) => handleFormChange('stageId', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  {currentPipeline?.stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Company Select - Step C: Add back Company Select */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-company" className="text-right">
                Company
              </Label>
              <Select 
                value={addDealForm.company_id?.toString() || undefined} 
                onValueChange={(value) => handleFormChange('company_id', value ? parseInt(value) : null)}
                disabled={companiesLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={
                    companiesLoading 
                      ? "Loading companies..." 
                      : (companiesList && companiesList.length > 0) 
                        ? "Select a company" 
                        : isConfirmedAdmin 
                          ? "No companies available" 
                          : "No companies found (check your permissions)"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {companiesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading companies...
                    </SelectItem>
                  ) : companiesList && companiesList.length > 0 ? (
                    companiesList.map(company => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.company_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      {isConfirmedAdmin 
                        ? "No companies available" 
                        : "No companies found - you may need to create one first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Contact Select - Step D: Add back Contact Select */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-contact" className="text-right">
                Contact
              </Label>
              <Select 
                value={addDealForm.contact_id?.toString() || undefined} 
                onValueChange={(value) => handleFormChange('contact_id', value ? parseInt(value) : null)}
                disabled={contactsLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={
                    contactsLoading 
                      ? "Loading contacts..." 
                      : (contactsList && contactsList.length > 0) 
                        ? "Select a contact" 
                        : isConfirmedAdmin 
                          ? "No contacts available" 
                          : "No contacts found (check your permissions)"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {contactsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading contacts...
                    </SelectItem>
                  ) : contactsList && contactsList.length > 0 ? (
                    contactsList.map(contact => (
                      <SelectItem key={contact.id} value={contact.id.toString()}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      {isConfirmedAdmin 
                        ? "No contacts available" 
                        : "No contacts found - you may need to create one first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              console.log(`[EDIT_DIALOG_FULL] Cancel button clicked`);
              setIsEditDealOpen(false);
              setCurrentDealId(null);
              resetFormState();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={updateDealMutation.isPending || !addDealForm.name.trim() || !addDealForm.stageId}
            >
              {updateDealMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Deal Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the deal "{dealToDelete?.name}" 
              and remove it from the pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={deleteDealMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteDealMutation.isPending ? "Deleting..." : "Delete Deal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PipelinesPage;