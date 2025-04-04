import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  FileText, 
  Shield, 
  Umbrella, 
  Heart, 
  LifeBuoy,
  Clock
} from 'lucide-react';
import { Policy } from '@/types';
import { formatCurrency } from '@/lib/utils/format-currency';
import { format } from 'date-fns';

interface PolicyCardProps {
  policy: Policy;
  onClick?: () => void;
  onViewDetails?: () => void;
  isDraggable?: boolean;
}

const PolicyCard: React.FC<PolicyCardProps> = ({ 
  policy, 
  onClick, 
  onViewDetails,
  isDraggable = false
}) => {
  const getPolicyIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'term':
        return <Clock className="h-6 w-6 text-blue-500" />;
      case 'whole':
        return <LifeBuoy className="h-6 w-6 text-emerald-500" />;
      case 'universal':
        return <Shield className="h-6 w-6 text-purple-500" />;
      case 'variable':
        return <Umbrella className="h-6 w-6 text-amber-500" />;
      default:
        return <FileText className="h-6 w-6 text-slate-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'lapsed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'paid-up':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return '';
    }
  };

  return (
    <Card 
      className={`overflow-hidden ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {getPolicyIcon(policy.type)}
          </div>
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                {policy.type} Life
              </h3>
              <Badge 
                variant="secondary"
                className={getStatusBadgeVariant(policy.status)}
              >
                {policy.status}
              </Badge>
            </div>
            <div className="mt-1 flex flex-col text-xs text-slate-500 dark:text-slate-400">
              <span>Policy #: {policy.policyNumber}</span>
              <span>Coverage: {formatCurrency(policy.coverageAmount)}</span>
              <span>Premium: {formatCurrency(policy.premium)}/year</span>
              {policy.renewalDate && (
                <span>Renewal: {format(new Date(policy.renewalDate), 'MMM dd, yyyy')}</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails && onViewDetails();
            }}
          >
            View Details
          </Button>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PolicyCard;
