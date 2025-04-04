import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  FileText, 
  FolderPlus, 
  Upload, 
  Download, 
  FileSignature, 
  Copy, 
  Link2, 
  MoreHorizontal,
  File,
  FileImage,
  FilePen,
  FileSpreadsheet,
  Calendar,
  Clock,
  Filter,
  Eye,
  Pencil,
  Trash2
} from 'lucide-react';
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Documents: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Categories for document organization
  const categories = [
    { id: 'all', name: 'All Documents' },
    { id: 'policies', name: 'Policy Documents' },
    { id: 'applications', name: 'Applications' },
    { id: 'medical', name: 'Medical Records' },
    { id: 'claims', name: 'Claims' },
    { id: 'correspondence', name: 'Correspondence' },
    { id: 'templates', name: 'Document Templates' }
  ];
  
  // Mock document data
  const documents = [
    {
      id: 1,
      name: 'Term Life Policy - Johnson.pdf',
      category: 'policies',
      client: 'Sarah Johnson',
      clientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      dateCreated: '2023-11-02T09:45:00',
      lastModified: '2023-11-02T09:45:00',
      status: 'signed',
      size: '1.2 MB',
      type: 'pdf'
    },
    {
      id: 2,
      name: 'Application Form - Rodriguez.pdf',
      category: 'applications',
      client: 'Michael Rodriguez',
      clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      dateCreated: '2023-10-25T11:30:00',
      lastModified: '2023-10-28T16:15:00',
      status: 'pending',
      size: '842 KB',
      type: 'pdf'
    },
    {
      id: 3,
      name: 'Medical Report - Chen.pdf',
      category: 'medical',
      client: 'Emily Chen',
      clientAvatar: 'https://images.unsplash.com/photo-1504703395950-b89145a5425b',
      dateCreated: '2023-10-18T13:20:00',
      lastModified: '2023-10-18T13:20:00',
      status: 'confidential',
      size: '3.6 MB',
      type: 'pdf'
    },
    {
      id: 4,
      name: 'Policy Amendment - Wilson.docx',
      category: 'policies',
      client: 'David Wilson',
      clientAvatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef',
      dateCreated: '2023-11-01T15:10:00',
      lastModified: '2023-11-03T10:45:00',
      status: 'draft',
      size: '520 KB',
      type: 'doc'
    },
    {
      id: 5,
      name: 'Beneficiary Form - Martinez.pdf',
      category: 'policies',
      client: 'Jennifer Martinez',
      clientAvatar: '',
      dateCreated: '2023-10-27T09:15:00',
      lastModified: '2023-10-27T09:15:00',
      status: 'pending_signature',
      size: '690 KB',
      type: 'pdf'
    },
    {
      id: 6,
      name: 'Premium Calculation Sheet.xlsx',
      category: 'templates',
      client: '',
      clientAvatar: '',
      dateCreated: '2023-09-15T14:30:00',
      lastModified: '2023-10-20T11:25:00',
      status: 'template',
      size: '1.5 MB',
      type: 'spreadsheet'
    },
    {
      id: 7,
      name: 'Claim Request - Thompson.pdf',
      category: 'claims',
      client: 'Robert Thompson',
      clientAvatar: '',
      dateCreated: '2023-11-04T10:35:00',
      lastModified: '2023-11-04T10:35:00',
      status: 'under_review',
      size: '1.8 MB',
      type: 'pdf'
    }
  ];

  // Filter documents based on search and category
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (doc.client && doc.client.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FilePen className="h-5 w-5 text-red-500" />;
      case 'doc':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'image':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      default:
        return <File className="h-5 w-5 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800">Signed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
      case 'draft':
        return <Badge className="bg-slate-100 text-slate-800">Draft</Badge>;
      case 'confidential':
        return <Badge className="bg-red-100 text-red-800">Confidential</Badge>;
      case 'pending_signature':
        return <Badge className="bg-blue-100 text-blue-800">Awaiting Signature</Badge>;
      case 'template':
        return <Badge className="bg-purple-100 text-purple-800">Template</Badge>;
      case 'under_review':
        return <Badge className="bg-orange-100 text-orange-800">Under Review</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Document Center</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Organize, access, and manage all client documents</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <Button variant="outline">
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button>
              <FileSignature className="h-4 w-4 mr-2" />
              Request Signature
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="list">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search documents"
                className="pl-10 w-full md:w-64 lg:w-80"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-slate-500" />
              <select 
                className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 dark:border-slate-600"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {getFileIcon(doc.type)}
                            <span className="ml-2 font-medium">{doc.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.client ? (
                            <div className="flex items-center">
                              <Avatar className="h-7 w-7 mr-2">
                                <AvatarImage src={doc.clientAvatar} alt={doc.client} />
                                <AvatarFallback>
                                  {doc.client.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{doc.client}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{new Date(doc.dateCreated).toLocaleDateString()}</span>
                            <span className="text-xs text-slate-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(doc.dateCreated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{doc.size}</TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Options</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Link2 className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-slate-500">No documents found matching your search.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                        {getFileIcon(doc.type)}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="text-sm font-medium line-clamp-1 mb-1">{doc.name}</h3>
                    <div className="flex items-center mt-1 mb-2">
                      {getStatusBadge(doc.status)}
                    </div>
                    {doc.client ? (
                      <div className="flex items-center text-xs text-slate-500 mb-2">
                        <Avatar className="h-5 w-5 mr-1">
                          <AvatarImage src={doc.clientAvatar} alt={doc.client} />
                          <AvatarFallback>
                            {doc.client.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{doc.client}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(doc.dateCreated).toLocaleDateString()}</span>
                      </div>
                      <span>{doc.size}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No documents found</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Section */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Document Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <FilePen className="h-5 w-5 text-red-500 mr-2" />
                <h3 className="text-sm font-medium">Policy Application Form</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">Standard application form for new policy requests</p>
              <Button size="sm" className="w-full">Use Template</Button>
            </CardContent>
          </Card>
          <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <FileText className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-sm font-medium">Beneficiary Change Request</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">Form to update policy beneficiary information</p>
              <Button size="sm" className="w-full">Use Template</Button>
            </CardContent>
          </Card>
          <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <FilePen className="h-5 w-5 text-red-500 mr-2" />
                <h3 className="text-sm font-medium">Term Life Policy Contract</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">Standard term life insurance contract template</p>
              <Button size="sm" className="w-full">Use Template</Button>
            </CardContent>
          </Card>
          <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <FileSpreadsheet className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="text-sm font-medium">Premium Calculator</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">Spreadsheet tool for premium calculations</p>
              <Button size="sm" className="w-full">Use Template</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Documents;
