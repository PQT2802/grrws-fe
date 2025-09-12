"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  X,
  Check,
  Loader2,
  Search,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { AddTaskErrorPayload } from "@/types/error.type";
import {
  SUGGEST_OBJECT_REQUEST,
  SUGGEST_OBJECT_RESPONSE,
} from "@/types/comon.type";
import { ErrorDetail } from "@/types/task.type";

type ErrorSuggestion = SUGGEST_OBJECT_RESPONSE;

interface AddErrorToTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  listError: ErrorDetail[]; // List of errors already associated with the task
  onErrorsAdded: () => void;
}

const AddErrorToTaskModal = ({
  open,
  onOpenChange,
  listError,
  taskId,
  onErrorsAdded,
}: AddErrorToTaskModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ErrorSuggestion[]>([]);
  // Persist selectedErrors across modal toggles
  const selectedErrorsRef = useRef<ErrorSuggestion[]>([]);
  const [selectedErrors, setSelectedErrors] = useState<ErrorSuggestion[]>(
    selectedErrorsRef.current
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  // Sync selectedErrors with ref for persistence
  useEffect(() => {
    selectedErrorsRef.current = selectedErrors;
  }, [selectedErrors]);

  // Fetch suggestions when query changes (with debounce)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery || searchQuery.length < 1) {
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);
        const request: SUGGEST_OBJECT_REQUEST = {
          query: searchQuery,
          maxResults: 5,
        };
        const response = await apiClient.error.getSuggestedErrors(request);
        // Filter out errors that are already selected or already in the task
        const filteredSuggestions = response.filter(
          (suggestion) =>
            !selectedErrors.some((selected) => selected.id === suggestion.id) &&
            !listError.some((err) => err.errorId === suggestion.id)
        );
        setSuggestions(filteredSuggestions);
      } catch (error) {
        console.error("Failed to fetch error suggestions:", error);
        toast.error("Không thể tìm kiếm lỗi");
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      if (open) {
        fetchSuggestions();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedErrors, open, listError]);

  // Handle adding errors to task using addTaskErrors
  const handleAddErrors = async () => {
    if (selectedErrors.length === 0) {
      toast.error("Vui lòng chọn ít nhất một lỗi để thêm");
      return;
    }

    try {
      setSubmitting(true);

      const errorIds = selectedErrors.map((error) => error.id);
      
      // Create payload for addTaskErrors
      const payload: AddTaskErrorPayload = {
        TaskId: taskId,
        ErrorIds: errorIds,
        Action: "Add",
      };

      console.log("Adding errors to task with payload:", payload);
      await apiClient.error.addTaskErrors(payload);

      toast.success(`Đã thêm ${errorIds.length} lỗi vào nhiệm vụ`);
      onErrorsAdded();
      setSelectedErrors([]);
      selectedErrorsRef.current = [];
      setSearchQuery("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add errors to task:", error);
      toast.error("Không thể thêm lỗi vào nhiệm vụ");
    } finally {
      setSubmitting(false);
    }
  };

  // Explicit reset function
  const handleReset = () => {
    setSelectedErrors([]);
    selectedErrorsRef.current = [];
    setSearchQuery("");
    setSuggestions([]);
  };

  // Update handleSelectError to explicitly reopen the dropdown and refresh suggestions
  const handleSelectError = (error: ErrorSuggestion) => {
    setSelectedErrors((prev) => [...prev, error]);
    setSuggestions((prev) =>
      prev.filter((suggestion) => suggestion.id !== error.id)
    );
    inputRef.current?.focus();
    setCommandOpen(true);
    setTimeout(() => {
      if (searchQuery.length >= 1) {
        const currentQuery = searchQuery;
        setSearchQuery("");
        setTimeout(() => {
          setSearchQuery(currentQuery);
        }, 10);
      }
    }, 100);
  };

  const handleRemoveError = (errorId: string) => {
    setSelectedErrors((prev) => prev.filter((err) => err.id !== errorId));
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    // Do not reset selectedErrors on close, only on explicit reset or successful add
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current?.contains(event.target as Node) ||
        commandRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setCommandOpen(false);
    };

    if (commandOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [commandOpen]);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm Lỗi vào Nhiệm vụ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Buttons above input and selected errors */}
          <div className="flex gap-2 mb-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={submitting && selectedErrors.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Đặt lại lựa chọn
            </Button>
            <Button
              onClick={handleAddErrors}
              disabled={selectedErrors.length === 0 || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Thêm {selectedErrors.length} lỗi
                </>
              )}
            </Button>
          </div>

          {/* Selected errors section above the search input */}
          {selectedErrors.length > 0 && (
            <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-medium text-sm mb-2">Lỗi đã chọn:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedErrors.map((error) => (
                  <Badge
                    key={error.id}
                    className="flex items-center gap-1 px-3 py-1.5"
                    variant="secondary"
                  >
                    <span>{error.name}</span>
                    <X
                      className="h-3.5 w-3.5 cursor-pointer ml-1"
                      onClick={() => handleRemoveError(error.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="Tìm kiếm lỗi..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length >= 1) {
                  setCommandOpen(true);
                } else {
                  setCommandOpen(false);
                }
              }}
              className="w-full"
              onFocus={() => {
                if (searchQuery.length >= 1) {
                  setCommandOpen(true);
                }
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              ) : (
                <Search className="h-4 w-4 text-gray-500" />
              )}
            </div>
          </div>

          {/* Command menu for suggestions */}
          {commandOpen && (
            <div className="absolute left-0 right-0 z-[100]" ref={commandRef}>
              <Command className="w-full rounded-md border shadow-md bg-white dark:bg-gray-800 max-h-[250px] overflow-auto">
                <CommandEmpty className="py-6 text-center text-sm">
                  {searchQuery.length < 1
                    ? "Gõ để tìm kiếm"
                    : loading
                    ? "Đang tìm kiếm..."
                    : "Không tìm thấy lỗi nào"}
                </CommandEmpty>

                {suggestions.length > 0 && (
                  <CommandGroup heading="Lỗi gợi ý">
                    {suggestions.map((error) => (
                      <CommandItem
                        key={error.id}
                        onSelect={() => handleSelectError(error)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center">
                          <AlertCircle className="mr-2 h-4 w-4 text-orange-500" />
                          <div>
                            <div className="font-medium">{error.name}</div>
                          </div>
                        </div>
                        <div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectError(error);
                            }}
                          >
                            <span className="sr-only">Thêm</span>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </Command>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddErrorToTaskModal;
