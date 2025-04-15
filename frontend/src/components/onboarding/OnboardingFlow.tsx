// src/components/onboarding/OnboardingFlow.tsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Globe,
  BookOpen,
  User,
  Languages,
  Settings,
  Info,
  Save,
  RefreshCw,
  ExternalLink,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LANGUAGE_OPTIONS,
  LEVEL_OPTIONS,
  OBJECTIVES_OPTIONS,
  INTERFACE_LANGUAGE_OPTIONS
} from "@/addons/settings/constants/usersettings";
import apiClient from "@/core/api/apiClient";
import { useAuthContext } from "@/core/auth/AuthProvider";
import { useLanguage } from "@/core/hooks/useLanguage";

/**
 * Linguify Onboarding Flow Component
 * 
 * A comprehensive onboarding process for new users to set up their language learning profile.
 * Features step-by-step configuration, validation, and developer tools for debugging.
 */

interface OnboardingFlowProps {
  onComplete: () => void;
}

// Type definitions for form data and API responses
interface OnboardingFormData {
  first_name: string;
  last_name: string;
  username: string;
  bio: string | null;
  native_language: string;
  target_language: string;
  language_level: string;
  objectives: string;
  interface_language: string;
}

interface ServerResponseData {
  first_name?: string;
  last_name?: string;
  username?: string;
  bio?: string | null;
  native_language?: string;
  target_language?: string;
  language_level?: string;
  objectives?: string;
  public_id?: string;
  email?: string;
  updated_at?: string;
  created_at?: string;
  [key: string]: any;
}

interface ApiRequest {
  endpoint: string;
  method: string;
  timestamp: string;
  status?: "success" | "error" | "pending";
  duration?: number;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  // Hooks
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { getAvailableLanguages } = useLanguage();

  // State management
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [lastServerResponse, setLastServerResponse] = useState<ServerResponseData | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [apiRequests, setApiRequests] = useState<ApiRequest[]>([]);

  // Form data state and initial values
  const [formData, setFormData] = useState<OnboardingFormData>({
    first_name: "",
    last_name: "",
    username: "",
    bio: "",
    native_language: "",
    target_language: "",
    language_level: "A1",
    objectives: "Travel",
    interface_language: "en"
  });

  // Store original data to track changes
  const [initialData, setInitialData] = useState<OnboardingFormData>({
    first_name: "",
    last_name: "",
    username: "",
    bio: "",
    native_language: "",
    target_language: "",
    language_level: "A1",
    objectives: "Travel",
    interface_language: "en"
  });

  // Define step information for better navigation and context
  const steps = [
    {
      id: 1,
      title: "Welcome",
      description: "Begin your language learning journey",
      icon: Globe
    },
    {
      id: 2,
      title: "Personal Info",
      description: "Tell us about yourself",
      icon: User
    },
    {
      id: 3,
      title: "Languages",
      description: "Select your languages",
      icon: Languages
    },
    {
      id: 4,
      title: "Learning Goals",
      description: "Customize your experience",
      icon: BookOpen
    },
    {
      id: 5,
      title: "Review",
      description: "Confirm your settings",
      icon: Settings
    },
    {
      id: 6,
      title: "Completion",
      description: "You're all set!",
      icon: CheckCircle
    }
  ];

  // Helper to log API requests for developer tools
  const logApiRequest = (endpoint: string, method: string, status?: "success" | "error" | "pending") => {
    const timestamp = new Date().toISOString();
    setApiRequests(prev => [
      { endpoint, method, timestamp, status },
      ...prev.slice(0, 9) // Keep only the last 10 requests
    ]);
  };

  // Helper to get field label for display
  const getFieldLabel = (field: keyof OnboardingFormData): string => {
    const labelMap: Record<keyof OnboardingFormData, string> = {
      first_name: "First Name",
      last_name: "Last Name",
      username: "Username",
      bio: "Bio",
      native_language: "Native Language",
      target_language: "Target Language",
      language_level: "Language Level",
      objectives: "Learning Objectives",
      interface_language: "Interface Language"
    };
    return labelMap[field] || field;
  };

  // Helper to get display value for a field (handles select options)
  const getDisplayValue = (field: keyof OnboardingFormData, value: string): string => {
    if (!value) return "Not set";

    if (field === "native_language" || field === "target_language") {
      return LANGUAGE_OPTIONS.find(opt => opt.value === value)?.label || value;
    } else if (field === "language_level") {
      return LEVEL_OPTIONS.find(opt => opt.value === value)?.label || value;
    } else if (field === "objectives") {
      return OBJECTIVES_OPTIONS.find(opt => opt.value === value)?.label || value;
    } else if (field === "interface_language") {
      return INTERFACE_LANGUAGE_OPTIONS.find(opt => opt.value === value)?.label || value;
    }

    return value;
  };

