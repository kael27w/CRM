import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Users, 
  Settings as SettingsIcon, 
  Bell, 
  Lock, 
  Workflow, 
  Database, 
  Monitor, 
  UploadCloud,
  Save,
  Shield,
  Trash2,
  Plus
} from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings & Administration</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Configure your system preferences and manage users</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Sidebar Navigation */}
        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <div className="space-y-1">
              <Button 
                variant={activeTab === 'profile' ? 'default' : 'ghost'} 
                className="w-full justify-start text-left" 
                onClick={() => setActiveTab('profile')}
              >
                <User className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Profile</span>
              </Button>
              <Button 
                variant={activeTab === 'account' ? 'default' : 'ghost'} 
                className="w-full justify-start text-left" 
                onClick={() => setActiveTab('account')}
              >
                <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Account Security</span>
              </Button>
              <Button 
                variant={activeTab === 'notifications' ? 'default' : 'ghost'} 
                className="w-full justify-start text-left" 
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Notifications</span>
              </Button>
              <Button 
                variant={activeTab === 'users' ? 'default' : 'ghost'} 
                className="w-full justify-start text-left" 
                onClick={() => setActiveTab('users')}
              >
                <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">User Management</span>
              </Button>
              <Button 
                variant={activeTab === 'workflow' ? 'default' : 'ghost'} 
                className="w-full justify-start text-left" 
                onClick={() => setActiveTab('workflow')}
              >
                <Workflow className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Workflow Settings</span>
              </Button>
              <Button 
                variant={activeTab === 'system' ? 'default' : 'ghost'} 
                className="w-full justify-start text-left" 
                onClick={() => setActiveTab('system')}
              >
                <SettingsIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">System Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-4 space-y-6">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Profile" />
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">
                      <UploadCloud className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="Alex" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Davis" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue="a.davis@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" defaultValue="(555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input id="title" defaultValue="Senior Insurance Agent" />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-3">About</h3>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Tell us about yourself" 
                      className="min-h-[100px]"
                      defaultValue="Experienced insurance professional specializing in life insurance policies and financial planning. Dedicated to helping clients secure their future and protect their loved ones."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>Manage your password and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Change Password</h3>
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button className="mt-2">Update Password</Button>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Enable 2FA</p>
                      <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                    </div>
                    <Switch id="2fa" />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Session Management</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Monitor className="h-5 w-5 text-slate-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium">Windows 10 - Chrome Browser</p>
                          <p className="text-xs text-slate-500">Last active: Today at 10:24 AM</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">Current</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="text-red-600">Sign Out All Other Devices</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Email Notifications</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-renewals" className="flex-1">
                        <span>Policy Renewals</span>
                        <p className="text-xs text-slate-500">Receive notifications about upcoming policy renewals</p>
                      </Label>
                      <Switch id="email-renewals" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-tasks" className="flex-1">
                        <span>Task Assignments</span>
                        <p className="text-xs text-slate-500">Receive notifications when tasks are assigned to you</p>
                      </Label>
                      <Switch id="email-tasks" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-documents" className="flex-1">
                        <span>Document Updates</span>
                        <p className="text-xs text-slate-500">Receive notifications when documents are updated</p>
                      </Label>
                      <Switch id="email-documents" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-marketing" className="flex-1">
                        <span>Marketing & Newsletter</span>
                        <p className="text-xs text-slate-500">Receive marketing updates and newsletter</p>
                      </Label>
                      <Switch id="email-marketing" />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">System Notifications</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system-tasks" className="flex-1">
                        <span>Task Reminders</span>
                        <p className="text-xs text-slate-500">Show notifications for task due dates</p>
                      </Label>
                      <Switch id="system-tasks" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system-messages" className="flex-1">
                        <span>New Messages</span>
                        <p className="text-xs text-slate-500">Show notifications for new messages</p>
                      </Label>
                      <Switch id="system-messages" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system-actions" className="flex-1">
                        <span>Policy Status Changes</span>
                        <p className="text-xs text-slate-500">Show notifications when policy statuses change</p>
                      </Label>
                      <Switch id="system-actions" defaultChecked />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Notification Schedule</h3>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-hours-start">Quiet Hours Start</Label>
                    <Select defaultValue="18">
                      <SelectTrigger id="quiet-hours-start">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(24)].map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i-12}:00 PM`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-hours-end">Quiet Hours End</Label>
                    <Select defaultValue="9">
                      <SelectTrigger id="quiet-hours-end">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(24)].map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i-12}:00 PM`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage system users and permissions</CardDescription>
                  </div>
                  <Button>
                    <User className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Login</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <Avatar>
                                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Alex Davis" />
                                <AvatarFallback>AD</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">Alex Davis</div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">a.davis@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900 dark:text-white">Administrator</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          Today at 10:24 AM
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a href="#" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">Edit</a>
                          <a href="#" className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Disable</a>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <Avatar>
                                <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Sarah Johnson" />
                                <AvatarFallback>SJ</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">Sarah Johnson</div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">s.johnson@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900 dark:text-white">Senior Agent</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          Yesterday at 3:45 PM
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a href="#" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">Edit</a>
                          <a href="#" className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Disable</a>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <Avatar>
                                <AvatarImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60" alt="Michael Rodriguez" />
                                <AvatarFallback>MR</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">Michael Rodriguez</div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">m.rodriguez@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900 dark:text-white">Underwriter</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          2 days ago
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a href="#" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">Edit</a>
                          <a href="#" className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Disable</a>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <Avatar>
                                <AvatarImage src="https://images.unsplash.com/photo-1504703395950-b89145a5425b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60" alt="Emily Chen" />
                                <AvatarFallback>EC</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">Emily Chen</div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">e.chen@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900 dark:text-white">Client Service Rep</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            Away
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          1 week ago
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a href="#" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">Edit</a>
                          <a href="#" className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Disable</a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'workflow' && (
            <Card>
              <CardHeader>
                <CardTitle>Workflow Settings</CardTitle>
                <CardDescription>Configure the stages and processes in your insurance workflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Pipeline Stages</h3>
                  <div className="space-y-2">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-3">
                          <Label htmlFor="stage-1">Stage Name</Label>
                          <Input id="stage-1" defaultValue="Lead" />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="stage-1-color">Color</Label>
                          <Select defaultValue="blue">
                            <SelectTrigger id="stage-1-color">
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="yellow">Yellow</SelectItem>
                              <SelectItem value="red">Red</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1 flex items-end">
                          <Button variant="ghost" size="icon" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-3">
                          <Label htmlFor="stage-2">Stage Name</Label>
                          <Input id="stage-2" defaultValue="Application" />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="stage-2-color">Color</Label>
                          <Select defaultValue="yellow">
                            <SelectTrigger id="stage-2-color">
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="yellow">Yellow</SelectItem>
                              <SelectItem value="red">Red</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1 flex items-end">
                          <Button variant="ghost" size="icon" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-3">
                          <Label htmlFor="stage-3">Stage Name</Label>
                          <Input id="stage-3" defaultValue="Underwriting" />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="stage-3-color">Color</Label>
                          <Select defaultValue="purple">
                            <SelectTrigger id="stage-3-color">
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="yellow">Yellow</SelectItem>
                              <SelectItem value="red">Red</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1 flex items-end">
                          <Button variant="ghost" size="icon" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-3">
                          <Label htmlFor="stage-4">Stage Name</Label>
                          <Input id="stage-4" defaultValue="Policy Issued" />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="stage-4-color">Color</Label>
                          <Select defaultValue="green">
                            <SelectTrigger id="stage-4-color">
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="yellow">Yellow</SelectItem>
                              <SelectItem value="red">Red</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1 flex items-end">
                          <Button variant="ghost" size="icon" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stage
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Automation Rules</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Automatic Task Creation</p>
                        <p className="text-xs text-slate-500">Automatically create follow-up tasks when policies are nearing expiration</p>
                      </div>
                      <Switch id="auto-tasks" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Renewal Notifications</p>
                        <p className="text-xs text-slate-500">Send automatic emails to clients before policy renewal dates</p>
                      </div>
                      <Switch id="auto-renewals" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Document Expiration Alerts</p>
                        <p className="text-xs text-slate-500">Alert when client documents are about to expire</p>
                      </div>
                      <Switch id="doc-alerts" defaultChecked />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Workflow Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'system' && (
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings and integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Display Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Dark Mode</p>
                        <p className="text-xs text-slate-500">Use dark theme throughout the application</p>
                      </div>
                      <Switch id="dark-mode" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Compact Mode</p>
                        <p className="text-xs text-slate-500">Use more condensed layout for data-heavy screens</p>
                      </div>
                      <Switch id="compact-mode" />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Date & Time</h3>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue="America/New_York">
                        <SelectTrigger id="timezone">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                          <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="date-format">Date Format</Label>
                      <Select defaultValue="MM/DD/YYYY">
                        <SelectTrigger id="date-format">
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Integrations</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center mr-3">
                            <span className="text-lg font-bold">G</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Google Calendar</p>
                            <p className="text-xs text-slate-500">Sync appointments and meetings</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center mr-3">
                            <span className="text-lg font-bold">M</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Microsoft Outlook</p>
                            <p className="text-xs text-slate-500">Sync emails and calendar</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center mr-3">
                            <span className="text-lg font-bold">D</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">DocuSign</p>
                            <p className="text-xs text-slate-500">Electronic signatures for policies</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="bg-green-100 text-green-800">Connected</Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Data Management</h3>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="backup-frequency">Automatic Backup Frequency</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger id="backup-frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline">
                        <Database className="h-4 w-4 mr-2" />
                        Export All Data
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save System Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
