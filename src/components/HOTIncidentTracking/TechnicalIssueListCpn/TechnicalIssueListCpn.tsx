"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Loader2,
  Wrench,
  Code,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { TechnicalIssue } from "@/types/incident.type";
import { apiClient } from "@/lib/api-client";

interface TechnicalIssueListCpnProps {
  onEditTechnicalIssue: (issue: TechnicalIssue) => void;
  onDeleteTechnicalIssue: (issue: TechnicalIssue) => void;
  onViewTechnicalIssue: (issue: TechnicalIssue) => void;
}

export interface TechnicalIssueListCpnRef {
  refetchTechnicalIssues: () => Promise<void>;
}

const TechnicalIssueListCpn = forwardRef<
  TechnicalIssueListCpnRef,
  TechnicalIssueListCpnProps
>(
  (
    { onEditTechnicalIssue, onDeleteTechnicalIssue, onViewTechnicalIssue },
    ref
  ) => {
    const [technicalIssues, setTechnicalIssues] = useState<TechnicalIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    const fetchTechnicalIssues = useCallback(async () => {
      try {
        setLoading(true);
        console.log(`🔄 Fetching technical issues (page ${currentPage}, search: "${searchTerm}")`);
        
        const response = await apiClient.incident.getTechnicalIssues(
          currentPage,
          itemsPerPage,
          searchTerm || undefined
        );

        console.log("📋 Technical Issues API response:", response);

        // ✅ Enhanced response handling for multiple possible structures
        let technicalIssuesData: TechnicalIssue[] = [];
        let totalCount = 0;

        if (response && typeof response === 'object') {
          // Structure 1: { extensions: { data: { data: [], totalCount: number } } }
          if (response.extensions?.data?.data && Array.isArray(response.extensions.data.data)) {
            technicalIssuesData = response.extensions.data.data;
            totalCount = response.extensions.data.totalCount || technicalIssuesData.length;
            console.log("✅ Using structure: extensions.data.data");
          }
          // Structure 2: { data: { data: [], totalCount: number } }
          else if (response.data?.data && Array.isArray(response.data.data)) {
            technicalIssuesData = response.data.data;
            totalCount = response.data.totalCount || technicalIssuesData.length;
            console.log("✅ Using structure: data.data");
          }
          // Structure 3: { data: [] } with totalCount at root
          else if (response.data && Array.isArray(response.data)) {
            technicalIssuesData = response.data;
            totalCount = response.totalCount || response.totalItems || technicalIssuesData.length;
            console.log("✅ Using structure: data (array)");
          }
          // Structure 4: Direct array response
          else if (Array.isArray(response)) {
            technicalIssuesData = response;
            totalCount = technicalIssuesData.length;
            console.log("✅ Using structure: direct array");
          }
          // Structure 5: { technicalIssues: [] } (alternative field name)
          else if (response.technicalIssues && Array.isArray(response.technicalIssues)) {
            technicalIssuesData = response.technicalIssues;
            totalCount = response.totalCount || response.totalItems || technicalIssuesData.length;
            console.log("✅ Using structure: technicalIssues field");
          }
          // Structure 6: { symptoms: [] } (possible API field name)
          else if (response.symptoms && Array.isArray(response.symptoms)) {
            technicalIssuesData = response.symptoms;
            totalCount = response.totalCount || response.totalItems || technicalIssuesData.length;
            console.log("✅ Using structure: symptoms field");
          }
          // Structure 7: { items: [] } (pagination wrapper)
          else if (response.items && Array.isArray(response.items)) {
            technicalIssuesData = response.items;
            totalCount = response.totalCount || response.totalItems || technicalIssuesData.length;
            console.log("✅ Using structure: items field");
          }
          else {
            console.warn("⚠️ Unrecognized response structure, attempting to find array data...");
            console.log("🔍 Response keys:", Object.keys(response));
            
            // Try to find any array in the response object
            const possibleArrays = Object.values(response).filter(value => Array.isArray(value));
            if (possibleArrays.length > 0) {
              technicalIssuesData = possibleArrays[0] as TechnicalIssue[];
              totalCount = technicalIssuesData.length;
              console.log("✅ Found array data in response:", technicalIssuesData.length, "items");
            } else {
              console.error("❌ No array data found in response");
              technicalIssuesData = [];
              totalCount = 0;
            }
          }
        } else {
          console.error("❌ Invalid response type:", typeof response);
          technicalIssuesData = [];
          totalCount = 0;
        }

        // Set the extracted data
        setTechnicalIssues(technicalIssuesData);
        setTotalItems(totalCount);
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
        
        console.log(`✅ Successfully loaded ${technicalIssuesData.length} technical issues (total: ${totalCount})`);
        
      } catch (error) {
        console.error("❌ Failed to fetch technical issues:", error);
        toast.error("Failed to load technical issues");
        setTechnicalIssues([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, [currentPage, searchTerm]);

    useEffect(() => {
      fetchTechnicalIssues();
    }, [fetchTechnicalIssues]);

    useImperativeHandle(ref, () => ({
      refetchTechnicalIssues: fetchTechnicalIssues,
    }));

    const handleSearch = (value: string) => {
      setSearchTerm(value);
      setCurrentPage(1);
    };

    const getCommonBadgeVariant = (isCommon: boolean) => {
      return isCommon
        ? "bg-green-500/10 text-green-400 border-green-500/20 dark:bg-green-500/20 dark:text-green-300"
        : "bg-gray-500/10 text-gray-400 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300";
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading technical issues...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Technical Issue Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and resolve technical issues across devices and systems
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Technical Issues
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="mr-2 h-4 w-4" />
              Import Technical Issue
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 p-4 bg-background/50 dark:bg-muted/20 rounded-lg border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search technical issues by name or description..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-background/50 border-muted"
            />
          </div>
          <Badge variant="secondary" className="px-3 py-2">
            {totalItems} technical issues found
          </Badge>
        </div>

        {/* Technical Issues Table */}
        <div className="border rounded-lg bg-background/50 dark:bg-card/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="font-semibold">Issue Details</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Occurrences</TableHead>
                <TableHead className="w-[100px] text-center font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicalIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">
                        No technical issues found
                      </p>
                      <p className="text-sm text-muted-foreground/80 mt-1">
                        Try adjusting your search criteria
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                technicalIssues.map((issue) => (
                  <TableRow
                    key={issue.symptomCode}
                    className="hover:bg-muted/30 border-border/50"
                  >
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm font-medium text-foreground">
                            {issue.symptomCode}
                          </span>
                        </div>
                        <div className="font-medium text-foreground">
                          {issue.name}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                          {issue.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCommonBadgeVariant(issue.isCommon)}>
                        {issue.isCommon ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Common
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Unique
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-medium text-foreground">
                          {issue.occurrenceCount}x
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-muted/50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => onViewTechnicalIssue(issue)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEditTechnicalIssue(issue)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit Issue
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteTechnicalIssue(issue)}
                            className="gap-2 text-red-400 focus:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Issue
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-background/50 dark:bg-muted/20 rounded-lg border">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              technical issues
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

TechnicalIssueListCpn.displayName = "TechnicalIssueListCpn";

export default TechnicalIssueListCpn;