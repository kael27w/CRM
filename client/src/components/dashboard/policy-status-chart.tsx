import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { PolicyStatusData } from '@/types';

interface PolicyStatusChartProps {
  data: PolicyStatusData[];
  totalPolicies: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const PolicyStatusChart: React.FC<PolicyStatusChartProps> = ({ data, totalPolicies }) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <h2 className="text-base font-medium text-slate-900 dark:text-white">Policy Status</h2>
        <div className="mt-4 h-72 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={70}
                innerRadius={40}
                fill="#8884d8"
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [value, props.payload.status]}
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                <tspan x="50%" dy="-5" className="text-lg font-semibold">
                  {totalPolicies}
                </tspan>
                <tspan x="50%" dy="20" className="text-sm text-slate-500">
                  Total Policies
                </tspan>
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <span 
                className="h-3 w-3 inline-block rounded-full mr-2" 
                style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
              ></span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {item.status} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PolicyStatusChart;
