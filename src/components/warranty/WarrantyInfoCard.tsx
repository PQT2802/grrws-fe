import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WARRANTY_TASK_DETAIL } from "@/types/task.type";
import { Shield, DollarSign, MapPin, FileText, Phone } from "lucide-react";

interface WarrantyInfoCardProps {
  taskDetail: WARRANTY_TASK_DETAIL;
  getClaimStatusColor: (status: string) => string;
}

const WarrantyInfoCard = ({
  taskDetail,
  getClaimStatusColor,
}: WarrantyInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Warranty Information
        </CardTitle>
        <CardDescription>Details about the warranty claim</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-100 dark:border-blue-800">
          <div className="flex-shrink-0 flex justify-center">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {taskDetail.warrantyProvider}
            </div>
            <div className="font-bold text-lg text-blue-900 dark:text-blue-100">
              {taskDetail.claimNumber}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Warranty Code: {taskDetail.warrantyCode}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Claim Status
            </label>
            <div className="mt-1">
              <Badge className={getClaimStatusColor(taskDetail.claimStatus)}>
                {taskDetail.claimStatus}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Contract Number
            </label>
            <p className="mt-1 text-sm font-medium">
              {taskDetail.contractNumber || "Not provided"}
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Issue Description
          </label>
          <p className="mt-1 text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
            {taskDetail.issueDescription}
          </p>
        </div>

        {taskDetail.warrantyNotes && (
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Warranty Notes
            </label>
            <p className="mt-1 text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
              {taskDetail.warrantyNotes}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-500" />
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Technical Number
            </label>
            <p className="text-sm">{taskDetail.hotNumber || "N/A"}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-gray-500 mt-1" />
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Service Location
            </label>
            <p className="text-sm">{taskDetail.location}</p>
          </div>
        </div>

        {taskDetail.claimAmount && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Claim Amount
              </label>
              <p className="text-sm font-medium">
                ${taskDetail.claimAmount.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WarrantyInfoCard;
