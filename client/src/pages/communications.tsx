import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  FileText, 
  Plus, 
  Search, 
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Share2,
  Calendar
} from 'lucide-react';

const Communications: React.FC = () => {
  const [messageTab, setMessageTab] = useState('email');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Mock communications history for display
  const communicationHistory = [
    {
      id: 1,
      clientName: 'Sarah Johnson',
      clientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      type: 'email',
      subject: 'Policy Renewal Reminder',
      date: '2023-11-08T14:30:00',
      status: 'delivered',
      preview: 'Dear Sarah, This is a reminder that your Term Life policy #TL-29845 is due for renewal...'
    },
    {
      id: 2,
      clientName: 'Michael Rodriguez',
      clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      type: 'call',
      subject: 'Policy Details Discussion',
      date: '2023-11-07T10:15:00',
      status: 'completed',
      preview: 'Discussed the details of universal life policy options and premium payment schedules.'
    },
    {
      id: 3,
      clientName: 'Emily Chen',
      clientAvatar: 'https://images.unsplash.com/photo-1504703395950-b89145a5425b',
      type: 'sms',
      subject: 'Appointment Confirmation',
      date: '2023-11-06T16:45:00',
      status: 'delivered',
      preview: 'Hi Emily, just confirming our appointment for tomorrow at 2:00 PM to review your policy options.'
    },
    {
      id: 4,
      clientName: 'David Wilson',
      clientAvatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef',
      type: 'email',
      subject: 'New Policy Documents',
      date: '2023-11-05T09:30:00',
      status: 'opened',
      preview: 'Dear David, Attached are the documents for your new Whole Life policy #WL-67523...'
    },
    {
      id: 5,
      clientName: 'Jennifer Martinez',
      clientAvatar: '',
      type: 'email',
      subject: 'Policy Cancellation Notice',
      date: '2023-11-04T11:20:00',
      status: 'failed',
      preview: 'Dear Jennifer, We regret to inform you that your policy #VL-45678 has been cancelled due to...'
    }
  ];

  // Email templates for quick selection
  const emailTemplates = [
    { id: 'renewal', name: 'Policy Renewal Reminder' },
    { id: 'welcome', name: 'New Client Welcome' },
    { id: 'payment_reminder', name: 'Premium Payment Reminder' },
    { id: 'claim_update', name: 'Claim Status Update' },
    { id: 'annual_review', name: 'Annual Policy Review' }
  ];

  const getIconForType = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'call':
        return <Phone className="h-5 w-5 text-green-500" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      default:
        return <Mail className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Delivered</Badge>;
      case 'opened':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Opened</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredHistory = communicationHistory.filter(
    comm => comm.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            comm.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Communications Hub</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage client communications across multiple channels</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Communication History */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div>
                <CardTitle>Communication History</CardTitle>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search communications"
                  className="pl-10 pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[calc(100vh-320px)] overflow-y-auto">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((comm) => (
                  <div key={comm.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer overflow-hidden">
                    <div className="p-3 flex">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={comm.clientAvatar} alt={comm.clientName} />
                        <AvatarFallback>
                          {comm.clientName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[60%]">{comm.clientName}</p>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-1">
                            {new Date(comm.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="flex-shrink-0">{getIconForType(comm.type)}</span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">{comm.subject}</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {comm.preview}
                        </p>
                        <div className="mt-2">
                          <div className="flex-shrink-0 inline-block">
                            {getStatusBadge(comm.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  No communications found matching your search.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Compose Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
              <Tabs defaultValue={messageTab} onValueChange={setMessageTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="email">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="sms">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    SMS
                  </TabsTrigger>
                  <TabsTrigger value="call">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Log
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {messageTab === 'email' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Recipient</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipient" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sarah">Sarah Johnson</SelectItem>
                          <SelectItem value="michael">Michael Rodriguez</SelectItem>
                          <SelectItem value="emily">Emily Chen</SelectItem>
                          <SelectItem value="david">David Wilson</SelectItem>
                          <SelectItem value="jennifer">Jennifer Martinez</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Template</label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {emailTemplates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Subject</label>
                    <Input placeholder="Email subject" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Message</label>
                    <Textarea 
                      placeholder="Compose your message here..." 
                      className="min-h-[200px]"
                      defaultValue={selectedTemplate === 'renewal' ? 
                        "Dear [Client Name],\n\nThis is a friendly reminder that your life insurance policy #[Policy Number] is due for renewal on [Renewal Date].\n\nTo ensure continuous coverage, please review the attached renewal documents and contact us with any questions.\n\nBest regards,\n[Your Name]\nInsureFlow Insurance Agency" : ''}
                    />
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <Button variant="outline" className="flex-shrink-0">
                      <FileText className="h-4 w-4 mr-2" />
                      Attach Files
                    </Button>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="flex-shrink-0">Save Draft</Button>
                      <Button className="flex-shrink-0">
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {messageTab === 'sms' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Recipient</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sarah">Sarah Johnson</SelectItem>
                        <SelectItem value="michael">Michael Rodriguez</SelectItem>
                        <SelectItem value="emily">Emily Chen</SelectItem>
                        <SelectItem value="david">David Wilson</SelectItem>
                        <SelectItem value="jennifer">Jennifer Martinez</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Message</label>
                    <Textarea 
                      placeholder="Type your SMS message here..." 
                      className="min-h-[150px]"
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-slate-500">0/160 characters</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button>
                      <Send className="h-4 w-4 mr-2" />
                      Send SMS
                    </Button>
                  </div>
                </div>
              )}

              {messageTab === 'call' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Client</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sarah">Sarah Johnson</SelectItem>
                          <SelectItem value="michael">Michael Rodriguez</SelectItem>
                          <SelectItem value="emily">Emily Chen</SelectItem>
                          <SelectItem value="david">David Wilson</SelectItem>
                          <SelectItem value="jennifer">Jennifer Martinez</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Call Status</label>
                      <Select defaultValue="completed">
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">
                            <div className="flex items-center">
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                              Completed
                            </div>
                          </SelectItem>
                          <SelectItem value="attempted">
                            <div className="flex items-center">
                              <XCircle className="h-4 w-4 mr-2 text-red-500" />
                              Attempted (No Answer)
                            </div>
                          </SelectItem>
                          <SelectItem value="scheduled">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-blue-500" />
                              Scheduled
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Call Subject</label>
                    <Input placeholder="Brief description of call purpose" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Call Notes</label>
                    <Textarea 
                      placeholder="Enter details about the call here..." 
                      className="min-h-[150px]"
                    />
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <Button variant="outline" className="flex-shrink-0">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Follow-up
                    </Button>
                    <Button className="flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Log Call
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Communications;