import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  MoreHorizontal,
  Users,
  Building,
  DollarSign,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Mark as Won</DropdownMenuItem>
              <DropdownMenuItem>Mark as Lost</DropdownMenuItem>
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
  stageTotal: number
}> = ({ stage, stageTotal }) => {
  return (
    <div className="w-72 shrink-0 rounded-md bg-slate-100 dark:bg-slate-800 p-3">
      <div className="mb-3 flex justify-between items-center">
        <div>
          <h3 className="font-medium">{stage.name}</h3>
          <p className="text-sm text-muted-foreground">
            {stage.deals.length} deals · ${stageTotal.toLocaleString()}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        {stage.deals.map(deal => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
};

const PipelinesPage: React.FC = () => {
  const [activePipeline, setActivePipeline] = useState("life-insurance");
  
  // Sample data - this will be replaced with actual API data
  const samplePipelines: Pipeline[] = [
    {
      id: "life-insurance",
      name: "Life Insurance",
      stages: [
        {
          id: "lead-qualification",
          name: "Lead Qualification",
          order: 1,
          deals: [
            {
              id: 1,
              name: "Term Life 20 - Barnes Family",
              amount: 5000,
              company: "Acme Corp",
              contact: "Sarah Johnson",
              closingDate: "2025-05-15",
              stageId: "lead-qualification",
              probability: 20,
              status: 'open'
            },
            {
              id: 2,
              name: "Whole Life Plan - Robert T.",
              amount: 8500,
              company: "TechStart Inc",
              contact: "Robert Thompson",
              closingDate: "2025-04-30",
              stageId: "lead-qualification",
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
              name: "Family Protection Plan",
              amount: 8000,
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
          name: "Proposal",
          order: 3,
          deals: [
            {
              id: 4,
              name: "Executive Life Coverage",
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
          id: "underwriting",
          name: "Underwriting",
          order: 4,
          deals: [
            {
              id: 5,
              name: "Premium Life Plan",
              amount: 12000,
              company: "Medical Solutions",
              contact: "Lisa Davis",
              closingDate: "2025-04-20",
              stageId: "underwriting",
              probability: 80,
              status: 'open'
            }
          ]
        },
        {
          id: "policy-delivery",
          name: "Policy Delivery",
          order: 5,
          deals: []
        }
      ]
    },
    {
      id: "health-insurance",
      name: "Health Insurance",
      stages: [
        {
          id: "initial-contact",
          name: "Initial Contact",
          order: 1,
          deals: [
            {
              id: 6,
              name: "Family Health Plan",
              amount: 4200,
              company: "Smith Family",
              contact: "John Smith",
              closingDate: "2025-05-05",
              stageId: "initial-contact",
              probability: 25,
              status: 'open'
            }
          ]
        },
        {
          id: "coverage-review",
          name: "Coverage Review",
          order: 2,
          deals: []
        },
        {
          id: "quote-preparation",
          name: "Quote Preparation",
          order: 3,
          deals: [
            {
              id: 7,
              name: "Small Business Health Plan",
              amount: 15000,
              company: "Corner Cafe",
              contact: "Mary Wilson",
              closingDate: "2025-06-10",
              stageId: "quote-preparation",
              probability: 55,
              status: 'open'
            }
          ]
        },
        {
          id: "application",
          name: "Application",
          order: 4,
          deals: []
        },
        {
          id: "closed-won",
          name: "Closed Won",
          order: 5,
          deals: []
        }
      ]
    },
    {
      id: "property-insurance",
      name: "Property Insurance",
      stages: [
        {
          id: "lead-in",
          name: "Lead In",
          order: 1,
          deals: [
            {
              id: 8,
              name: "Home Insurance Bundle",
              amount: 3000,
              company: "Johnson Residence",
              contact: "Peter Johnson",
              closingDate: "2025-05-20",
              stageId: "lead-in",
              probability: 30,
              status: 'open'
            }
          ]
        },
        {
          id: "property-assessment",
          name: "Property Assessment",
          order: 2,
          deals: []
        },
        {
          id: "risk-evaluation",
          name: "Risk Evaluation",
          order: 3,
          deals: [
            {
              id: 9,
              name: "Commercial Property Coverage",
              amount: 18000,
              company: "Downtown Retail",
              contact: "James Anderson",
              closingDate: "2025-06-15",
              stageId: "risk-evaluation",
              probability: 50,
              status: 'open'
            }
          ]
        },
        {
          id: "quote-presentation",
          name: "Quote Presentation",
          order: 4,
          deals: []
        },
        {
          id: "binding-coverage",
          name: "Binding Coverage",
          order: 5,
          deals: []
        }
      ]
    },
    {
      id: "auto-insurance",
      name: "Auto Insurance",
      stages: [
        {
          id: "prospect-identified",
          name: "Prospect Identified",
          order: 1,
          deals: [
            {
              id: 10,
              name: "Family Auto Coverage",
              amount: 2500,
              company: "Miller Family",
              contact: "Susan Miller",
              closingDate: "2025-05-12",
              stageId: "prospect-identified",
              probability: 20,
              status: 'open'
            }
          ]
        },
        {
          id: "driver-review",
          name: "Driver Review",
          order: 2,
          deals: []
        },
        {
          id: "coverage-options",
          name: "Coverage Options",
          order: 3,
          deals: [
            {
              id: 11,
              name: "Fleet Insurance",
              amount: 22000,
              company: "City Delivery",
              contact: "David Clark",
              closingDate: "2025-06-20",
              stageId: "coverage-options",
              probability: 65,
              status: 'open'
            }
          ]
        },
        {
          id: "policy-issuance",
          name: "Policy Issuance",
          order: 4,
          deals: []
        },
        {
          id: "completed",
          name: "Completed",
          order: 5,
          deals: []
        }
      ]
    },
    {
      id: "business-insurance",
      name: "Business Insurance",
      stages: [
        {
          id: "discovery",
          name: "Discovery",
          order: 1,
          deals: [
            {
              id: 12,
              name: "Liability Coverage",
              amount: 6500,
              company: "Tech Solutions",
              contact: "Mark Davis",
              closingDate: "2025-05-25",
              stageId: "discovery",
              probability: 35,
              status: 'open'
            }
          ]
        },
        {
          id: "risk-assessment",
          name: "Risk Assessment",
          order: 2,
          deals: []
        },
        {
          id: "solution-design",
          name: "Solution Design",
          order: 3,
          deals: [
            {
              id: 13,
              name: "Business Continuity Plan",
              amount: 35000,
              company: "Manufacturing Inc",
              contact: "Patricia Wong",
              closingDate: "2025-07-10",
              stageId: "solution-design",
              probability: 70,
              status: 'open'
            }
          ]
        },
        {
          id: "negotiation",
          name: "Negotiation",
          order: 4,
          deals: []
        },
        {
          id: "implementation",
          name: "Implementation",
          order: 5,
          deals: []
        }
      ]
    }
  ];

  // Calculate totals for each pipeline
  const getPipelineSummary = (pipeline: Pipeline) => {
    const totalDeals = pipeline.stages.reduce((sum, stage) => sum + stage.deals.length, 0);
    const totalValue = pipeline.stages.reduce(
      (sum, stage) => sum + stage.deals.reduce((stageSum, deal) => stageSum + deal.amount, 0), 
      0
    );
    
    return { totalDeals, totalValue };
  };

  // Get currently viewed pipeline
  const currentPipeline = samplePipelines.find(p => p.id === activePipeline) || samplePipelines[0];
  
  // Calculate total amount for each stage
  const getStageTotalAmount = (stage: PipelineStage) => {
    return stage.deals.reduce((sum, deal) => sum + deal.amount, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Pipelines</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your sales and partner pipelines
          </p>
        </div>
        <Button className="flex items-center">
          <Plus className="mr-2 h-4 w-4" /> New Deal
        </Button>
      </div>
      
      <Tabs value={activePipeline} onValueChange={setActivePipeline} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            {samplePipelines.map(pipeline => {
              const { totalDeals, totalValue } = getPipelineSummary(pipeline);
              return (
                <TabsTrigger key={pipeline.id} value={pipeline.id} className="px-4 py-2">
                  <span className="mr-2">{pipeline.name}</span>
                  <Badge variant="secondary" className="ml-1">
                    {totalDeals} · ${totalValue.toLocaleString()}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Pipeline
          </Button>
        </div>
        
        {samplePipelines.map(pipeline => (
          <TabsContent key={pipeline.id} value={pipeline.id} className="m-0">
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {pipeline.stages.map(stage => (
                <StageColumn 
                  key={stage.id} 
                  stage={stage} 
                  stageTotal={getStageTotalAmount(stage)} 
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default PipelinesPage;