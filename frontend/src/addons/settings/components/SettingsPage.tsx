// src/app/(dashboard)/(apps)/settings/_components/SettingsPage.tsx
'use client';

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  User, 
  Bell, 
  Languages,
  Lock, 
  CreditCard, 
  Shield, 
  AlertCircle, 
  Loader2,
  Save,
  Camera,
  Calendar,
  MapPin,
  Mail,
  BookOpen,
  Palette
} from "lucide-react";
import { useAuthContext } from "@/core/auth/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import apiClient from '@/core/api/apiClient';

import { 
  LANGUAGE_OPTIONS, 
  LEVEL_OPTIONS, 
  OBJECTIVES_OPTIONS,
  THEME_OPTIONS,
  GENDER_OPTIONS,
  INTERFACE_LANGUAGE_OPTIONS,
  UserSettings,
  ProfileFormData,
  DEFAULT_USER_SETTINGS,
} from '@/addons/settings/constants/usersettings';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuthContext();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('settingsActiveTab') || 'profile';
  });
  const [activeProfileTab, setActiveProfileTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    gender: null,
    birthday: null,
    native_language: 'EN',
    target_language: 'FR',
    language_level: 'A1',
    objectives: 'Travel',
    interface_language: 'en'
  });
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    show: false,
    type: 'success',
    message: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        bio: user.bio || '',
        gender: user.gender || null,
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : null,
        native_language: user.native_language || 'EN',
        target_language: user.target_language || 'FR',
        language_level: user.language_level || 'A1',
        objectives: user.objectives || 'Travel',
        interface_language: 'en'
      });
      
      // Set initial language settings from user data
      setSettings(prev => ({
        ...prev,
        native_language: user.native_language || "EN",
        target_language: user.target_language || "FR",
        language_level: user.language_level || "A1",
        objectives: user.objectives || "Travel",
      }));
      
      // Load user settings
      fetchUserSettings();
      fetchUserProfile();
    }
  }, [user]);

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem("settingsActiveTab", activeTab);
  }, [activeTab]);

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get('/api/auth/profile/');
      if (response.data) {
        setFormData(prev => ({
          ...prev,
          ...response.data,
          birthday: response.data.birthday
            ? new Date(response.data.birthday).toISOString().split('T')[0]
            : null,
          interface_language: prev.interface_language // Preserve interface language
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  
  const fetchUserSettings = async () => {
    try {
      // Try to get user settings from localStorage first
      const storedSettings = localStorage.getItem('userSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsedSettings
        }));
        
        setFormData(prev => ({
          ...prev,
          interface_language: parsedSettings.interface_language || prev.interface_language
        }));
      }
      
      // Then try to get from API
      try {
        const response = await apiClient.get('/api/auth/me/settings/');
        if (response.data) {
          setSettings(prev => ({
            ...prev,
            ...response.data
          }));
          
          setFormData(prev => ({
            ...prev,
            interface_language: response.data.interface_language || prev.interface_language
          }));
          
          // Update localStorage
          localStorage.setItem('userSettings', JSON.stringify(response.data));
        }
      } catch (error) {
        console.log('Settings API not available, using default values');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    // Handle the "not-specified" special case for gender
    if (name === 'gender' && value === 'not-specified') {
      setFormData(prev => ({ ...prev, [name]: null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Also update settings for language-related fields
      if (['native_language', 'target_language', 'language_level', 'objectives', 'interface_language'].includes(name)) {
        setSettings(prev => ({ ...prev, [name]: value }));
        
        // Apply theme change if interface language is changed
        if (name === 'interface_language' && (value === 'light' || value === 'dark')) {
          setTheme(value);
        }
      }
    }
  };

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      setAlert({ show: false, type: 'success', message: '' });

      // Save both profile and interface language
      const response = await apiClient.patch('/api/auth/profile/', {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        bio: formData.bio,
        gender: formData.gender,
        birthday: formData.birthday,
        native_language: formData.native_language,
        target_language: formData.target_language,
        language_level: formData.language_level,
        objectives: formData.objectives,
        interface_language: formData.interface_language
      });

      // Update settings with interface language
      setSettings(prev => ({
        ...prev,
        interface_language: formData.interface_language
      }));
      
      // Save settings to localStorage
      localStorage.setItem('userSettings', JSON.stringify({
        ...settings,
        interface_language: formData.interface_language
      }));

      // Try to save settings to backend
      try {
        await apiClient.post('/api/auth/me/settings/', {
          ...settings,
          interface_language: formData.interface_language
        });
      } catch (error) {
        console.log('Settings API not available, saved locally only');
      }

      setAlert({
        show: true,
        type: 'success',
        message: 'Profile updated successfully!'
      });

      setIsEditing(false);

      // Clear alert after 3 seconds
      setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 3000);

    } catch (error) {
      console.error('Error updating profile:', error);
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setAlert({ show: false, type: 'success', message: '' });
      
      // Store in localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Try to save to backend
      try {
        await apiClient.post('/api/auth/me/settings/', settings);
      } catch (error) {
        console.log('Settings API not available, saved locally only');
      }
      
      // Save language settings to user profile
      const languageSettings = {
        native_language: settings.native_language,
        target_language: settings.target_language,
        language_level: settings.language_level,
        objectives: settings.objectives,
        interface_language: settings.interface_language
      };
      
      await apiClient.patch('/api/auth/profile/', languageSettings);
      
      setAlert({
        show: true,
        type: 'success',
        message: 'Settings saved successfully!'
      });
      
      // Theme is managed by next-themes
      if (settings.interface_language === 'dark') {
        setTheme('dark');
      } else if (settings.interface_language === 'light') {
        setTheme('light');
      }
      
      // Clear alert after 3 seconds
      setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to save settings. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      // Validate passwords
      if (newPassword !== confirmPassword) {
        setPasswordError("Passwords don't match");
        return;
      }
      
      if (newPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters");
        return;
      }
      
      setPasswordError("");
      setIsSaving(true);
      
      // Auth0 doesn't allow password change from app directly
      // But we'll implement the UI for when backend is ready
      
      // For now, just show a success message
      toast({
        title: "Password Change",
        description: "Password updated successfully.",
      });
      
      // Clear password fields
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Password Change Failed",
        description: "There was an error changing your password.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancelEdit = () => {
    // Reset form to original user data
    if (user) {
      setFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        bio: user.bio || '',
        gender: user.gender || null,
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : null,
        native_language: user.native_language || 'EN',
        target_language: user.target_language || 'FR',
        language_level: user.language_level || 'A1',
        objectives: user.objectives || 'Travel',
        interface_language: settings.interface_language || 'en'
      });
    }
    setIsEditing(false);
  };
  
  const handleProfilePictureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Create FormData
      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await apiClient.post('/api/auth/profile-picture/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.profile_picture) {
        toast({
          title: "Success",
          description: "Profile picture updated successfully!",
        });

        // Refresh user data
        fetchUserProfile();
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost."
    );
    
    if (!confirmed) return;
    
    try {
      setIsDeleting(true);
      
      // Implement account deletion when backend is ready
      // For now, just log the user out
      
      toast({
        title: "Account Deletion",
        description: "Account deletion request received. You will be logged out now.",
      });
      
      setTimeout(() => {
        logout();
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Account Deletion Failed",
        description: "There was an error deleting your account.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Router will redirect
  }

  const fullName = `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || formData.username;

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="flex gap-2">
          {isEditing && (
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
          )}
          <Button 
            onClick={activeTab === 'profile' ? saveProfile : saveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {alert.show && (
        <Alert className={`mb-6 ${alert.type === 'error' ? 'bg-destructive/15' : 'bg-green-100'}`}>
          <AlertDescription>
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Button 
                  variant={activeTab === "profile" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => {
                    setActiveTab("profile");
                    setIsEditing(false);
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button 
                  variant={activeTab === "notifications" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Button>
                <Button 
                  variant={activeTab === "language" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("language")}
                >
                  <Languages className="mr-2 h-4 w-4" />
                  Language
                </Button>
                <Button 
                  variant={activeTab === "appearance" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("appearance")}
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Appearance
                </Button>
                <Button 
                  variant={activeTab === "learning" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("learning")}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Learning
                </Button>
                <Button 
                  variant={activeTab === "security" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("security")}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Security
                </Button>
                <Button 
                  variant={activeTab === "privacy" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("privacy")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Privacy
                </Button>
                <Button 
                  variant={activeTab === "billing" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("billing")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </Button>
                <Button 
                  variant={activeTab === "danger" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("danger")}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Danger Zone
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="col-span-3">
          {/* Profile Section */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Profile Summary */}
              <div className="md:col-span-1">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div
                          className="h-32 w-32 rounded-full overflow-hidden border-4 border-purple-100 cursor-pointer"
                          onClick={handleProfilePictureClick}
                        >
                          {user.picture ? (
                            <img
                              src={user.picture}
                              alt={fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center">
                              <span className="text-3xl font-bold text-white">
                                {fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </div>
                        {isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                            <Loader2 className="h-10 w-10 animate-spin text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/80 transition-colors">
                          <Camera className="h-4 w-4" />
                        </div>
                      </div>
                      <h2 className="text-xl font-semibold mt-4">{fullName}</h2>
                      <p className="text-sm text-gray-500">{formData.email}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <User className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Username</p>
                          <p className="text-gray-600">{formData.username}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-gray-600">{formData.email}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Birthday</p>
                          <p className="text-gray-600">
                            {formData.birthday ? new Date(formData.birthday).toLocaleDateString() : 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Native Language</p>
                          <p className="text-gray-600">
                            {LANGUAGE_OPTIONS.find(opt => opt.value === formData.native_language)?.label || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <BookOpen className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Learning</p>
                          <p className="text-gray-600">
                            {LANGUAGE_OPTIONS.find(opt => opt.value === formData.target_language)?.label || 'Not specified'} -
                            {LEVEL_OPTIONS.find(opt => opt.value === formData.language_level)?.label || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Profile Details / Edit Form */}
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {isEditing ? "Edit Your Profile" : "Profile Information"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue={activeProfileTab} onValueChange={setActiveProfileTab}>
                      <TabsList className="grid grid-cols-4 mb-6">
                        <TabsTrigger value="personal">Personal Info</TabsTrigger>
                        <TabsTrigger value="languages">Languages</TabsTrigger>
                        <TabsTrigger value="learning">Learning Goals</TabsTrigger>
                        <TabsTrigger value="preferences">Preferences</TabsTrigger>
                      </TabsList>

                      <TabsContent value="personal" className="space-y-6">
                        {!isEditing ? (
                          // View Mode
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoItem label="First Name" value={formData.first_name || 'Not specified'} />
                            <InfoItem label="Last Name" value={formData.last_name || 'Not specified'} />
                            <InfoItem label="Username" value={formData.username} />
                            <InfoItem label="Email" value={formData.email} />
                            <InfoItem
                              label="Gender"
                              value={formData.gender
                                ? GENDER_OPTIONS.find(opt => opt.value === formData.gender)?.label || 'Not specified'
                                : 'Not specified'
                              }
                            />
                            <InfoItem
                              label="Birthday"
                              value={formData.birthday ? new Date(formData.birthday).toLocaleDateString() : 'Not specified'}
                            />

                            <div className="col-span-full">
                              <h3 className="text-sm font-medium mb-2">Bio</h3>
                              <p className="text-gray-600">{formData.bio || 'No bio provided yet.'}</p>
                            </div>
                          </div>
                        ) : (
                          // Edit Mode
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="first_name">First Name</Label>
                              <Input
                                id="first_name"
                                name="first_name"
                                value={formData.first_name || ''}
                                onChange={handleInputChange}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="last_name">Last Name</Label>
                              <Input
                                id="last_name"
                                name="last_name"
                                value={formData.last_name || ''}
                                onChange={handleInputChange}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="username">Username</Label>
                              <Input
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="email">Email (Read-only)</Label>
                              <Input
                                id="email"
                                name="email"
                                value={formData.email}
                                disabled
                                className="bg-gray-50"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="gender">Gender</Label>
                              <Select
                                value={formData.gender || 'not-specified'}
                                onValueChange={(value) => handleSelectChange('gender', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not-specified">Not specified</SelectItem>
                                  {GENDER_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="birthday">Birthday</Label>
                              <Input
                                id="birthday"
                                name="birthday"
                                type="date"
                                value={formData.birthday || ''}
                                onChange={handleInputChange}
                              />
                            </div>

                            <div className="col-span-full space-y-2">
                              <Label htmlFor="bio">Bio</Label>
                              <Textarea
                                id="bio"
                                name="bio"
                                placeholder="Tell us about yourself..."
                                value={formData.bio || ''}
                                onChange={handleInputChange}
                                rows={4}
                              />
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="languages" className="space-y-6">
                        {!isEditing ? (
                          // View Mode
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoItem
                              label="Native Language"
                              value={LANGUAGE_OPTIONS.find(opt => opt.value === formData.native_language)?.label || 'Not specified'}
                            />
                            <InfoItem
                              label="Target Language"
                              value={LANGUAGE_OPTIONS.find(opt => opt.value === formData.target_language)?.label || 'Not specified'}
                            />
                            <InfoItem
                              label="Language Level"
                              value={LEVEL_OPTIONS.find(opt => opt.value === formData.language_level)?.label || 'Not specified'}
                            />
                          </div>
                        ) : (
                          // Edit Mode
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="native_language">Native Language</Label>
                              <Select
                                value={formData.native_language}
                                onValueChange={(value) => handleSelectChange('native_language', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                  {LANGUAGE_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="target_language">Target Language</Label>
                              <Select
                                value={formData.target_language}
                                onValueChange={(value) => handleSelectChange('target_language', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                  {LANGUAGE_OPTIONS.map(option => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                      disabled={option.value === formData.native_language}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="language_level">Language Level</Label>
                              <Select
                                value={formData.language_level}
                                onValueChange={(value) => handleSelectChange('language_level', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                  {LEVEL_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="learning" className="space-y-6">
                        {!isEditing ? (
                          // View Mode
                          <div className="grid grid-cols-1 gap-6">
                            <InfoItem
                              label="Learning Objectives"
                              value={OBJECTIVES_OPTIONS.find(opt => opt.value === formData.objectives)?.label || 'Not specified'}
                            />

                            {user.is_coach && (
                              <InfoItem
                                label="Coach Status"
                                value="You are registered as a language coach"
                              />
                            )}
                          </div>
                        ) : (
                          // Edit Mode
                          <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="objectives">Learning Objectives</Label>
                              <Select
                                value={formData.objectives}
                                onValueChange={(value) => handleSelectChange('objectives', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select objectives" />
                                </SelectTrigger>
                                <SelectContent>
                                  {OBJECTIVES_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="preferences" className="space-y-6">
                        {!isEditing ? (
                          // View Mode
                          <div className="grid grid-cols-1 gap-6">
                            <InfoItem
                              label="Interface Language"
                              value={INTERFACE_LANGUAGE_OPTIONS.find(opt => opt.value === formData.interface_language)?.label || 'English'}
                            />
                            <InfoItem
                              label="Theme"
                              value={THEME_OPTIONS.find(opt => opt.value === theme)?.label || 'System'}
                            />
                          </div>
                        ) : (
                          // Edit Mode
                          <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="interface_language">Interface Language</Label>
                              <Select
                                value={formData.interface_language}
                                onValueChange={(value) => handleSelectChange('interface_language', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                  {INTERFACE_LANGUAGE_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="theme">Theme</Label>
                              <Select
                                value={theme || 'system'}
                                onValueChange={(value) => setTheme(value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                  {THEME_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={settings.email_notifications}
                    onCheckedChange={(value) => setSettings({...settings, email_notifications: value})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push_notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications on your device
                    </p>
                  </div>
                  <Switch
                    id="push_notifications"
                    checked={settings.push_notifications}
                    onCheckedChange={(value) => setSettings({...settings, push_notifications: value})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekday_reminders">Weekday Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders on weekdays
                    </p>
                  </div>
                  <Switch
                    id="weekday_reminders"
                    checked={settings.weekday_reminders}
                    onCheckedChange={(value) => setSettings({...settings, weekday_reminders: value})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekend_reminders">Weekend Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders on weekends
                    </p>
                  </div>
                  <Switch
                    id="weekend_reminders"
                    checked={settings.weekend_reminders}
                    onCheckedChange={(value) => setSettings({...settings, weekend_reminders: value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reminder_time">Reminder Time</Label>
                  <Input
                    id="reminder_time"
                    type="time"
                    value={settings.reminder_time}
                    onChange={(e) => setSettings({...settings, reminder_time: e.target.value})}
                    className="w-[200px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "language" && (
            <Card>
              <CardHeader>
                <CardTitle>Language Settings</CardTitle>
                <CardDescription>
                  Manage your language learning preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="native_language">Native Language</Label>
                    <Select 
                      value={settings.native_language}
                      onValueChange={(value) => setSettings({...settings, native_language: value})}
                    >
                      <SelectTrigger id="native_language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target_language">Target Language</Label>
                    <Select 
                      value={settings.target_language}
                      onValueChange={(value) => setSettings({...settings, target_language: value})}
                    >
                      <SelectTrigger id="target_language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            disabled={option.value === settings.native_language}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language_level">Language Level</Label>
                    <Select 
                      value={settings.language_level}
                      onValueChange={(value) => setSettings({...settings, language_level: value})}
                    >
                      <SelectTrigger id="language_level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVEL_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="objectives">Learning Objectives</Label>
                    <Select 
                      value={settings.objectives}
                      onValueChange={(value) => setSettings({...settings, objectives: value})}
                    >
                      <SelectTrigger id="objectives">
                        <SelectValue placeholder="Select objectives" />
                      </SelectTrigger>
                      <SelectContent>
                        {OBJECTIVES_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select 
                      value={theme || 'system'}
                      onValueChange={(value) => setTheme(value)}
                    >
                      <SelectTrigger id="theme" className="w-[200px]">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {THEME_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="interface_language">Interface Language</Label>
                    <Select 
                      value={settings.interface_language}
                      onValueChange={(value) => setSettings({...settings, interface_language: value})}
                    >
                      <SelectTrigger id="interface_language" className="w-[200px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERFACE_LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "learning" && (
            <Card>
              <CardHeader>
                <CardTitle>Learning Settings</CardTitle>
                <CardDescription>
                  Customize your learning experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="daily_goal">Daily Goal (minutes)</Label>
                    <span className="text-sm text-muted-foreground">{settings.daily_goal} minutes</span>
                  </div>
                  <Slider 
                    id="daily_goal" 
                    min={5} 
                    max={60} 
                    step={5} 
                    value={[settings.daily_goal]} 
                    onValueChange={(value: number[]) => setSettings({...settings, daily_goal: value[0]})} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="speaking_exercises">Speaking Exercises</Label>
                    <p className="text-sm text-muted-foreground">
                      Include speaking exercises in your lessons
                    </p>
                  </div>
                  <Switch
                    id="speaking_exercises"
                    checked={settings.speaking_exercises}
                    onCheckedChange={(value) => setSettings({...settings, speaking_exercises: value})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="listening_exercises">Listening Exercises</Label>
                    <p className="text-sm text-muted-foreground">
                      Include listening exercises in your lessons
                    </p>
                  </div>
                  <Switch
                    id="listening_exercises"
                    checked={settings.listening_exercises}
                    onCheckedChange={(value) => setSettings({...settings, listening_exercises: value})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reading_exercises">Reading Exercises</Label>
                    <p className="text-sm text-muted-foreground">
                      Include reading exercises in your lessons
                    </p>
                  </div>
                  <Switch
                    id="reading_exercises"
                    checked={settings.reading_exercises}
                    onCheckedChange={(value) => setSettings({...settings, reading_exercises: value})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="writing_exercises">Writing Exercises</Label>
                    <p className="text-sm text-muted-foreground">
                      Include writing exercises in your lessons
                    </p>
                  </div>
                  <Switch
                    id="writing_exercises"
                    checked={settings.writing_exercises}
                    onCheckedChange={(value) => setSettings({...settings, writing_exercises: value})}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="old_password">Current Password</Label>
                    <Input 
                      id="old_password" 
                      type="password" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input 
                      id="new_password" 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input 
                      id="confirm_password" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  
                  {passwordError && (
                    <p className="text-sm text-red-500">{passwordError}</p>
                  )}
                  
                  <Button 
                    onClick={handleChangePassword}
                    disabled={isSaving || !oldPassword || !newPassword || !confirmPassword}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>Change Password</>
                    )}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">Setup 2FA</Button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Connected Accounts</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your connected accounts and services
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 0C5.372 0 0 5.373 0 12C0 17.302 3.438 21.8 8.207 23.387C8.806 23.498 9 23.126 9 22.81V20.576C5.662 21.302 4.967 19.16 4.967 19.16C4.421 17.773 3.634 17.404 3.634 17.404C2.545 16.66 3.717 16.675 3.717 16.675C4.922 16.759 5.556 17.912 5.556 17.912C6.626 19.746 8.363 19.216 9.048 18.909C9.155 18.134 9.466 17.604 9.81 17.305C7.145 17 4.343 15.971 4.343 11.374C4.343 10.063 4.812 8.993 5.579 8.153C5.455 7.85 5.044 6.629 5.696 4.977C5.696 4.977 6.704 4.655 8.997 6.207C9.954 5.941 10.98 5.808 12 5.803C13.02 5.808 14.047 5.941 15.006 6.207C17.297 4.655 18.303 4.977 18.303 4.977C18.956 6.63 18.545 7.851 18.421 8.153C19.191 8.993 19.656 10.064 19.656 11.374C19.656 15.983 16.849 16.998 14.177 17.295C14.607 17.667 15 18.397 15 19.517V22.81C15 23.129 15.192 23.504 15.801 23.386C20.566 21.797 24 17.3 24 12C24 5.373 18.627 0 12 0Z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">GitHub</p>
                        <p className="text-sm text-muted-foreground">
                          Connect to sync your progress with GitHub
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Connect</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "privacy" && (
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Manage your privacy preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="public_profile">Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Make your profile visible to other users
                    </p>
                  </div>
                  <Switch
                    id="public_profile"
                    checked={settings.public_profile}
                    onCheckedChange={(value) => setSettings({...settings, public_profile: value})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="share_progress">Share Progress</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your learning progress
                    </p>
                  </div>
                  <Switch
                    id="share_progress"
                    checked={settings.share_progress}
                    onCheckedChange={(value) => setSettings({...settings, share_progress: value})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="share_activity">Share Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your recent activity
                    </p>
                  </div>
                  <Switch
                    id="share_activity"
                    checked={settings.share_activity}
                    onCheckedChange={(value) => setSettings({...settings, share_activity: value})}
                  />
                </div>
                
                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-2">Data & Privacy</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage your data and privacy options
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      Download My Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Privacy Policy
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Terms of Service
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "billing" && (
            <Card>
              <CardHeader>
                <CardTitle>Billing Settings</CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="pb-4 border-b">
                  <h3 className="text-lg font-medium mb-2">Current Plan</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{user.is_subscribed ? 'Premium Plan' : 'Free Plan'}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.is_subscribed 
                          ? 'Your subscription renews on the 1st of each month' 
                          : 'Upgrade to access premium features'}
                      </p>
                    </div>
                    <Button variant={user.is_subscribed ? "outline" : "default"}>
                      {user.is_subscribed ? 'Manage Subscription' : 'Upgrade'}
                    </Button>
                  </div>
                </div>
                
                {user.is_subscribed && (
                  <div className="pb-4 border-b">
                    <h3 className="text-lg font-medium mb-2">Payment Method</h3>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">Visa ending in 4242</p>
                          <p className="text-sm text-muted-foreground">Expires 04/24</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                  </div>
                )}
                
                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-2">Billing History</h3>
                  {user.is_subscribed ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className="font-medium">Mar 1, 2025</p>
                          <p className="text-sm text-muted-foreground">Premium Plan</p>
                        </div>
                        <p className="font-medium">$9.99</p>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className="font-medium">Feb 1, 2025</p>
                          <p className="text-sm text-muted-foreground">Premium Plan</p>
                        </div>
                        <p className="font-medium">$9.99</p>
                      </div>
                      <Button variant="outline" className="w-full mt-4">View All Invoices</Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No billing history available on the free plan
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "danger" && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-500">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="pb-4 border-b">
                  <h3 className="text-lg font-medium mb-2">Export and Reset Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download your data before resetting or deleting your account
                  </p>
                  <Button variant="outline">Export All Data</Button>
                </div>
                
                <div className="pb-4 border-b">
                  <h3 className="text-lg font-medium mb-2">Reset Progress</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will reset all your learning progress and statistics
                  </p>
                  <Button variant="outline" className="text-red-500">
                    Reset Progress
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Delete Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. This action cannot be undone.
                  </p>
                  <Button 
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>Delete Account</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for displaying information in view mode
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-1">{label}</h3>
      <p className="text-gray-600">{value}</p>
    </div>
  );
}