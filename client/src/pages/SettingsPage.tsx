import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Users, 
  Settings as SettingsIcon, 
  Bell, 
  Lock, 
  Workflow, 
  Database, 
  Save,
  Shield,
  UploadCloud,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchProfile, updateProfile, ProfileUpdateData } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { profile: contextProfile, setProfileData, user } = useAuth();
  const queryClient = useQueryClient();

  // Form state for profile editing
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    job_title: '',
    bio: '',
    phone: '',
  });

  // Get current user ID for cache key
  const currentUserId = user?.id;

  // Fetch profile data with user-specific cache key
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useQuery({
    queryKey: ['profile', currentUserId], // ← FIX: User-specific cache key
    queryFn: fetchProfile,
    retry: 1,
    enabled: !!currentUserId, // Only fetch when we have a user ID
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileUpdateData) => updateProfile(data),
    onSuccess: (updatedProfile) => {
      toast.success('Profile updated successfully!');
      // Update the profile in AuthContext
      setProfileData(updatedProfile);
      // Update React Query cache with user-specific key
      queryClient.setQueryData(['profile', currentUserId], updatedProfile);
    },
    onError: (error: Error) => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile: ' + error.message);
    },
  });

  // Reset form data when user changes (user logout/login)
  useEffect(() => {
    console.log('🔄 [SETTINGS] User changed, resetting form data. User ID:', currentUserId);
    if (!currentUserId) {
      // User logged out, clear form
      setFormData({
        first_name: '',
        last_name: '',
        job_title: '',
        bio: '',
        phone: '',
      });
    }
  }, [currentUserId]);

  // Update form data when profile is loaded for the current user
  useEffect(() => {
    console.log('📋 [SETTINGS] Profile data changed for user:', currentUserId);
    console.log('📋 [SETTINGS] Profile data:', profileData);
    
    if (profileData && currentUserId) {
      console.log('✅ [SETTINGS] Updating form data with profile for user:', currentUserId);
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        job_title: profileData.job_title || '',
        bio: profileData.bio || '',
        phone: profileData.phone || '',
      });
    } else if (currentUserId && !profileData) {
      console.log('🆕 [SETTINGS] No profile data for user, using empty form:', currentUserId);
      // User has no profile data, start with empty form
      setFormData({
        first_name: '',
        last_name: '',
        job_title: '',
        bio: '',
        phone: '',
      });
    }
  }, [profileData, currentUserId]); // ← FIX: Added currentUserId dependency

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only send fields that have values (not empty strings)
    const dataToUpdate: ProfileUpdateData = {};
    
    if (formData.first_name.trim()) dataToUpdate.first_name = formData.first_name.trim();
    if (formData.last_name.trim()) dataToUpdate.last_name = formData.last_name.trim();
    if (formData.job_title.trim()) dataToUpdate.job_title = formData.job_title.trim();
    if (formData.bio.trim()) dataToUpdate.bio = formData.bio.trim();
    if (formData.phone.trim()) dataToUpdate.phone = formData.phone.trim();
    
    updateProfileMutation.mutate(dataToUpdate);
  };

  const getInitials = () => {
    const firstName = formData.first_name || profileData?.first_name || '';
    const lastName = formData.last_name || profileData?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
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
                {isLoadingProfile ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="flex flex-col items-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <p className="text-gray-600">Loading profile...</p>
                    </div>
                  </div>
                ) : profileError ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800">Error loading profile: {profileError.message}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src="" alt="Profile" />
                          <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="sm" type="button">
                          <UploadCloud className="h-4 w-4 mr-2" />
                          Change Photo
                        </Button>
                        <p className="text-xs text-gray-500 text-center">Photo upload coming soon</p>
                      </div>
                      <div className="space-y-4 flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input 
                              id="firstName" 
                              value={formData.first_name}
                              onChange={(e) => handleInputChange('first_name', e.target.value)}
                              placeholder="Enter your first name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input 
                              id="lastName" 
                              value={formData.last_name}
                              onChange={(e) => handleInputChange('last_name', e.target.value)}
                              placeholder="Enter your last name"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            value={profileData?.email || ''}
                            disabled
                            className="bg-gray-50"
                          />
                          <p className="text-xs text-gray-500">Email cannot be changed from here</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input 
                            id="phone" 
                            type="tel" 
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="Enter your phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="title">Job Title</Label>
                          <Input 
                            id="title" 
                            value={formData.job_title}
                            onChange={(e) => handleInputChange('job_title', e.target.value)}
                            placeholder="Enter your job title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea 
                            id="bio" 
                            placeholder="Tell us about yourself" 
                            className="min-h-[100px]"
                            value={formData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-6 border-t">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Placeholder for other tabs */}
          {activeTab !== 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</CardTitle>
                <CardDescription>This section is under development</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-500 dark:text-slate-400">
                  This section will be implemented in a future update.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 