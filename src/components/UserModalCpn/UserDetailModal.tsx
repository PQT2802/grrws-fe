import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Mail, Calendar, Phone } from "lucide-react";
import { USER_LIST_ITEM } from "@/types/user.type";

interface UserDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: USER_LIST_ITEM | null;
  formatDate: (date: string) => string;
  getRoleNameFromNumber: (role: number) => string;
  getRoleBadgeVariant: (role: number) => string;
}

export const UserDetailModal = ({
  open,
  onOpenChange,
  user,
  formatDate,
  getRoleNameFromNumber,
  getRoleBadgeVariant
}: UserDetailModalProps) => {
  // Handle modal close with proper cleanup
  const handleOpenChange = (newOpen: boolean) => {
    // Immediately call the parent's onOpenChange
    onOpenChange(newOpen);
    
    // If closing, ensure pointer events are restored
    if (!newOpen) {
      // Use setTimeout to ensure this runs after the modal animation
      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
        document.body.style.overflow = "auto";
      }, 100);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]" onEscapeKeyDown={() => handleOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View user information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">
                {user.fullName?.charAt(0) || user.userName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-2xl font-semibold">
                {user.fullName || user.userName || "Unnamed User"}
              </h3>
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant="outline" className={`${getRoleBadgeVariant(user.role)} border-0`}>
                  {getRoleNameFromNumber(user.role)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium">Detailed Information</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Full Name</Label>
                <div className="flex items-center gap-2">
                  <span>{user.fullName || "Chưa cung cấp"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">User Name</Label>
                <div className="flex items-center gap-2">
                  <span>{user.userName || "Chưa cung cấp"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email || "Chưa cung cấp"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Phone</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.phoneNumber || "Chưa cung cấp"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Date Of Birth</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(user.dateOfBirth)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Created Date</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(user.createdDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};