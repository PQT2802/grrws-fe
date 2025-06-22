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
import { CREATE_USER_REQUEST, ROLE_MAPPING } from "@/types/user.type";

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateUserModal = ({ open, onOpenChange, onSuccess }: CreateUserModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    email: "",
    password: "",
    dateOfBirth: "",
    phoneNumber: "",
    role: "",
  });

  // Form validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Password regex patterns
  const startsWithCapital = /^[A-Z]/;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
  const minLength = /.{3,}/;

  // Validate form fields
  const validateField = (name: string, value: string): string => {
    switch(name) {
      case 'userName':
        return !value.trim() ? "Username is required" : "";
      
      case 'email':
        if (!value.trim()) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(value)) return "Email format is invalid";
        return "";
      
      case 'password':
        if (!value.trim()) return "Password is required";
        if (!startsWithCapital.test(value)) return "Password must start with a capital letter";
        if (!hasSpecialChar.test(value)) return "Password must include at least one special character";
        if (!minLength.test(value)) return "Password must be at least 3 characters";
        return "";
      
      case 'role':
        return !value ? "Role is required" : "";
      
      default:
        return "";
    }
  };

  // Validate all form fields and update form validity
  const validateForm = () => {
    const fieldErrors: Record<string, string> = {};
    let valid = true;

    // Validate each required field
    Object.entries({
      userName: formData.userName,
      email: formData.email,
      password: formData.password,
      role: formData.role
    }).forEach(([field, value]) => {
      const error = validateField(field, value as string);
      if (error) {
        fieldErrors[field] = error;
        valid = false;
      }
    });

    setErrors({...errors, ...fieldErrors});
    setIsFormValid(valid);
    return valid;
  };

  // Validate on input change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      validateForm();
    }
  }, [formData]);

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
      password: "",
      dateOfBirth: "",
      phoneNumber: "",
      role: "",
    });
    setErrors({});
    setTouched({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Double check that we're sending valid data
      console.log("Submitting user with role:", formData.role, "mapped to:", ROLE_MAPPING[formData.role]);
      
      const payload: CREATE_USER_REQUEST = {
        FullName: formData.fullName || undefined,
        UserName: formData.userName,
        Email: formData.email,
        Password: formData.password,
        DateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        PhoneNumber: formData.phoneNumber || undefined,
        Role: ROLE_MAPPING[formData.role] || 0,
      };
      
      // Extra validation for role
      if (payload.Role === 0) {
        toast.error("Please select a valid role");
        setErrors({...errors, role: "A valid role is required"});
        setIsLoading(false);
        return;
      }
      
      // Log the exact payload being sent for debugging
      console.log("Creating user with payload:", JSON.stringify(payload));
      
      await apiClient.user.createUser(payload);
      
      toast.success("User created successfully!");
      resetForm();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      
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
        toast.error("Failed to create user. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new user account.
          </DialogDescription>
        </DialogHeader>
        
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
            
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                placeholder="Enter password"
                className={errors.password && touched.password ? "border-red-500" : ""}
              />
              {errors.password && touched.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
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
                </SelectContent>
              </Select>
              {errors.role && touched.role && (
                <p className="text-xs text-red-500">{errors.role}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className={isLoading ? "opacity-70" : ""}
            >
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};