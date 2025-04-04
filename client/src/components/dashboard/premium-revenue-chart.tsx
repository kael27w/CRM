import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PremiumRevenueData } from '@/types';
import { formatCurrency } from '@/lib/utils/format-currency';

type TimeFrame = 'monthly' | 'quarterly' | 'annual';

interface PremiumRevenueChartProps {
  data: PremiumRevenueData[];
}

const PremiumRevenueChart: React.FC<PremiumRevenueChartProps> = ({ data }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('monthly');

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-900 dark:text-white">Premium Revenue</h2>
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-md p-1">
            <Button 
              variant={timeFrame === 'monthly' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setTimeFrame('monthly')}
              className="text-xs"
            >
              Monthly
            </Button>
            <Button 
              variant={timeFrame === 'quarterly' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setTimeFrame('quarterly')}
              className="text-xs"
            >
              Quarterly
            </Button>
            <Button 
              variant={timeFrame === 'annual' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setTimeFrame('annual')}
              className="text-xs"
            >
              Annual
            </Button>
          </div>
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis 
                tickFormatter={(value) => `${value / 1000}k`}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumRevenueChart;
