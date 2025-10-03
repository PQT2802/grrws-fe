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
import { CREATE_USER_REQUEST, ROLE_MAPPING, USER_LIST_ITEM } from "@/types/user.type";

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Define initial form state as a constant to ensure consistency
const INITIAL_FORM_STATE = {
  fullName: "",
  userName: "",
  email: "",
  password: "",
  dateOfBirth: null as Date | null,
  phoneNumber: "",
  role: "",
};

export const CreateUserModal = ({ open, onOpenChange, onSuccess }: CreateUserModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // ✅ NEW: Add state for role validation
  const [isValidatingRole, setIsValidatingRole] = useState(false);
  const [roleValidationError, setRoleValidationError] = useState<string>("");
  
  // Form state - using a function to ensure we get a fresh object each time
  const [formData, setFormData] = useState(() => ({ ...INITIAL_FORM_STATE }));

  // Form validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Phone number regex for Vietnamese format
  const phoneNumberRegex = /^\d{10,11}$/;

  // Password regex patterns
  const startsWithCapital = /^[A-Z]/;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
  const minLength = /.{3,}/;

  // Calculate age from date of birth
  const calculateAge = (birthDate: Date): number => {
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
  const validateField = (name: string, value: string | Date | null): string => {
    switch(name) {
      case 'fullName':
        return !value || !(value as string).trim() ? "Full name is required" : "";
      
      case 'userName':
        return !value || !(value as string).trim() ? "Username is required" : "";
      
      case 'email':
        if (!value || !(value as string).trim()) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(value as string)) return "Email format is invalid";
        return "";
      
      case 'password':
        if (!value || !(value as string).trim()) return "Password is required";
        if (!startsWithCapital.test(value as string)) return "Password must start with a capital letter";
        if (!hasSpecialChar.test(value as string)) return "Password must include at least one special character";
        if (!minLength.test(value as string)) return "Password must be at least 3 characters";
        return "";
      
      case 'phoneNumber':
        if (!value || !(value as string).trim()) return "Phone number is required";
        if (!phoneNumberRegex.test(value as string)) return "Phone number must contain 10–11 digits";
        return "";
      
      case 'dateOfBirth':
        if (!value) return "Date of birth is required";
        const age = calculateAge(value as Date);
        if (age < 18) return "User must be at least 18 years old";
        return "";
      
      case 'role':
        return !value ? "Role is required" : "";
      
      default:
        return "";
    }
  };

  // Reset form function - creates completely fresh state
  const resetForm = () => {
    console.log("🔄 Resetting form to initial state");
    setFormData({ ...INITIAL_FORM_STATE });
    setErrors({});
    setTouched({});
  };

  // Reset form when modal opens - this is the key fix
  useEffect(() => {
    if (open) {
      console.log("📂 Modal opened - resetting form");
      resetForm();
    }
  }, [open]);

  const handleBlur = (field: string) => {
    setTouched({...touched, [field]: true});
    
    // Validate the field on blur
    const value = field === 'dateOfBirth' ? formData.dateOfBirth : formData[field as keyof typeof formData];
    const error = validateField(field, value);
    setErrors({...errors, [field]: error});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // ✅ UPDATED: Handle role change with validation
  const handleRoleChange = async (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
    
    setTouched(prev => ({...prev, role: true}));
    
    // Clear previous errors
    setRoleValidationError("");
    if (errors.role) {
      setErrors(prev => ({
        ...prev,
        role: ""
      }));
    }

    // ✅ NEW: Validate Head of Technical role limit
    if (value === "Head of Technical") {
      await validateHeadOfTechnicalRole(value);
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      dateOfBirth: date || null
    }));
    
    setTouched(prev => ({...prev, dateOfBirth: true}));
    
    // Clear error when user selects a date
    if (errors.dateOfBirth) {
      setErrors(prev => ({
        ...prev,
        dateOfBirth: ""
      }));
    }
  };

  // ✅ NEW: Validate Head of Technical role limit
  const validateHeadOfTechnicalRole = async (selectedRole: string): Promise<boolean> => {
    if (selectedRole !== "Head of Technical") {
      setRoleValidationError("");
      return true;
    }

    try {
      setIsValidatingRole(true);
      setRoleValidationError("");

      console.log("🔍 Checking existing Head of Technical users...");

      // Get users with Head of Technical role (role number = 2)
      const headOfTechnicalUsers = await apiClient.user.getUserRole(2);
      
      console.log("👥 Existing Head of Technical users:", headOfTechnicalUsers);

      // Check if we got an array of users
      let existingUsers: any[] = [];
      
      if (Array.isArray(headOfTechnicalUsers)) {
        existingUsers = headOfTechnicalUsers;
      } else if (headOfTechnicalUsers?.data && Array.isArray(headOfTechnicalUsers.data)) {
        existingUsers = headOfTechnicalUsers.data;
      } else if (headOfTechnicalUsers?.data?.data && Array.isArray(headOfTechnicalUsers.data.data)) {
        existingUsers = headOfTechnicalUsers.data.data;
      }

      console.log("📊 Processed existing users:", existingUsers);

      // Check if there's already an active Head of Technical
      if (existingUsers.length > 0) {
        const activeHeadOfTechnical = existingUsers.find(user => 
          user.role === 2 || 
          user.Role === 2 ||
          (typeof user.role === 'string' && user.role.toLowerCase().includes('head of technical'))
        );

        if (activeHeadOfTechnical) {
          const errorMessage = `Hệ thống chỉ cho phép có 1 Head of Technical. Hiện tại đã có: ${activeHeadOfTechnical.fullName || activeHeadOfTechnical.userName || 'Unnamed User'}`;
          setRoleValidationError(errorMessage);
          
          // Also set it in form errors for consistent display
          setErrors(prev => ({
            ...prev,
            role: errorMessage
          }));
          
          toast.error(errorMessage);
          return false;
        }
      }

      console.log("✅ No existing Head of Technical found, can create new one");
      return true;

    } catch (error) {
      console.error("❌ Error validating Head of Technical role:", error);
      
      // On API error, assume validation passed but log the issue
      const fallbackMessage = "Không thể kiểm tra role Head of Technical. Vui lòng thử lại.";
      setRoleValidationError(fallbackMessage);
      setErrors(prev => ({
        ...prev,
        role: fallbackMessage
      }));
      
      toast.error(fallbackMessage);
      return false;
    } finally {
      setIsValidatingRole(false);
    }
  };

  // ✅ UPDATED: Enhanced form validation
  const validateForm = async (): Promise<boolean> => {
    const fieldErrors: Record<string, string> = {};
    let valid = true;

    // Validate all required fields (existing validation)
    Object.entries({
      fullName: formData.fullName,
      userName: formData.userName,
      email: formData.email,
      password: formData.password,
      phoneNumber: formData.phoneNumber,
      dateOfBirth: formData.dateOfBirth,
      role: formData.role
    }).forEach(([field, value]) => {
      const error = validateField(field, value);
      if (error) {
        fieldErrors[field] = error;
        valid = false;
      }
    });

    // ✅ NEW: Additional role validation for Head of Technical
    if (formData.role === "Head of Technical") {
      const roleValid = await validateHeadOfTechnicalRole(formData.role);
      if (!roleValid) {
        valid = false;
        // Error already set in validateHeadOfTechnicalRole
      }
    }

    setErrors(prev => ({...prev, ...fieldErrors}));
    return valid;
  };

  // ✅ UPDATED: Handle form submission with role validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);
    
    // ✅ UPDATED: Validate all fields including role restriction
    if (!(await validateForm())) {
      toast.error("Vui lòng kiểm tra lại thông tin nhập vào");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const payload: CREATE_USER_REQUEST = {
        FullName: formData.fullName,
        UserName: formData.userName,
        Email: formData.email,
        Password: formData.password,
        DateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toISOString() : undefined,
        PhoneNumber: formData.phoneNumber,
        Role: ROLE_MAPPING[formData.role] || 0,
      };
      
      // Extra validation for role
      if (payload.Role === 0) {
        toast.error("Vui lòng chọn vai trò hợp lệ");
        setErrors(prev => ({...prev, role: "Vai trò hợp lệ là bắt buộc"}));
        setIsLoading(false);
        return;
      }
      
      console.log("Creating user with payload:", JSON.stringify(payload));
      
      await apiClient.user.createUser(payload);
      
      toast.success("Tạo người dùng thành công!");
      resetForm();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      if (error.response?.data?.errors) {
        const validationErrors: Record<string, string> = {};
        
        Object.entries(error.response.data.errors).forEach(([key, messages]: [string, any]) => {
          const formKey = key.charAt(0).toLowerCase() + key.slice(1);
          validationErrors[formKey] = Array.isArray(messages) ? messages[0] : messages;
        });
        
        setErrors(validationErrors);
        toast.error("Vui lòng kiểm tra lại thông tin trong form");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Tạo người dùng thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = (value: boolean) => {
    if (!value) {
      // Reset form when closing
      resetForm();
    }
    onOpenChange(value);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={handleModalClose}
    >
      <DialogContent 
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking on date picker dropdown
          const target = e.target as Element;
          if (target?.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Thêm người dùng mới</DialogTitle>
          <DialogDescription>
            Điền thông tin để tạo tài khoản người dùng mới.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Full Name - Now Required */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={() => handleBlur('fullName')}
                placeholder="Nhập tên"
                className={errors.fullName && touched.fullName ? "border-red-500" : ""}
                autoFocus={false}
                autoComplete="off"
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
                placeholder="Nhập username"
                className={errors.userName && touched.userName ? "border-red-500" : ""}
                autoComplete="off"
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
                autoComplete="off"
              />
              {errors.email && touched.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>
            
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Mật khẩu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                placeholder="Nhập mật khẩu"
                className={errors.password && touched.password ? "border-red-500" : ""}
                autoComplete="new-password"
              />
              {errors.password && touched.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Phone Number - Now Required with Vietnamese validation */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                onBlur={() => handleBlur('phoneNumber')}
                placeholder="0123456789"
                className={errors.phoneNumber && touched.phoneNumber ? "border-red-500" : ""}
                autoComplete="off"
              />
              {errors.phoneNumber && touched.phoneNumber && (
                <p className="text-xs text-red-500">{errors.phoneNumber}</p>
              )}
            </div>
            
            {/* Date of Birth - Now with Improved Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                Ngày sinh <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth ? formData.dateOfBirth.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : undefined;
                  handleDateChange(newDate);
                }}
                className={errors.dateOfBirth && touched.dateOfBirth ? "border-red-500" : ""}
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
                Vai trò <span className="text-red-500">*</span>
                {isValidatingRole && (
                  <span className="ml-2 text-xs text-blue-600">Đang kiểm tra...</span>
                )}
              </Label>
              <Select 
                value={formData.role} 
                onValueChange={handleRoleChange}
                onOpenChange={() => setTouched(prev => ({...prev, role: true}))}
                key={`role-select-${open}`}
                disabled={isValidatingRole || isLoading}
              >
                <SelectTrigger 
                  id="role" 
                  className={`${
                    (errors.role || roleValidationError) && touched.role ? "border-red-500" : ""
                  } ${isValidatingRole ? "opacity-70" : ""}`}
                >
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Head Department">Head Department</SelectItem>
                  <SelectItem value="Head of Technical">
                    <div className="flex items-center gap-2">
                      <span>Head of Technical</span>
                      <span className="text-xs text-orange-600">(Chỉ 1 người)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Mechanic">Mechanic</SelectItem>
                  <SelectItem value="Stock Keeper">Stock Keeper</SelectItem>
                </SelectContent>
              </Select>
              
              {/* ✅ NEW: Display role validation error */}
              {((errors.role || roleValidationError) && touched.role) && (
                <div className="space-y-1">
                  <p className="text-xs text-red-500">
                    {roleValidationError || errors.role}
                  </p>
                  {roleValidationError && (
                    <p className="text-xs text-gray-500">
                      💡 Tip: Kiểm tra danh sách người dùng để xem Head of Technical hiện tại
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleModalClose(false)}
              disabled={isLoading || isValidatingRole}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || isValidatingRole || !!roleValidationError}
              className={`${
                (isLoading || isValidatingRole) ? "opacity-70" : ""
              } ${
                roleValidationError ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Đang tạo..." : 
               isValidatingRole ? "Đang kiểm tra..." : 
               "Tạo người dùng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};