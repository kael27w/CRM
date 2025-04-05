import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Target } from 'lucide-react';

interface TargetMeterProps {
  current: number;
  target: number;
  title: string;
  unit?: string;
}

const TargetMeter: React.FC<TargetMeterProps> = ({ current, target, title, unit = '' }) => {
  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const radius = 50; // Radius of the gauge
  const circumference = 2 * Math.PI * radius;
  // Calculate offset for a semi-circle (0% = full offset, 100% = half offset)
  const strokeDashoffset = (circumference / 2) * (1 - percentage / 100);
  const remaining = Math.max(0, target - current);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium" title={title}>{title}</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center pt-0">
        <div className="relative w-32 h-16 mb-2"> {/* Container for the gauge */}
          <svg className="w-full h-full" viewBox="0 0 120 60" preserveAspectRatio="xMidYMax meet"> {/* Adjusted viewBox */}
            {/* Background Arc */}
            <path
              d="M 10 55 A 50 50 0 0 1 110 55" /* Adjusted path to fit viewBox better */
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="12" // Slightly thicker
              strokeLinecap="round"
            />
            {/* Progress Arc */}
            <path
              d="M 10 55 A 50 50 0 0 1 110 55"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${circumference / 2} ${circumference / 2}`} /* Half circumference */
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
            />
          </svg>
        </div>
        <div className="text-center mt-[-1rem]"> {/* Adjust margin to overlap text */}
           <div className="text-2xl font-bold">{current}{unit}</div>
           <p className="text-xs text-muted-foreground">Target: {target}{unit}</p>
           <p className="text-xs text-muted-foreground">Remaining: {remaining}{unit}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TargetMeter; 