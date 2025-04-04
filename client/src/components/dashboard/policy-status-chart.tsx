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
                outerRadius={90}
                innerRadius={60}
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
              {/* Conditional rendering for both light and dark mode */}
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="transparent"
              >
                <tspan x="50%" dy="-10" fontSize="24" fontWeight="600" className="fill-black dark:fill-white">
                  {totalPolicies}
                </tspan>
                <tspan x="50%" dy="24" fontSize="12" className="fill-slate-400 dark:fill-slate-300">
                  Total Policies
                </tspan>
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <span 
                className="h-4 w-4 inline-block rounded-full mr-2 flex-shrink-0" 
                style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
              ></span>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {item.status}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {item.percentage}% ({item.count})
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PolicyStatusChart;
