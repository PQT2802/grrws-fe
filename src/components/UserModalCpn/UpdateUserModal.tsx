import React, { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/api-client";
import { ROLE_MAPPING } from "@/types/user.type";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";

interface UpdateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userId: string | null;
}

interface UserData {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl: string;
  dateOfBirth: string;
  role: number;
}

export const UpdateUserModal = ({ open, onOpenChange, onSuccess, userId }: UpdateUserModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userData, setUserData] = useState<UserData | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    email: "",
    phoneNumber: "",
    profilePictureUrl: "",
    dateOfBirth: "",
    role: "",
  });

  // Form validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Phone number regex for Vietnamese format
  const phoneNumberRegex = /^\d{10,11}$/;

  // Get role name from role number
  const getRoleNameFromNumber = (role: number): string => {
    const roleEntry = Object.entries(ROLE_MAPPING).find(([, value]) => value === role);
    return roleEntry ? roleEntry[0] : "";
  };

  // Calculate age from date of birth
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Validate form fields
  const validateField = (name: string, value: string): string => {
    switch(name) {
      case 'fullName':
        return !value.trim() ? "Full name is required" : "";
      
      case 'userName':
        return !value.trim() ? "Username is required" : "";
      
      case 'email':
        if (!value.trim()) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(value)) return "Email format is invalid";
        return "";
      
      case 'phoneNumber':
        if (!value.trim()) return "Phone number is required";
        if (!phoneNumberRegex.test(value)) return "Phone number must contain 10–11 digits";
        return "";
      
      case 'dateOfBirth':
        if (!value.trim()) return "Date of birth is required";
        const age = calculateAge(value);
        if (age < 18) return "User must be at least 18 years old";
        return "";
      
      case 'role':
        return !value ? "Role is required" : "";
      
      default:
        return "";
    }
  };

  // Fetch user data when modal opens
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchUserData = async () => {
      if (!open || !userId) return;
      
      setIsFetching(true);
      try {
        console.log("🔍 Fetching user data for ID:", userId);
        const response = await apiClient.user.getUserById(userId);
        console.log("📊 User data response:", response);
        
        if (isMounted) {
          const user = response.data || response;
          setUserData(user);
          
          // Populate form with user data
          setFormData({
            fullName: user.fullName || "",
            userName: user.userName || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
            profilePictureUrl: user.profilePictureUrl || "",
            dateOfBirth: user.dateOfBirth && user.dateOfBirth !== "0001-01-01T00:00:00" 
              ? user.dateOfBirth.split('T')[0] 
              : "",
            role: getRoleNameFromNumber(user.role),
          });
          
          console.log("✅ User data loaded successfully");
        }
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
        if (isMounted) {
          toast.error("Failed to load user data");
          onOpenChange(false);
        }
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
      controller.abort();
      document.body.style.pointerEvents = '';
    };
  }, [open, userId]);

  const handleBlur = (field: string) => {
    setTouched({...touched, [field]: true});
    
    // Validate the field on blur
    const error = validateField(field, formData[field as keyof typeof formData] as string);
    setErrors({...errors, [field]: error});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear backend error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData({
      ...formData,
      role: value
    });
    
    setTouched({...touched, role: true});
    
    // Clear error when user selects a role
    if (errors.role) {
      setErrors({
        ...errors,
        role: ""
      });
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData({
      ...formData,
      dateOfBirth: date ? format(date, 'yyyy-MM-dd') : ""
    });
    
    setTouched({...touched, dateOfBirth: true});
    
    // Clear error when user selects a date
    if (errors.dateOfBirth) {
      setErrors({
        ...errors,
        dateOfBirth: ""
      });
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      userName: "",
      email: "",
      phoneNumber: "",
      profilePictureUrl: "",
      dateOfBirth: "",
      role: "",
    });
    setErrors({});
    setTouched({});
    setUserData(null);
    setIsFetching(false);
    setDatePickerOpen(false);
    
    setTimeout(() => {
      document.body.style.pointerEvents = '';
    }, 100);
  };

  const validateForm = (): boolean => {
    const fieldErrors: Record<string, string> = {};
    let valid = true;

    // Validate required fields
    Object.entries({
      fullName: formData.fullName,
      userName: formData.userName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      dateOfBirth: formData.dateOfBirth,
      role: formData.role
    }).forEach(([field, value]) => {
      const error = validateField(field, value as string);
      if (error) {
        fieldErrors[field] = error;
        valid = false;
      }
    });

    setErrors({...errors, ...fieldErrors});
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData) {
      toast.error("User data not loaded");
      return;
    }
    
    // Mark all fields as touched for validation
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);
    
    // Validate all fields before submission
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const payload = {
        Id: userData.id,
        FullName: formData.fullName,
        UserName: formData.userName,
        Email: formData.email,
        PhoneNumber: formData.phoneNumber,
        ProfilePictureUrl: formData.profilePictureUrl || undefined,
        DateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        Role: ROLE_MAPPING[formData.role] || 0,
      };
      
      // Extra validation for role
      if (payload.Role === 0) {
        toast.error("Please select a valid role");
        setErrors({...errors, role: "A valid role is required"});
        setIsLoading(false);
        return;
      }
      
      console.log("Updating user with payload:", JSON.stringify(payload));
      
      await apiClient.user.updateUser(payload);
      
      toast.success("User updated successfully!");
      resetForm();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error updating user:", error);
      
      if (error.response?.data?.errors) {
        const validationErrors: Record<string, string> = {};
        
        Object.entries(error.response.data.errors).forEach(([key, messages]: [string, any]) => {
          const formKey = key.charAt(0).toLowerCase() + key.slice(1);
          validationErrors[formKey] = Array.isArray(messages) ? messages[0] : messages;
        });
        
        setErrors(validationErrors);
        toast.error("Please correct the errors in the form");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update user. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate default date (18 years ago) for better UX
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

  return (
    <Dialog 
      open={open} 
      onOpenChange={(value) => {
        if (!value) {
          resetForm();
          setTimeout(() => {
            onOpenChange(value);
          }, 50);
        } else {
          onOpenChange(value);
        }
      }}
    >
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update User</DialogTitle>
          <DialogDescription>
            Make changes to the user account information.
          </DialogDescription>
        </DialogHeader>
        
        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading user data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Full Name - Now Required */}
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('fullName')}
                  placeholder="Enter full name"
                  className={errors.fullName && touched.fullName ? "border-red-500" : ""}
                  autoFocus={false}
                />
                {errors.fullName && touched.fullName && (
                  <p className="text-xs text-red-500">{errors.fullName}</p>
                )}
              </div>
              
              {/* User Name */}
              <div className="space-y-2">
                <Label htmlFor="userName">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="userName"
                  name="userName"
                  value={formData.userName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('userName')}
                  placeholder="Enter username"
                  className={errors.userName && touched.userName ? "border-red-500" : ""}
                  autoFocus={false}
                />
                {errors.userName && touched.userName && (
                  <p className="text-xs text-red-500">{errors.userName}</p>
                )}
              </div>
              
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="email@example.com"
                  className={errors.email && touched.email ? "border-red-500" : ""}
                  autoFocus={false}
                />
                {errors.email && touched.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>
              
              {/* Phone Number - Now Required with Vietnamese validation */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phoneNumber')}
                  placeholder="0123456789"
                  className={errors.phoneNumber && touched.phoneNumber ? "border-red-500" : ""}
                  autoFocus={false}
                />
                {errors.phoneNumber && touched.phoneNumber && (
                  <p className="text-xs text-red-500">{errors.phoneNumber}</p>
                )}
              </div>
              
              {/* Date of Birth - Now with Improved Date Picker */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                  onChange={handleDateChange}
                  placeholder="Select date of birth"
                  error={!!(errors.dateOfBirth && touched.dateOfBirth)}
                />
                {errors.dateOfBirth && touched.dateOfBirth && (
                  <p className="text-xs text-red-500">{errors.dateOfBirth}</p>
                )}
                {formData.dateOfBirth && (
                  <p className="text-xs text-muted-foreground">
                    Age: {calculateAge(formData.dateOfBirth)} years old
                  </p>
                )}
              </div>
              
              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.role} 
                  onValueChange={handleRoleChange}
                  onOpenChange={() => setTouched({...touched, role: true})}
                >
                  <SelectTrigger id="role" className={errors.role && touched.role ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Head Department">Head Department</SelectItem>
                    <SelectItem value="Head of Technical">Head of Technical</SelectItem>
                    <SelectItem value="Mechanic">Mechanic</SelectItem>
                    <SelectItem value="Stock Keeper">Stock Keeper</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && touched.role && (
                  <p className="text-xs text-red-500">{errors.role}</p>
                )}
              </div>
              
              {/* Profile Picture URL */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profilePictureUrl">Profile Picture URL</Label>
                <Input
                  id="profilePictureUrl"
                  name="profilePictureUrl"
                  value={formData.profilePictureUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className={errors.profilePictureUrl ? "border-red-500" : ""}
                  autoFocus={false}
                />
                {errors.profilePictureUrl && (
                  <p className="text-xs text-red-500">{errors.profilePictureUrl}</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isFetching}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || isFetching}
                className={isLoading ? "opacity-70" : ""}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update User"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};