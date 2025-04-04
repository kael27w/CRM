import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AgentPerformance as AgentPerformanceType } from '@/types';
import { formatCurrency } from '@/lib/utils/format-currency';

interface AgentPerformanceProps {
  agents: AgentPerformanceType[];
}

const AgentPerformance: React.FC<AgentPerformanceProps> = ({ agents }) => {
  const [period, setPeriod] = useState("30days");

  const getTrendLine = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') {
      return (
        <svg className="w-16 h-8" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 15 L15 10 L25 13 L35 5 L45 8 L55 3 L65 7 L75 2" 
                stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    } else if (trend === 'down') {
      return (
        <svg className="w-16 h-8" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 5 L15 8 L25 4 L35 10 L45 7 L55 15 L65 12 L75 18" 
                stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    } else {
      return (
        <svg className="w-16 h-8" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 10 L15 10 L25 10 L35 10 L45 10 L55 10 L65 10 L75 10" 
                stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
  };

  const getRetentionBadge = (retention: number) => {
    if (retention >= 95) {
      return (
        <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          {retention}%
        </Badge>
      );
    } else if (retention >= 90) {
      return (
        <Badge variant="warning" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          {retention}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="danger" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
          {retention}%
        </Badge>
      );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-900 dark:text-white">Agent Performance</h2>
          <div className="inline-flex items-center space-x-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Period:</span>
            <Select defaultValue={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="lastyear">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Policies Sold</TableHead>
                <TableHead>Premium Volume</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Client Retention</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={agent.agent.profileImage} alt={agent.agent.name} />
                        <AvatarFallback>
                          {agent.agent.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {agent.agent.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {agent.agent.role}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{agent.policiesSold}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(agent.premiumVolume)}</TableCell>
                  <TableCell>
                    <div className="text-sm">{agent.conversionRate}%</div>
                    <Progress value={agent.conversionRate} className="h-1.5 mt-1" />
                  </TableCell>
                  <TableCell>
                    {getRetentionBadge(agent.clientRetention)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {getTrendLine(agent.trend)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentPerformance;
