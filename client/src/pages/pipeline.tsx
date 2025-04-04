import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PipelineStage } from '@/types';
import KanbanBoard from '@/components/pipeline/kanban-board';

const Pipeline: React.FC = () => {
  const { data: pipelineData, isLoading, error } = useQuery<PipelineStage[]>({
    queryKey: ['/api/pipeline'],
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Pipeline</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track and manage your policies through their lifecycle</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse">
          <div className="flex space-x-6 p-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-lg h-[600px]"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-red-500">Error loading pipeline data</div>
      ) : !pipelineData ? (
        <div className="text-slate-500 dark:text-slate-400">No pipeline data available</div>
      ) : (
        <KanbanBoard stages={pipelineData} />
      )}
    </div>
  );
};

export default Pipeline;
