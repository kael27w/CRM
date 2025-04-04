import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Policy } from '@/types';
import PolicyCard from '@/components/shared/policy-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';

const Policies: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: policies, isLoading } = useQuery<Policy[]>({
    queryKey: ['/api/policies'],
  });

  const filteredPolicies = policies?.filter(policy => {
    const matchesSearch = policy.policyNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || policy.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Policy Manager</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track and manage all insurance policies</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Policy
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by policy number"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-500" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Policy Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="term">Term Life</SelectItem>
              <SelectItem value="whole">Whole Life</SelectItem>
              <SelectItem value="universal">Universal Life</SelectItem>
              <SelectItem value="variable">Variable Life</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="lapsed">Lapsed</SelectItem>
              <SelectItem value="paid-up">Paid-up</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-lg h-48"></div>
          ))}
        </div>
      ) : filteredPolicies?.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No policies found</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPolicies?.map(policy => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onClick={() => console.log('View policy', policy.id)}
              onViewDetails={() => console.log('View policy details', policy.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Policies;
