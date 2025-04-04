import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Line, 
  Pie, 
  Cell, 
  ResponsiveContainer 
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format-currency';

const Analytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState('year');

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 120000 },
    { month: 'Feb', revenue: 140000 },
    { month: 'Mar', revenue: 130000 },
    { month: 'Apr', revenue: 170000 },
    { month: 'May', revenue: 190000 },
    { month: 'Jun', revenue: 210000 },
    { month: 'Jul', revenue: 230000 },
    { month: 'Aug', revenue: 200000 },
    { month: 'Sep', revenue: 240000 },
    { month: 'Oct', revenue: 250000 },
    { month: 'Nov', revenue: 270000 },
    { month: 'Dec', revenue: 290000 },
  ];

  const policyTypeData = [
    { name: 'Term Life', value: 45 },
    { name: 'Whole Life', value: 25 },
    { name: 'Universal Life', value: 20 },
    { name: 'Variable Life', value: 10 },
  ];

  const clientAcquisitionData = [
    { month: 'Jan', newClients: 24, lostClients: 5 },
    { month: 'Feb', newClients: 28, lostClients: 6 },
    { month: 'Mar', newClients: 32, lostClients: 8 },
    { month: 'Apr', newClients: 26, lostClients: 7 },
    { month: 'May', newClients: 34, lostClients: 4 },
    { month: 'Jun', newClients: 38, lostClients: 6 },
    { month: 'Jul', newClients: 42, lostClients: 9 },
    { month: 'Aug', newClients: 36, lostClients: 7 },
    { month: 'Sep', newClients: 40, lostClients: 5 },
    { month: 'Oct', newClients: 45, lostClients: 8 },
    { month: 'Nov', newClients: 48, lostClients: 6 },
    { month: 'Dec', newClients: 52, lostClients: 9 },
  ];

  const conversionRateData = [
    { month: 'Jan', rate: 32 },
    { month: 'Feb', rate: 36 },
    { month: 'Mar', rate: 31 },
    { month: 'Apr', rate: 33 },
    { month: 'May', rate: 35 },
    { month: 'Jun', rate: 40 },
    { month: 'Jul', rate: 42 },
    { month: 'Aug', rate: 38 },
    { month: 'Sep', rate: 41 },
    { month: 'Oct', rate: 43 },
    { month: 'Nov', rate: 45 },
    { month: 'Dec', rate: 47 },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics & Reporting</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Analyze business performance and generate reports</p>
          </div>
          <div className="flex gap-2 items-center">
            <Select defaultValue={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Premium Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis 
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <Tooltip formatter={(value) => [`${formatCurrency(value as number)}`, 'Revenue']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3B82F6" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={policyTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {policyTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Acquisition & Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={clientAcquisitionData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="newClients" name="New Clients" fill="#10B981" />
                      <Bar dataKey="lostClients" name="Lost Clients" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={conversionRateData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis 
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip formatter={(value) => [`${value}%`, 'Conversion Rate']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="#8B5CF6" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs would follow a similar pattern */}
        <TabsContent value="revenue">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-slate-500">Revenue analysis details would appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-slate-500">Client analytics would appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-slate-500">Policy analytics would appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-slate-500">Performance metrics would appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
