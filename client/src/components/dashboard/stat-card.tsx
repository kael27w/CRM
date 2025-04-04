import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard as StatCardType } from '@/types';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface StatCardProps {
  stat: StatCardType;
}

const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const { title, value, icon, change, changeLabel, changeType, bgColor, iconColor } = stat;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-md ${bgColor}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-slate-900 dark:text-white">{value}</div>
                <div className={`flex items-center text-xs font-medium ${
                  changeType === 'positive' 
                    ? 'text-emerald-600 dark:text-emerald-500' 
                    : 'text-red-600 dark:text-red-500'
                }`}>
                  {changeType === 'positive' ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  )}
                  <span>{change}% {changeLabel}</span>
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
