import React, { useState, useRef } from 'react';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "../components/ui/tabs";
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Plus, 
  MoreHorizontal,
  Users,
  Building,
  DollarSign,
  Calendar,
  BarChart3,
  HeartPulse,
  Home,
  Landmark
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";

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
  company: string;
  contact: string;
  closingDate: string;
  probability: number;
  stageId: string;
}

// Sortable deal card component
const SortableDealCard: React.FC<{ deal: Deal }> = ({ deal }) => {
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
      <DealCard deal={deal} />
    </div>
  );
};

// Component to display each card in the board
const DealCard: React.FC<{ deal: Deal }> = ({ deal }) => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(deal.amount);
  
  const dueDate = new Date(deal.closingDate);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(dueDate);
  
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
              <DropdownMenuItem className="edit-deal" data-id={deal.id}>Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="delete-deal" data-id={deal.id}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="text-sm mt-1">{deal.company}</CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="mr-1 h-3 w-3" />
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
}> = ({ stage, stageTotal, deals }) => {
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
          <SortableDealCard key={deal.id} deal={deal} />
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
  const [currentDealId, setCurrentDealId] = useState<number | null>(null);
  const [addDealForm, setAddDealForm] = useState<AddDealFormData>({
    name: '',
    amount: 0,
    company: '',
    contact: '',
    closingDate: new Date().toISOString().split('T')[0],
    probability: 20,
    stageId: ''
  });
  const [pipelines, setPipelines] = useState<Pipeline[]>([
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
    const activePipelineData = pipelines.find(p => p.id === activePipeline);
    
    if (!activePipelineData) return;
    
    // Find the deal across all stages
    let foundDeal: Deal | undefined;
    
    for (const stage of activePipelineData.stages) {
      const deal = stage.deals.find(d => d.id.toString() === active.id);
      if (deal) {
        foundDeal = deal;
        break;
      }
    }
    
    if (foundDeal) {
      setActiveItem(foundDeal);
    }
  };
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    setPipelines(currentPipelines => {
      // Create a deep copy of the current pipelines
      const newPipelines = JSON.parse(JSON.stringify(currentPipelines)) as Pipeline[];
      const currentPipeline = newPipelines.find(p => p.id === activePipeline);
      
      if (!currentPipeline) return currentPipelines;
      
      // Find the deal and its current stage
      let draggedDeal: Deal | undefined;
      let sourceStageId: string | undefined;
      
      // Find the deal in any stage
      for (const stage of currentPipeline.stages) {
        const dealIndex = stage.deals.findIndex(d => d.id.toString() === active.id);
        if (dealIndex !== -1) {
          draggedDeal = { ...stage.deals[dealIndex] };
          sourceStageId = stage.id;
          stage.deals.splice(dealIndex, 1); // Remove from source
          break;
        }
      }
      
      if (!draggedDeal) return currentPipelines;
      
      // Get the destination stage id from the over.id directly
      // This works because we've set up each stage column as a droppable with its stage.id
      let targetStageId = over.id.toString();
      
      // Find the destination stage
      const destinationStage = currentPipeline.stages.find(s => s.id === targetStageId);
      
      if (destinationStage) {
        // Update the deal's stageId to match the destination
        draggedDeal.stageId = destinationStage.id;
        
        // Add the deal to the destination stage
        destinationStage.deals.push(draggedDeal);
      } else if (sourceStageId) {
        // If destination not found, put back in source stage
        const sourceStage = currentPipeline.stages.find(s => s.id === sourceStageId);
        if (sourceStage) {
          sourceStage.deals.push(draggedDeal);
        }
      }
      
      return newPipelines;
    });
    
    setActiveItem(null);
  };
  
  const getActivePipeline = () => {
    return pipelines.find(p => p.id === activePipeline);
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
    const currentPipelineData = getActivePipeline();
    if (!currentPipelineData) return;
    
    // Find the deal to edit
    let dealToEdit: Deal | undefined;
    
    for (const stage of currentPipelineData.stages) {
      const deal = stage.deals.find(d => d.id === dealId);
      if (deal) {
        dealToEdit = deal;
        break;
      }
    }
    
    if (dealToEdit) {
      // Set up the form with the deal's current data
      setAddDealForm({
        name: dealToEdit.name,
        amount: dealToEdit.amount,
        company: dealToEdit.company,
        contact: dealToEdit.contact,
        closingDate: dealToEdit.closingDate,
        probability: dealToEdit.probability,
        stageId: dealToEdit.stageId
      });
      
      setCurrentDealId(dealId);
      setIsEditDealOpen(true);
    }
  };
  
  // Handle saving edited deal data
  const handleSaveEdit = () => {
    if (!currentDealId || !addDealForm.name || !addDealForm.stageId) return;
    
    setPipelines(currentPipelines => {
      // Create a deep copy of the current pipelines
      const newPipelines = JSON.parse(JSON.stringify(currentPipelines)) as Pipeline[];
      const currentPipeline = newPipelines.find(p => p.id === activePipeline);
      
      if (!currentPipeline) return currentPipelines;
      
      // Find the deal to update
      for (const stage of currentPipeline.stages) {
        const dealIndex = stage.deals.findIndex(d => d.id === currentDealId);
        if (dealIndex !== -1) {
          // If deal needs to move stages
          if (stage.id !== addDealForm.stageId) {
            // Remove from current stage
            const dealToMove = { ...stage.deals[dealIndex] };
            stage.deals.splice(dealIndex, 1);
            
            // Update deal properties
            dealToMove.name = addDealForm.name;
            dealToMove.amount = addDealForm.amount;
            dealToMove.company = addDealForm.company;
            dealToMove.contact = addDealForm.contact;
            dealToMove.closingDate = addDealForm.closingDate;
            dealToMove.probability = addDealForm.probability;
            dealToMove.stageId = addDealForm.stageId;
            
            // Add to new stage
            const newStage = currentPipeline.stages.find(s => s.id === addDealForm.stageId);
            if (newStage) {
              newStage.deals.push(dealToMove);
            } else {
              // If target stage not found, add back to original
              stage.deals.push(dealToMove);
            }
          } else {
            // Just update in place
            stage.deals[dealIndex] = {
              ...stage.deals[dealIndex],
              name: addDealForm.name,
              amount: addDealForm.amount,
              company: addDealForm.company,
              contact: addDealForm.contact,
              closingDate: addDealForm.closingDate,
              probability: addDealForm.probability
            };
          }
          break;
        }
      }
      
      return newPipelines;
    });
    
    // Reset form and close dialog
    setAddDealForm({
      name: '',
      amount: 0,
      company: '',
      contact: '',
      closingDate: new Date().toISOString().split('T')[0],
      probability: 20,
      stageId: ''
    });
    setCurrentDealId(null);
    setIsEditDealOpen(false);
  };
  
  // Handle delete deal
  const handleDeleteDeal = (dealId: number) => {
    setPipelines(currentPipelines => {
      // Create a deep copy of the current pipelines
      const newPipelines = JSON.parse(JSON.stringify(currentPipelines)) as Pipeline[];
      const currentPipeline = newPipelines.find(p => p.id === activePipeline);
      
      if (!currentPipeline) return currentPipelines;
      
      // Find and remove the deal
      for (const stage of currentPipeline.stages) {
        const dealIndex = stage.deals.findIndex(d => d.id === dealId);
        if (dealIndex !== -1) {
          stage.deals.splice(dealIndex, 1);
          break;
        }
      }
      
      return newPipelines;
    });
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
  const handleFormChange = (field: keyof AddDealFormData, value: string | number) => {
    setAddDealForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle adding a new deal
  const handleAddDeal = () => {
    if (!addDealForm.name || !addDealForm.stageId) return;
    
    setPipelines(currentPipelines => {
      // Create a deep copy of the current pipelines
      const newPipelines = JSON.parse(JSON.stringify(currentPipelines)) as Pipeline[];
      const currentPipeline = newPipelines.find(p => p.id === activePipeline);
      
      if (!currentPipeline) return currentPipelines;
      
      // Find the destination stage by ID
      const destinationStage = currentPipeline.stages.find(s => s.id === addDealForm.stageId);
      
      if (destinationStage) {
        // Create a new deal
        const newDeal: Deal = {
          id: Date.now(), // Use timestamp as a unique ID
          name: addDealForm.name,
          amount: addDealForm.amount,
          company: addDealForm.company,
          contact: addDealForm.contact,
          closingDate: addDealForm.closingDate,
          stageId: addDealForm.stageId,
          probability: addDealForm.probability,
          status: 'open'
        };
        
        // Add the deal to the stage
        destinationStage.deals.push(newDeal);
      }
      
      return newPipelines;
    });
    
    // Reset the form and close the dialog
    setAddDealForm({
      name: '',
      amount: 0,
      company: '',
      contact: '',
      closingDate: new Date().toISOString().split('T')[0],
      probability: 20,
      stageId: ''
    });
    setIsAddDealOpen(false);
  };
  
  const currentPipeline = getActivePipeline();
  const summary = currentPipeline ? getPipelineSummary(currentPipeline) : { totalDeals: 0, totalAmount: 0 };
  
  // Add event listener for dropdown actions
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check for edit button click
      if (target.classList.contains('edit-deal') || target.closest('.edit-deal')) {
        const element = target.classList.contains('edit-deal') ? target : target.closest('.edit-deal');
        const dealId = element?.getAttribute('data-id');
        if (dealId) {
          handleEditDeal(parseInt(dealId));
        }
      }
      
      // Check for delete button click
      if (target.classList.contains('delete-deal') || target.closest('.delete-deal')) {
        const element = target.classList.contains('delete-deal') ? target : target.closest('.delete-deal');
        const dealId = element?.getAttribute('data-id');
        if (dealId) {
          handleDeleteDeal(parseInt(dealId));
        }
      }
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [activePipeline, pipelines]);
  
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
            {pipelines.map(pipeline => (
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
          {currentPipeline && (
            <>
              <div className="p-4 bg-background border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold">{currentPipeline.name}</h2>
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
                        />
                      );
                    })}
                  </div>
                  <DragOverlay>
                    {activeItem && <DealCard deal={activeItem} />}
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
              <Input
                id="company"
                className="col-span-3"
                value={addDealForm.company}
                onChange={(e) => handleFormChange('company', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact" className="text-right">
                Contact
              </Label>
              <Input
                id="contact"
                className="col-span-3"
                value={addDealForm.contact}
                onChange={(e) => handleFormChange('contact', e.target.value)}
              />
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
            <Button onClick={handleAddDeal}>
              Add Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Deal Dialog */}
      <Dialog open={isEditDealOpen} onOpenChange={setIsEditDealOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
            <DialogDescription>
              Edit deal information in the {currentPipeline?.name} pipeline.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Deal Name
              </Label>
              <Input
                id="edit-name"
                className="col-span-3"
                value={addDealForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
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
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-company" className="text-right">
                Company
              </Label>
              <Input
                id="edit-company"
                className="col-span-3"
                value={addDealForm.company}
                onChange={(e) => handleFormChange('company', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-contact" className="text-right">
                Contact
              </Label>
              <Input
                id="edit-contact"
                className="col-span-3"
                value={addDealForm.contact}
                onChange={(e) => handleFormChange('contact', e.target.value)}
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
              />
            </div>
            
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDealOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PipelinesPage;