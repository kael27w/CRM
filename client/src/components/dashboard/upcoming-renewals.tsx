import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UpcomingRenewal } from '@/types';
import { formatCurrency } from '@/lib/utils/format-currency';

interface UpcomingRenewalsProps {
  renewals: UpcomingRenewal[];
}

const UpcomingRenewals: React.FC<UpcomingRenewalsProps> = ({ renewals }) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-900 dark:text-white">Upcoming Renewals</h2>
          <Badge variant="secondary">This Week</Badge>
        </div>
        <div className="mt-4 space-y-3">
          {renewals.map((renewal) => (
            <div key={renewal.id} className="flex items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={renewal.client.profileImage} alt={renewal.client.name} />
                <AvatarFallback>
                  {renewal.client.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{renewal.client.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {renewal.policy.type} • {formatCurrency(renewal.policy.coverageAmount)} • {
                    renewal.policy.renewalDate ? 
                    format(new Date(renewal.policy.renewalDate), 'MMM dd, yyyy') :
                    'No renewal date'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm">Contact</Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="link" className="p-0">View all renewals &rarr;</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingRenewals;