  // Load initial data from user if available
  useEffect(() => {
    if (user) {
      const userData = {
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        bio: user.bio || "",
        native_language: user.native_language || "",
        target_language: user.target_language || "",
        language_level: user.language_level || "A1",
        objectives: user.objectives || "Travel",
        interface_language: "en"
      };

      setFormData(userData);
      setInitialData(userData);
    }
  }, [user]);

  // Fetch current profile from API on initial load
  useEffect(() => {
    fetchCurrentProfile();
  }, []);

  // Form validation with detailed error messages
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    // Field-specific validations
    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      errors.last_name = "Last name is required";
    }

    if (!formData.native_language) {
      errors.native_language = "Native language is required";
    }

    if (!formData.target_language) {
      errors.target_language = "Target language is required";
    } else if (formData.native_language === formData.target_language) {
      errors.target_language = "Target language must be different from native language";
    }

    // Set validation errors in state
    setValidationErrors(errors);

    // Return true if no errors, false otherwise
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Fetch current profile data from API
  const fetchCurrentProfile = async () => {
    try {
      logApiRequest('/api/auth/profile/', 'GET', 'pending');
      const startTime = Date.now();

      const response = await apiClient.get('/api/auth/profile/');

      logApiRequest('/api/auth/profile/', 'GET', 'success');

      if (response.data) {
        setLastServerResponse(response.data);

        // Update initialData with current server data
        const serverData = response.data;
        setInitialData({
          first_name: serverData.first_name || "",
          last_name: serverData.last_name || "",
          username: serverData.username || "",
          bio: serverData.bio || "",
          native_language: serverData.native_language || "",
          target_language: serverData.target_language || "",
          language_level: serverData.language_level || "A1",
          objectives: serverData.objectives || "Travel",
          interface_language: "en"
        });

        toast({
          title: "Profile data refreshed",
          description: "Latest data loaded from server",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      logApiRequest('/api/auth/profile/', 'GET', 'error');

      toast({
        title: "Error fetching profile",
        description: "Could not load your current profile data",
        variant: "destructive",
      });
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Final validation before submission
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, update the profile
      logApiRequest('/api/auth/profile/', 'PATCH', 'pending');

      const profileResponse = await apiClient.patch('/api/auth/profile/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        bio: formData.bio,
        native_language: formData.native_language,
        target_language: formData.target_language,
        language_level: formData.language_level,
        objectives: formData.objectives
      });

      logApiRequest('/api/auth/profile/', 'PATCH', 'success');
      setLastServerResponse(profileResponse.data);

      // Then, update settings with interface language
      try {
        logApiRequest('/api/auth/me/settings/', 'POST', 'pending');

        await apiClient.post('/api/auth/me/settings/', {
          interface_language: formData.interface_language
        });

        logApiRequest('/api/auth/me/settings/', 'POST', 'success');
      } catch (error) {
        logApiRequest('/api/auth/me/settings/', 'POST', 'error');
        console.log('Settings API not available, interface language saved locally only');

        // Save interface language to localStorage as fallback
        const userSettings = localStorage.getItem('userSettings');
        if (userSettings) {
          const settings = JSON.parse(userSettings);
          settings.interface_language = formData.interface_language;
          localStorage.setItem('userSettings', JSON.stringify(settings));
        } else {
          localStorage.setItem('userSettings', JSON.stringify({
            interface_language: formData.interface_language
          }));
        }
      }

      // Show success toast
      toast({
        title: "Profile updated successfully!",
        description: "Your language learning journey begins now.",
        variant: "default",
      });

      // Set onboarding as completed in localStorage
      localStorage.setItem("onboardingCompleted", "true");

      // Move to the final step to show completion screen
      setStep(totalSteps);

      // Set a small timeout before completing to allow the user to see the success screen
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error: any) {
      console.error("Error updating profile:", error);
      logApiRequest('/api/auth/profile/', 'PATCH', 'error');

      const errorMessage = error.response?.data?.detail || "There was an error saving your information.";

      // Try to extract error details for more specific feedback
      if (error.response?.data) {
        setLastServerResponse(error.response.data);
      }

      toast({
        title: "Error updating profile",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes and clear validation errors
  const handleInputChange = (field: keyof OnboardingFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field if it exists
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Navigate to next step with validation
  const nextStep = () => {
    // Validate current step
    let isValid = true;

    // Step-specific validations
    if (step === 2) {
      // Basic user info validation
      if (!formData.first_name || !formData.last_name || !formData.username) {
        isValid = false;

        // Set specific errors
        const errors: Record<string, string> = {};
        if (!formData.first_name) errors.first_name = "First name is required";
        if (!formData.last_name) errors.last_name = "Last name is required";
        if (!formData.username) errors.username = "Username is required";

        setValidationErrors(errors);

        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
      }
    } else if (step === 3) {
      // Language selection validation
      if (!formData.native_language || !formData.target_language) {
        isValid = false;

        const errors: Record<string, string> = {};
        if (!formData.native_language) errors.native_language = "Native language is required";
        if (!formData.target_language) errors.target_language = "Target language is required";

        setValidationErrors(errors);

        toast({
          title: "Language selection required",
          description: "Please select both your native and target languages",
          variant: "destructive",
        });
      } else if (formData.native_language === formData.target_language) {
        isValid = false;

        setValidationErrors({
          target_language: "Target language must be different from native language"
        });

        toast({
          title: "Invalid language selection",
          description: "Native and target languages must be different",
          variant: "destructive",
        });
      }
    }

    if (isValid) {
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Skip the entire onboarding
  const skipOnboarding = () => {
    localStorage.setItem("onboardingCompleted", "true");
    onComplete();
  };

  // Go to specific step (for step pills navigation)
  const goToStep = (stepNumber: number) => {
    if (stepNumber >= 1 && stepNumber <= totalSteps) {
      setStep(stepNumber);
    }
  };

  // Animation variants for page transitions
  const pageVariants = {
    initial: {
      opacity: 0,
      x: 100,
    },
    in: {
      opacity: 1,
      x: 0,
    },
    out: {
      opacity: 0,
      x: -100,
    },
  };

  // Render field with validation
  const renderField = (
    field: keyof OnboardingFormData,
    label: string,
    type: 'text' | 'textarea' | 'select' = 'text',
    options?: { value: string; label: string }[],
    helperText?: string
  ) => {
    const hasError = field in validationErrors;
    const isRequired = ['first_name', 'last_name', 'username', 'native_language', 'target_language'].includes(field);

    return (
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          {hasError && (
            <span className="text-xs text-red-500 font-medium">{validationErrors[field]}</span>
          )}
        </div>

        {type === 'text' && (
          <Input
            id={field}
            value={formData[field] as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={hasError ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
        )}

        {type === 'textarea' && (
          <Textarea
            id={field}
            value={formData[field] as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={hasError ? "border-red-500 focus-visible:ring-red-500" : ""}
            rows={3}
          />
        )}

        {type === 'select' && options && (
          <Select
            value={formData[field] as string}
            onValueChange={(value) => handleInputChange(field, value)}
          >
            <SelectTrigger className={hasError ? "border-red-500 focus-visible:ring-red-500" : ""}>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={field === 'target_language' && option.value === formData.native_language}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {helperText && !hasError && (
          <p className="text-xs text-gray-500 mt-1">{helperText}</p>
        )}
      </div>
    );
  };

  // Count fields that will be updated
  const changedFieldsCount = Object.keys(formData).filter(key => {
    const field = key as keyof OnboardingFormData;
    return formData[field] !== initialData[field];
  }).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header with progress and navigation */} 
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">Welcome to Linguify</h2>
              <p className="text-sm text-white/80">{steps[step - 1].title}</p>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => setShowDevTools(!showDevTools)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle developer tools</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="ghost" onClick={skipOnboarding} className="text-white hover:text-white/80">
                Skip
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <Progress value={(step / totalSteps) * 100} className="h-2 bg-white/30" />
          <div className="flex justify-between text-xs mt-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>

          {/* Step pills for direct navigation */}
          <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
            {steps.map((s, index) => (
              <button
                key={index}
                onClick={() => goToStep(index + 1)}
                className={`px-2 py-1 rounded-full text-xs flex items-center transition-colors ${step === index + 1
                  ? "bg-white text-purple-600 font-medium"
                  : "bg-white/20 hover:bg-white/30"
                  }`}
              >
                <s.icon className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{s.title}</span>
                <span className="inline sm:hidden">{index + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Developer Tools Panel */}
        {showDevTools && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 text-xs font-mono border-b border-gray-200 dark:border-gray-700 max-h-[150px] overflow-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="form-data">
                <AccordionTrigger className="text-sm font-medium">
                  Form Data
                </AccordionTrigger>
                <AccordionContent>
                  <pre className="overflow-auto max-h-32 text-xs">
                    {JSON.stringify(formData, null, 2)}
                  </pre>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="server-response">
                <AccordionTrigger className="text-sm font-medium">
                  Last Server Response
                </AccordionTrigger>
                <AccordionContent>
                  {lastServerResponse ? (
                    <pre className="overflow-auto max-h-32 text-xs">
                      {JSON.stringify(lastServerResponse, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-gray-500">No response received yet</div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="user-data">
                <AccordionTrigger className="text-sm font-medium">
                  Current User Data
                </AccordionTrigger>
                <AccordionContent>
                  {user ? (
                    <pre className="overflow-auto max-h-32 text-xs">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-gray-500">No user data available</div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="api-requests">
                <AccordionTrigger className="text-sm font-medium">
                  API Requests Log
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {apiRequests.length > 0 ? (
                      apiRequests.map((req, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">{new Date(req.timestamp).toLocaleTimeString()}</span>
                          <Badge variant={req.status === 'error' ? 'destructive' :
                            (req.status === 'success' ? 'default' : 'outline')}>
                            {req.method}
                          </Badge>
                          <span>{req.endpoint}</span>
                          {req.status && (
                            <Badge variant={req.status === 'error' ? 'destructive' :
                              (req.status === 'success' ? 'default' : 'outline')}
                              className="ml-auto">
                              {req.status}
                            </Badge>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">No API requests logged</div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={fetchCurrentProfile}
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Refresh Server Data
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs ml-auto"
                onClick={() => setApiRequests([])}
              >
                Clear Log
              </Button>
            </div>
          </div>
        )}

        {/* Content area with step content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={{ duration: 0.3 }}
              className="min-h-[350px] flex flex-col"
            >
              {/* Step 1: Welcome */}
              {step === 1 && (
                <div className="flex flex-col items-center text-center space-y-6 flex-grow justify-center min-h-[400px]">
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-full">
                    <Sparkles className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Welcome to Linguify!</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    Let's set up your profile and language preferences to customize your learning experience.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    This will only take 2 minutes to complete.
                  </p>

                  {/* Feature highlights */}
                  <div className="w-full max-w-md grid grid-cols-2 gap-4 mt-4">
                    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <User className="h-8 w-8 text-purple-500 mb-2" />
                      <h4 className="font-medium">Profile Setup</h4>
                      <p className="text-xs text-gray-500">Personalize your account</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Languages className="h-8 w-8 text-blue-500 mb-2" />
                      <h4 className="font-medium">Language Settings</h4>
                      <p className="text-xs text-gray-500">Choose what to learn</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Personal Information */}
              {step === 2 && (
                <div className="space-y-6 min-h-[400px] flex flex-col justify-start">

                  <div className="flex items-center space-x-3 mb-6">
                    <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xl font-bold">Tell us about yourself</h3>
                  </div>

                  <Alert className="mb-4">
                    <AlertDescription>
                      This information helps personalize your learning experience.
                      Fields marked with <span className="text-red-500">*</span> are required.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    {renderField('first_name', 'First Name')}
                    {renderField('last_name', 'Last Name')}
                  </div>

                  {renderField('username', 'Username', 'text', undefined,
                    'This will be used as your display name on the platform')}

                  {renderField('bio', 'Bio (Optional)', 'textarea', undefined,
                    'Tell other learners a bit about yourself')}
                </div>
              )}

              {/* Step 3: Language Selection */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xl font-bold">Your languages</h3>
                  </div>

                  <Alert className="mb-4">
                    <AlertTitle className="flex items-center">
                      <Languages className="h-4 w-4 mr-2" />
                      Important Language Selection
                    </AlertTitle>
                    <AlertDescription>
                      Your native language and target language must be different.
                      This helps us personalize your learning path.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    {renderField('native_language', 'Native Language', 'select', LANGUAGE_OPTIONS,
                      'The language you are fluent in')}

                    <div className="relative">
                      {renderField('target_language', 'Target Language', 'select', LANGUAGE_OPTIONS,
                        'The language you want to learn')}

                      {formData.native_language && formData.target_language &&
                        formData.native_language !== formData.target_language && (
                          <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span>Learning {getDisplayValue('target_language', formData.target_language)} from {getDisplayValue('native_language', formData.native_language)}</span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Learning Preferences */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xl font-bold">Learning preferences</h3>
                  </div>

                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 mb-6">
                    <CardContent className="p-4">
                      <h4 className="font-medium flex items-center mb-2">
                        <Settings className="mr-2 h-4 w-4 text-blue-500" />
                        Customize Your Learning Experience
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        These settings help tailor your lessons and determine which content you'll see.
                      </p>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    {renderField('language_level', 'Your Current Level', 'select', LEVEL_OPTIONS,
                      'Your current proficiency in the target language')}

                    {renderField('objectives', 'Learning Objectives', 'select', OBJECTIVES_OPTIONS,
                      'What you want to achieve with your language learning')}

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                      {renderField('interface_language', 'Interface Language', 'select', INTERFACE_LANGUAGE_OPTIONS,
                        'The language used for buttons, menus, and instructions')}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review Information - version compacte */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-bold">Review your information</h3>
                  </div>

                  <Alert className="mb-2 py-2">
                    <AlertDescription className="text-sm">
                      Please verify your information before finalizing your profile setup.
                    </AlertDescription>
                  </Alert>

                  {/* Tableau de révision avec hauteur maximale et scrollable */}
                  <div className="border rounded-md overflow-hidden">
                    <div className="max-h-[250px] overflow-y-auto">
                      <Table className="w-full">
                        <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                          <TableRow>
                            <TableHead className="w-1/4 py-2">Field</TableHead>
                            <TableHead className="w-1/4 py-2">Current Value</TableHead>
                            <TableHead className="py-2">New Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(Object.keys(formData) as Array<keyof OnboardingFormData>).map((field) => {
                            const currentValue = initialData[field] || '';
                            const newValue = formData[field] || '';
                            const hasChanged = currentValue !== newValue;

                            return (
                              <TableRow key={field} className={hasChanged ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}>
                                <TableCell className="font-medium py-1.5">{getFieldLabel(field)}</TableCell>
                                <TableCell className="py-1.5">{getDisplayValue(field, currentValue)}</TableCell>
                                <TableCell className={`py-1.5 ${hasChanged ? "font-medium text-blue-600 dark:text-blue-400" : ""}`}>
                                  {getDisplayValue(field, newValue)}
                                  {hasChanged && (
                                    <Badge variant="outline" className="ml-2 py-0 h-5 bg-blue-50 dark:bg-blue-900/20">
                                      Updated
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchCurrentProfile}
                      className="flex items-center h-8"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Refresh Current Data
                    </Button>

                    <div className="text-sm text-gray-500">
                      {changedFieldsCount} field(s) will be updated
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Completion */}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold">You're all set!</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    Your profile has been configured. Now you can start your language learning journey with Linguify.
                  </p>

                  <Card className="w-full max-w-md border-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                    <CardHeader>
                      <CardTitle className="text-lg text-left text-indigo-700 dark:text-indigo-400">
                        Your Learning Path
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-left text-gray-700 dark:text-gray-300">
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">Learning Language:</span>
                            <p>{LANGUAGE_OPTIONS.find(l => l.value === formData.target_language)?.label || 'Unknown'}</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">Native Language:</span>
                            <p>{LANGUAGE_OPTIONS.find(l => l.value === formData.native_language)?.label || 'Unknown'}</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">Current Level:</span>
                            <p>{LEVEL_OPTIONS.find(l => l.value === formData.language_level)?.label || 'Beginner'}</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">Learning Goals:</span>
                            <p>{OBJECTIVES_OPTIONS.find(o => o.value === formData.objectives)?.label || 'General Learning'}</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">Interface Language:</span>
                            <p>{INTERFACE_LANGUAGE_OPTIONS.find(i => i.value === formData.interface_language)?.label || 'English'}</p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  {lastServerResponse && (
                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 w-full max-w-md mt-2">
                      <AlertTitle className="flex items-center text-green-700 dark:text-green-400">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Profile Successfully Updated
                      </AlertTitle>
                      <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
                        <p>Your profile was updated on {new Date().toLocaleString()}</p>
                        {showDevTools ? (
                          <p className="text-xs text-gray-500 mt-1">Server response data available in developer tools</p>
                        ) : (
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm text-indigo-600 dark:text-indigo-400"
                            onClick={() => setShowDevTools(true)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1 inline" />
                            View server response
                          </Button>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 flex justify-between">
          {/* Back button */}
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1 || step === totalSteps}
            className={step === 1 || step === totalSteps ? "invisible" : ""}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Action buttons */}
          <div className="flex gap-2">
            {step === totalSteps ? (
              <Button
                onClick={onComplete}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Start Learning
              </Button>
            ) : step === 5 ? (
              <>
                <Button
                  variant="outline"
                  onClick={nextStep}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || changedFieldsCount === 0}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">●</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={nextStep}
                disabled={
                  isSubmitting ||
                  (step === 3 && (
                    !formData.native_language ||
                    !formData.target_language ||
                    formData.native_language === formData.target_language
                  ))
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingFlow;