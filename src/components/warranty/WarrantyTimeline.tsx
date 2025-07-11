import React from "react";
import { formatAPIDateToHoChiMinh } from "@/lib/utils";
import { DOCUMENT, WARRANTY_TASK_DETAIL } from "@/types/task.type";
import { DEVICE_WEB } from "@/types/device.type";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FileText,
  Clock,
  Check,
  FileImage,
  FileIcon,
  Shield,
  Eye,
  Download,
  AlertTriangle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WarrantyTimelineProps {
  taskDetail: WARRANTY_TASK_DETAIL;
  deviceDetail: DEVICE_WEB | null;
  documents: DOCUMENT[];
}

const WarrantyTimeline = ({
  taskDetail,
  deviceDetail,
  documents,
}: WarrantyTimelineProps) => {
  // Get file icon based on document type or URL
  const getFileIcon = (document: DOCUMENT) => {
    const type = document.docymentType?.toLowerCase() || "";
    const url = document.documentUrl?.toLowerCase() || "";

    if (type.includes("pdf") || url.endsWith(".pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (
      type.includes("image") ||
      url.match(/\.(jpg|jpeg|png|gif|webp)$/)
    ) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    } else if (type.includes("warranty") || type.includes("claim")) {
      return <Shield className="h-5 w-5 text-indigo-500" />;
    } else {
      return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Handle document view
  const handleViewDocument = (document: DOCUMENT) => {
    window.open(document.documentUrl, "_blank");
  };

  // Group documents by type instead of creation date
  const initialDocs = documents.filter(
    (doc) =>
      doc.docymentType?.toLowerCase()?.includes("initial") ||
      doc.docymentType?.toLowerCase()?.includes("claim") ||
      doc.documentName?.toLowerCase()?.includes("claim")
  );

  const returnDocs = documents.filter(
    (doc) =>
      doc.docymentType?.toLowerCase()?.includes("return") ||
      doc.docymentType?.toLowerCase()?.includes("resolution") ||
      doc.documentName?.toLowerCase()?.includes("return")
  );

  // All other documents are considered "during service"
  const duringServiceDocs = documents.filter(
    (doc) => !initialDocs.includes(doc) && !returnDocs.includes(doc)
  );

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute top-0 bottom-0 left-5 w-1 bg-blue-200 dark:bg-blue-700 ml-2.5"></div>

      <div className="space-y-12 relative z-10 ml-2">
        {/* Claim Created */}
        <div>
          <div className="flex gap-4 items-start">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <div className="text-lg font-medium text-blue-700 dark:text-blue-300">
                  Warranty Claim Created
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatAPIDateToHoChiMinh(taskDetail.startDate)}
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md border border-blue-100 dark:border-blue-900 text-sm">
                <div className="mb-2">
                  <span className="font-semibold">Claim #:</span>{" "}
                  {taskDetail.claimNumber}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Contract #:</span>{" "}
                  {taskDetail.contractNumber || "N/A"}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Technical #:</span>{" "}
                  {taskDetail.hotNumber || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Issue:</span>{" "}
                  {taskDetail.issueDescription}
                </div>
              </div>
            </div>
          </div>

          {/* Initial Documents */}
          {initialDocs.length > 0 && (
            <div className="ml-16 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialDocs.map((doc, idx) => (
                <Card key={idx} className="border-blue-100">
                  <CardHeader className="py-2 px-3 bg-blue-50 flex flex-row items-center gap-2">
                    {getFileIcon(doc)}
                    <CardTitle className="text-sm truncate">
                      {doc.documentName}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="py-2 px-3 flex justify-end gap-1 bg-white">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewDocument(doc)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Document</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={doc.documentUrl}
                            download
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Download</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* During Service Documents */}
        {duringServiceDocs.length > 0 && (
          <div className="flex gap-4 items-start">
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
              <FileIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="text-lg font-medium text-amber-700 dark:text-amber-300">
                During Warranty Service
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {duringServiceDocs.map((doc, idx) => (
                  <Card key={idx} className="border-amber-100">
                    <CardHeader className="py-2 px-3 bg-amber-50 flex flex-row items-center gap-2">
                      {getFileIcon(doc)}
                      <CardTitle className="text-sm truncate">
                        {doc.documentName}
                      </CardTitle>
                    </CardHeader>
                    <CardFooter className="py-2 px-3 flex justify-end gap-1 bg-white">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewDocument(doc)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Document</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={doc.documentUrl}
                              download
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Expected Return Date */}
        {taskDetail.expectedReturnDate && (
          <div className="flex gap-4 items-start">
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-lg font-medium text-purple-700 dark:text-purple-300">
                  Expected Return Date
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatAPIDateToHoChiMinh(taskDetail.expectedReturnDate)}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-md border border-purple-100 dark:border-purple-900 text-sm">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                  <div>
                    The device is expected to be returned by this date according
                    to the warranty provider.
                    {!taskDetail.actualReturnDate &&
                      new Date(taskDetail.expectedReturnDate) < new Date() && (
                        <div className="mt-2 text-amber-600 font-medium">
                          This date has passed without the device being
                          returned.
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actual Return */}
        {taskDetail.actualReturnDate ? (
          <div>
            <div className="flex gap-4 items-start">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2 flex-1">
                <div>
                  <div className="text-lg font-medium text-green-700 dark:text-green-300">
                    Device Returned
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatAPIDateToHoChiMinh(taskDetail.actualReturnDate)}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-md border border-green-100 dark:border-green-900 text-sm">
                  <div className="mb-2">
                    <span className="font-semibold">Resolution:</span>{" "}
                    {taskDetail.resolution || "No resolution provided"}
                  </div>

                  {taskDetail.warrantyNotes && (
                    <div>
                      <span className="font-semibold">Notes:</span>{" "}
                      {taskDetail.warrantyNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Return Documents */}
            {returnDocs.length > 0 && (
              <div className="ml-16 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {returnDocs.map((doc, idx) => (
                  <Card key={idx} className="border-green-100">
                    <CardHeader className="py-2 px-3 bg-green-50 flex flex-row items-center gap-2">
                      {getFileIcon(doc)}
                      <CardTitle className="text-sm truncate">
                        {doc.documentName}
                      </CardTitle>
                    </CardHeader>
                    <CardFooter className="py-2 px-3 flex justify-end gap-1 bg-white">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewDocument(doc)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Document</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={doc.documentUrl}
                              download
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-4 items-start opacity-60">
            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
              <Clock className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Pending Return
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Not returned yet
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-100 dark:border-gray-700 text-sm">
                The device has not been returned from warranty service yet.
                {taskDetail.expectedReturnDate && (
                  <div className="mt-2">
                    Expected by:{" "}
                    {formatAPIDateToHoChiMinh(taskDetail.expectedReturnDate)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarrantyTimeline;
