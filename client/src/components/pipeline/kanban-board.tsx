import React, { useState } from 'react';
import { useSensors, useSensor, PointerSensor, KeyboardSensor, DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Policy, PipelineStage } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import PolicyCard from '@/components/shared/policy-card';

interface KanbanBoardProps {
  stages: PipelineStage[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ stages: initialStages }) => {
  const [stages, setStages] = useState<PipelineStage[]>(initialStages);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updatePolicyStage = useMutation({
    mutationFn: async ({ policyId, stage }: { policyId: number, stage: string }) => {
      const response = await apiRequest('PATCH', `/api/policies/${policyId}/stage`, { stage });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline'] });
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    // If this is a policy being moved to a new stage
    if (activeId.includes('policy-') && overId.includes('stage-')) {
      const policyId = Number(activeId.replace('policy-', ''));
      const newStage = overId.replace('stage-', '');
      
      // Find the policy and current stage
      let foundPolicy: Policy | undefined;
      let currentStageId: string | undefined;
      
      stages.forEach(stage => {
        const policy = stage.policies.find(p => p.id === policyId);
        if (policy) {
          foundPolicy = policy;
          currentStageId = stage.id;
        }
      });
      
      if (foundPolicy && currentStageId !== newStage) {
        // Update the local state optimistically
        const newStages = stages.map(stage => {
          if (stage.id === currentStageId) {
            return {
              ...stage,
              policies: stage.policies.filter(p => p.id !== policyId)
            };
          }
          if (stage.id === newStage) {
            return {
              ...stage,
              policies: [...stage.policies, {...foundPolicy!, stage: newStage}]
            };
          }
          return stage;
        });
        
        setStages(newStages);
        
        // Send the update to the server
        updatePolicyStage.mutate({ policyId, stage: newStage });
      }
    }
  };

  return (
    <div className="flex-1 overflow-x-auto">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-6 p-6">
          {stages.map((stage) => (
            <div key={stage.id} className="w-72 flex-shrink-0">
              <Card>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{stage.name}</CardTitle>
                    <div className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                      {stage.policies.length}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  <SortableContext 
                    items={stage.policies.map(policy => `policy-${policy.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div 
                      id={`stage-${stage.id}`}
                      className="kanban-column min-h-[400px] space-y-3"
                    >
                      {stage.policies.map((policy) => (
                        <div key={`policy-${policy.id}`} id={`policy-${policy.id}`}>
                          <PolicyCard 
                            policy={policy}
                            isDraggable={true}
                          />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
