import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  FileCheck, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Calendar 
} from 'lucide-react';

const Underwriting: React.FC = () => {
  // Mock data for demonstration
  const applications = [
    {
      id: 1,
      clientName: 'Robert Thompson',
      policyType: 'Term Life',
      coverageAmount: 500000,
      applicationDate: '2023-11-01',
      status: 'in_progress',
      progress: 65,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      requirements: [
        { id: 1, name: 'Application Form', completed: true },
        { id: 2, name: 'Medical Examination', completed: true },
        { id: 3, name: 'Blood Test Results', completed: false },
        { id: 4, name: 'Financial Statement', completed: true },
        { id: 5, name: 'Identity Verification', completed: true },
      ]
    },
    {
      id: 2,
      clientName: 'Emily Chen',
      policyType: 'Whole Life',
      coverageAmount: 750000,
      applicationDate: '2023-10-28',
      status: 'pending_review',
      progress: 90,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      requirements: [
        { id: 1, name: 'Application Form', completed: true },
        { id: 2, name: 'Medical Examination', completed: true },
        { id: 3, name: 'Blood Test Results', completed: true },
        { id: 4, name: 'Financial Statement', completed: true },
        { id: 5, name: 'Identity Verification', completed: true },
      ]
    },
    {
      id: 3,
      clientName: 'David Wilson',
      policyType: 'Universal Life',
      coverageAmount: 1000000,
      applicationDate: '2023-11-05',
      status: 'incomplete',
      progress: 40,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
      requirements: [
        { id: 1, name: 'Application Form', completed: true },
        { id: 2, name: 'Medical Examination', completed: false },
        { id: 3, name: 'Blood Test Results', completed: false },
        { id: 4, name: 'Financial Statement', completed: true },
        { id: 5, name: 'Identity Verification', completed: true },
      ]
    },
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'pending_review':
        return <Badge className="bg-amber-100 text-amber-800">Pending Review</Badge>;
      case 'incomplete':
        return <Badge className="bg-red-100 text-red-800">Incomplete</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending_review':
        return <FileCheck className="h-5 w-5 text-amber-500" />;
      case 'incomplete':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Underwriting Tracker</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track and manage policy underwriting processes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Exam
            </Button>
            <Button variant="default">
              <Shield className="h-4 w-4 mr-2" />
              New Application
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Applications</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="pending_review">Pending Review</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {applications.map(application => (
            <Card key={application.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={application.avatar} alt={application.clientName} />
                      <AvatarFallback>
                        {application.clientName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{application.clientName}</CardTitle>
                      <div className="text-sm text-slate-500">
                        {application.policyType} • ${application.coverageAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(application.status)}
                    {getStatusBadge(application.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Application Progress</span>
                    <span>{application.progress}%</span>
                  </div>
                  <Progress value={application.progress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Requirements Checklist</h4>
                    <div className="space-y-2">
                      {application.requirements.map(req => (
                        <div key={req.id} className="flex items-center">
                          <div className={`h-4 w-4 rounded-full mr-2 ${req.completed ? 'bg-green-500' : 'bg-red-500'}`}>
                            {req.completed && (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <span className="text-sm">{req.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Application Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Application Date:</span>
                        <span>{new Date(application.applicationDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Policy Type:</span>
                        <span>{application.policyType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Coverage Amount:</span>
                        <span>${application.coverageAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Risk Assessment:</span>
                        <span>Standard</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 gap-2">
                  <Button variant="outline" size="sm">View Documents</Button>
                  <Button size="sm">Review Application</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="in_progress">
          {applications.filter(app => app.status === 'in_progress').length > 0 ? (
            applications.filter(app => app.status === 'in_progress').map(application => (
              <Card key={application.id} className="mb-6">
                {/* Same card content as above */}
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-slate-500">No applications in progress</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Other tabs content would be similar */}
      </Tabs>
    </div>
  );
};

export default Underwriting;
