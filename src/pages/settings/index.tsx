import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DigestFrequency, Role } from '@prisma/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/useToast';
import { Loader2, Save, Server, Lock, Moon, Bell } from 'lucide-react';
import Layout from '../../components/Layout';

interface UserPreferences {
  id: string;
  userId: string;
  darkMode: boolean;
  emailNotifications: boolean;
  taskAssignmentNotify: boolean;
  taskDeadlineNotify: boolean;
  taskCompletionNotify: boolean;
  digestFrequency: DigestFrequency;
  defaultDashboardView: string | null;
}

interface SystemSettings {
  id: string;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpSecure: boolean;
  organizationName: string | null;
  defaultCategories: string[];
  auditLogRetention: number;
}

interface User {
  id: string;
  role: Role;
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshData, setRefreshData] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    id: '',
    userId: '',
    darkMode: false,
    emailNotifications: false,
    taskAssignmentNotify: false,
    taskDeadlineNotify: false,
    taskCompletionNotify: false,
    digestFrequency: 'DAILY',
    defaultDashboardView: 'tasks'
  });
  const [systemSettings, setSystemSettings] = useState<any>({
    id: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: false,
    organizationName: 'FreeMind',
    defaultCategories: ['Work', 'Personal', 'Urgent'],
    auditLogRetention: 90
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Fetch user data and preferences
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Get the JWT token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          toast({
            title: 'Authentication Error',
            description: 'You are not authorized to access these settings.',
            variant: 'destructive',
          });
          router.push('/dashboard');
          return;
        }
        
        // Fetch current user
        const userRes = await fetch('/api/user/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!userRes.ok) throw new Error('Failed to fetch user data');
        const userData = await userRes.json();
        console.log('User data loaded:', userData);
        setUser(userData);
        
        // Fetch user preferences
        const prefsRes = await fetch('/api/user/preferences', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!prefsRes.ok) throw new Error('Failed to fetch preferences');
        const prefsData = await prefsRes.json();
        console.log('Preferences loaded:', prefsData);
        setPreferences(prefsData);
        
        // If admin, fetch system settings
        if (userData.role === 'ADMIN') {
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              console.error('No token found');
              toast({
                title: 'Authentication Error',
                description: 'You are not authorized to access these settings.',
                variant: 'destructive',
              });
              return;
            }
            
            const settingsRes = await fetch('/api/admin/system-settings', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (!settingsRes.ok) {
              throw new Error(`Failed to fetch system settings: ${settingsRes.status}`);
            }
            const settingsData = await settingsRes.json();
            console.log('System settings loaded:', settingsData);
            
            // Ensure we have arrays even if API returns null
            const processedSettings = {
              ...settingsData,
              defaultCategories: settingsData.defaultCategories || ['Work', 'Personal', 'Urgent']
            };
            
            setSystemSettings(processedSettings);
          } catch (error) {
            console.error('Error fetching system settings:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [toast, refreshData]);
  
  // Save user preferences
  const savePreferences = async () => {
    setSaving(true);
    try {
      console.log('Saving preferences:', preferences);
      
      // Get the JWT token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        toast({
          title: 'Authentication Error',
          description: 'You are not authorized to update these settings.',
          variant: 'destructive',
        });
        return;
      }
      
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences),
      });
      
      if (!res.ok) throw new Error('Failed to save preferences');
      
      // Trigger a refresh of the data
      setRefreshData(prev => prev + 1);
      
      toast({
        title: 'Success',
        description: 'Your preferences have been saved.',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Save system settings (admin only)
  const saveSystemSettings = async () => {
    setSaving(true);
    try {
      console.log('Saving system settings:', systemSettings);
      
      // Get the JWT token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        toast({
          title: 'Authentication Error',
          description: 'You are not authorized to update these settings.',
          variant: 'destructive',
        });
        return;
      }
      
      const res = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(systemSettings),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error || `Failed to save settings: ${res.status}`);
      }
      
      // Trigger a refresh of the data
      setRefreshData(prev => prev + 1);
      
      toast({
        title: 'Success',
        description: 'System settings saved successfully.',
      });
    } catch (error: any) {
      console.error('Error saving system settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save system settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Change password
  const changePassword = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    try {
      // Get the JWT token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        toast({
          title: 'Authentication Error',
          description: 'You are not authorized to change your password.',
          variant: 'destructive',
        });
        return;
      }
      
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error || `Failed to change password: ${res.status}`);
      }
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Trigger a refresh of the data
      setRefreshData(prev => prev + 1);
      
      toast({
        title: 'Success',
        description: 'Your password has been changed successfully.',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading settings...</span>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-6 bg-gray-50">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Settings</h1>
        
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="mb-6 bg-white border-b border-gray-200 w-full flex space-x-6 overflow-x-auto">
            <TabsTrigger value="account" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600">
              <Lock className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="notifications" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600">
              <Moon className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            {user?.role === 'ADMIN' && (
              <TabsTrigger value="system" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600">
                <Server className="h-4 w-4 mr-2" />
                System Settings
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* Account Settings */}
          <TabsContent value="account">
            <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
              <CardHeader className="border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-blue-600" />
                  Change Password
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-sm font-medium text-gray-700">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button 
                  onClick={changePassword} 
                  disabled={saving}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
              <CardHeader className="border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-blue-600" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Manage how you receive notifications and updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
                  </div>
                  <Switch 
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => {
                      console.log('Email notifications toggled:', checked);
                      setPreferences(prev => ({...prev, emailNotifications: checked}));
                    }}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
                
                <div className="space-y-6 mt-6">
                  <h3 className="text-sm font-medium text-gray-900">Notification Types</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Switch 
                        id="task-assignment"
                        checked={preferences.taskAssignmentNotify}
                        onCheckedChange={(checked) => {
                          console.log('Task assignment toggled:', checked);
                          setPreferences(prev => ({...prev, taskAssignmentNotify: checked}));
                        }}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <Label htmlFor="task-assignment" className="ml-2 text-sm font-medium text-gray-700">
                        Task Assignment
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Switch 
                        id="task-deadline"
                        checked={preferences.taskDeadlineNotify}
                        onCheckedChange={(checked) => {
                          console.log('Task deadline toggled:', checked);
                          setPreferences(prev => ({...prev, taskDeadlineNotify: checked}));
                        }}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <Label htmlFor="task-deadline" className="ml-2 text-sm font-medium text-gray-700">
                        Task Deadlines
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Switch 
                        id="task-completion"
                        checked={preferences.taskCompletionNotify}
                        onCheckedChange={(checked) => {
                          console.log('Task completion toggled:', checked);
                          setPreferences(prev => ({...prev, taskCompletionNotify: checked}));
                        }}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <Label htmlFor="task-completion" className="ml-2 text-sm font-medium text-gray-700">
                        Task Completion
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mt-6">
                  <Label htmlFor="digest-frequency" className="text-sm font-medium text-gray-700">Email Digest Frequency</Label>
                  <Select 
                    value={preferences.digestFrequency}
                    onValueChange={(value) => 
                      setPreferences(prev => ({...prev, digestFrequency: value as DigestFrequency}))
                    }
                  >
                    <SelectTrigger id="digest-frequency" className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="NEVER">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={savePreferences} 
                  disabled={saving}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
              <CardHeader className="border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <Moon className="h-5 w-5 mr-2 text-blue-600" />
                  Appearance
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Customize the look and feel of the application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Dark Mode</h3>
                    <p className="text-sm text-gray-500">Use dark theme for the application</p>
                  </div>
                  <Switch
                    checked={preferences.darkMode}
                    onCheckedChange={(checked) => {
                      console.log('Dark mode toggled:', checked);
                      setPreferences(prev => ({...prev, darkMode: checked}));
                    }}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
                
                <div className="space-y-2 mt-6">
                  <Label htmlFor="default-view" className="text-sm font-medium text-gray-700">Default Dashboard View</Label>
                  <Select 
                    value={preferences.defaultDashboardView}
                    onValueChange={(value) => 
                      setPreferences(prev => ({...prev, defaultDashboardView: value}))
                    }
                  >
                    <SelectTrigger id="default-view" className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select default view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tasks">Tasks</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                      <SelectItem value="insights">Insights</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={savePreferences} 
                  disabled={saving}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Appearance
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* System Settings (Admin Only) */}
          {user?.role === 'ADMIN' && (
            <TabsContent value="system">
              <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
                <CardHeader className="border-b border-gray-200 bg-gray-50 rounded-t-lg">
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                    <Server className="h-5 w-5 mr-2 text-blue-600" />
                    System Settings
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Configure global system settings (Admin only).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6 text-gray-900">
                  <div>
                    <h3 className="font-medium mb-4 text-gray-900">Email Server Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-host" className="text-sm font-medium text-gray-700">SMTP Host</Label>
                        <Input
                          id="smtp-host"
                          value={systemSettings.smtpHost}
                          onChange={(e) => 
                            setSystemSettings(prev => ({...prev, smtpHost: e.target.value}))
                          }
                          className="w-full text-gray-900 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port" className="text-sm font-medium text-gray-700">SMTP Port</Label>
                        <Input
                          id="smtp-port"
                          type="number"
                          value={systemSettings.smtpPort}
                          onChange={(e) => 
                            setSystemSettings(prev => ({...prev, smtpPort: parseInt(e.target.value) || null}))
                          }
                          className="w-full text-gray-900 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-user" className="text-sm font-medium text-gray-700">SMTP Username</Label>
                        <Input
                          id="smtp-user"
                          value={systemSettings.smtpUser}
                          onChange={(e) => 
                            setSystemSettings(prev => ({...prev, smtpUser: e.target.value}))
                          }
                          className="w-full text-gray-900 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-password" className="text-sm font-medium text-gray-700">SMTP Password</Label>
                        <Input
                          id="smtp-password"
                          type="password"
                          placeholder="••••••••"
                          onChange={(e) => 
                            setSystemSettings(prev => ({...prev, smtpPassword: e.target.value}))
                          }
                          className="w-full text-gray-900 bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex items-center mt-4">
                      <Switch
                        id="smtp-secure"
                        checked={!!systemSettings.smtpSecure}
                        onCheckedChange={(checked) => {
                          console.log('SMTP Secure toggled:', checked);
                          setSystemSettings(prev => ({...prev, smtpSecure: checked}));
                        }}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <Label htmlFor="smtp-secure" className="ml-2 text-sm font-medium text-gray-700">
                        Use Secure Connection (SSL/TLS): {systemSettings.smtpSecure ? 'Yes' : 'No'}
                      </Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="org-name" className="text-sm font-medium text-gray-700">Organization Name</Label>
                    <Input
                      id="org-name"
                      value={systemSettings.organizationName}
                      onChange={(e) => 
                        setSystemSettings(prev => ({...prev, organizationName: e.target.value}))
                      }
                      className="w-full text-gray-900 bg-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default-categories" className="text-sm font-medium text-gray-700">Default Task Categories</Label>
                    <Input
                      id="default-categories"
                      value={systemSettings.defaultCategories.join(', ')}
                      onChange={(e) => {
                        const categories = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
                        setSystemSettings(prev => ({...prev, defaultCategories: categories}));
                      }}
                      placeholder="Work, Personal, Urgent"
                      className="w-full text-gray-900 bg-white"
                    />
                    <p className="text-sm text-gray-500 mt-1">Comma-separated list of default categories</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="audit-retention" className="text-sm font-medium text-gray-700">Audit Log Retention (days)</Label>
                    <Input
                      id="audit-retention"
                      type="number"
                      min="1"
                      max="365"
                      value={systemSettings.auditLogRetention}
                      onChange={(e) => 
                        setSystemSettings(prev => ({...prev, auditLogRetention: parseInt(e.target.value) || 30}))
                      }
                      className="w-full text-gray-900 bg-white"
                    />
                  </div>
                  
                  <Button 
                    onClick={saveSystemSettings} 
                    disabled={saving}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save System Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
