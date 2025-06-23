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

  // Get role name from role number
  const getRoleNameFromNumber = (role: number): string => {
    const roleEntry = Object.entries(ROLE_MAPPING).find(([, value]) => value === role);
    return roleEntry ? roleEntry[0] : "";
  };

  // Validate form fields (similar to create but without duplicate checks)
  const validateField = (name: string, value: string): string => {
    switch(name) {
      case 'userName':
        return !value.trim() ? "Username is required" : "";
      
      case 'email':
        if (!value.trim()) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(value)) return "Email format is invalid";
        return "";
      
      case 'role':
        return !value ? "Role is required" : "";
      
      default:
        return "";
    }
  };

  // Fetch user data when modal opens
  useEffect(() => {
    let isMounted = true; // Track if component is mounted
    const controller = new AbortController(); // For canceling fetch requests
    
    const fetchUserData = async () => {
      if (!open || !userId) return;
      
      setIsFetching(true);
      try {
        console.log("🔍 Fetching user data for ID:", userId);
        const response = await apiClient.user.getUserById(userId);
        console.log("📊 User data response:", response);
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Handle the response structure based on your API
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
        // Only show error and close if still mounted
        if (isMounted) {
          toast.error("Failed to load user data");
          onOpenChange(false);
        }
      } finally {
        // Only update loading state if still mounted
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    fetchUserData();

    // Cleanup function
    return () => {
      isMounted = false; // Prevent state updates after unmount
      controller.abort(); // Cancel any in-progress fetch
      document.body.style.pointerEvents = ''; // Ensure body interactions are restored
    };
  }, [open, userId]);  // Remove onOpenChange from dependencies

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
    setIsFetching(false); // Make sure loading state is reset
    
    // Ensure document body is fully interactive
    setTimeout(() => {
      document.body.style.pointerEvents = '';
    }, 100);
  };

  const validateForm = (): boolean => {
    const fieldErrors: Record<string, string> = {};
    let valid = true;

    // Validate required fields
    Object.entries({
      userName: formData.userName,
      email: formData.email,
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
        FullName: formData.fullName || undefined,
        UserName: formData.userName,
        Email: formData.email,
        PhoneNumber: formData.phoneNumber || undefined,
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
        // Map backend validation errors to form fields
        const validationErrors: Record<string, string> = {};
        
        Object.entries(error.response.data.errors).forEach(([key, messages]: [string, any]) => {
          // Convert key from server format (PascalCase) to client format (camelCase)
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

  return (
    <Dialog 
      open={open} 
      onOpenChange={(value) => {
        if (!value) {
          // First reset form
          resetForm();
          // Then notify parent after a small delay
          setTimeout(() => {
            onOpenChange(value);
          }, 50);
        } else {
          onOpenChange(value);
        }
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
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
                />
                {errors.userName && touched.userName && (
                  <p className="text-xs text-red-500">{errors.userName}</p>
                )}
              </div>
              
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className={errors.fullName ? "border-red-500" : ""}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500">{errors.fullName}</p>
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
                />
                {errors.email && touched.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>
              
              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={errors.phoneNumber ? "border-red-500" : ""}
                />
                {errors.phoneNumber && (
                  <p className="text-xs text-red-500">{errors.phoneNumber}</p>
                )}
              </div>
              
              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={errors.dateOfBirth ? "border-red-500" : ""}
                />
                {errors.dateOfBirth && (
                  <p className="text-xs text-red-500">{errors.dateOfBirth}</p>
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