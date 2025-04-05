import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneCall } from 'lucide-react';

interface SimpleCounterProps {
  value: number;
  title: string;
}

const SimpleCounter: React.FC<SimpleCounterProps> = ({ value, title }) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <PhoneCall className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">Total calls this month</p>
      </CardContent>
    </Card>
  );
};

export default SimpleCounter; 