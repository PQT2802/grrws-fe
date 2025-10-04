"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import PageTitle from "@/components/PageTitle/PageTitle";
import { apiClient } from "@/lib/api-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { TimeField } from "@/components/ui/time-field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Holiday, Shift, WorkingHoursConfig } from "@/types/time.type";
import { format, isEqual, parse, setHours, setMinutes } from "date-fns";
import { vi } from "date-fns/locale"; // Thêm tiếng Việt cho date-fns
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  Clock, 
  Edit, 
  Info, 
  Loader2, 
  Plus, 
  Save, 
  Trash2, 
  X 
} from "lucide-react";

const TimeManagementPage = () => {
  const { user, loading: authLoading, canAccessWorkspace } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("working-days");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [workingHoursConfig, setWorkingHoursConfig] = useState<WorkingHoursConfig | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Kiểm tra quyền truy cập
  useEffect(() => {
    if (!authLoading && !canAccessWorkspace) {
      router.push("/access-denied");
    }
  }, [authLoading, canAccessWorkspace, router]);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    if (authLoading || !canAccessWorkspace) return;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Tải cấu hình giờ làm việc
        const configResponse = await apiClient.time.getWorkingHoursConfig();
        setWorkingHoursConfig(configResponse);
        
        // Tải ca làm việc
        const shiftsResponse = await apiClient.time.getShifts();
        setShifts(shiftsResponse);
        
        // Tải ngày lễ cho năm hiện tại
        const holidaysResponse = await apiClient.time.getHolidays(selectedYear);
        setHolidays(holidaysResponse);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu quản lý thời gian:", err);
        setError("Không thể tải dữ liệu quản lý thời gian. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [authLoading, canAccessWorkspace, selectedYear]);

  // Hiển thị trạng thái đang tải
  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="h-12 w-64">
            <SkeletonCard />
          </div>
          <div className="h-10 w-32">
            <SkeletonCard />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64">
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Hiển thị trạng thái lỗi
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 flex flex-col items-center justify-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Không thể tải Quản lý Thời gian</h2>
          <p className="text-red-600 dark:text-red-300 mb-6 text-center">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <PageTitle 
          title="Quản lý Thời gian" 
          description="Cấu hình giờ làm việc, ca làm việc, và ngày lễ"
        />
      </div>
      
      <Tabs 
        defaultValue="working-days" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 w-full md:w-1/2 lg:w-1/3">
          <TabsTrigger value="working-days" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Ngày làm việc</span>
          </TabsTrigger>
          <TabsTrigger value="shifts" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Ca làm việc</span>
          </TabsTrigger>
          <TabsTrigger value="holidays" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span>Ngày lễ</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="working-days">
          <WorkingDaysTab 
            workingHoursConfig={workingHoursConfig} 
            setWorkingHoursConfig={setWorkingHoursConfig}
          />
        </TabsContent>
        
        <TabsContent value="shifts">
          <ShiftsTab 
            shifts={shifts}
            setShifts={setShifts}
            workingHoursConfig={workingHoursConfig}
            setWorkingHoursConfig={setWorkingHoursConfig}
          />
        </TabsContent>
        
        <TabsContent value="holidays">
          <HolidaysTab 
            holidays={holidays} 
            setHolidays={setHolidays}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Tab Ngày làm việc
const WorkingDaysTab = ({ 
  workingHoursConfig, 
  setWorkingHoursConfig 
}: { 
  workingHoursConfig: WorkingHoursConfig | null;
  setWorkingHoursConfig: (config: WorkingHoursConfig | null) => void;
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(workingHoursConfig?.workingDays || []);
  
  // Ngày trong tuần (tiếng Việt)
  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const daysOfWeekVietnamese = [
    "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"
  ];
  
  const handleDayToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };
  
  const saveWorkingDays = async () => {
    setSaving(true);
    try {
      const response = await apiClient.time.updateWorkingDays({ workingDays: selectedDays });
      setWorkingHoursConfig(response);
      toast({
        title: "Đã cập nhật ngày làm việc",
        description: "Cấu hình ngày làm việc đã được lưu thành công.",
      });
    } catch (err) {
      console.error("Lỗi khi lưu ngày làm việc:", err);
      toast({
        title: "Không thể lưu",
        description: "Đã xảy ra lỗi khi lưu ngày làm việc. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Cấu hình Ngày làm việc
        </CardTitle>
        <CardDescription>
          Chọn những ngày được coi là ngày làm việc cho tổ chức của bạn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-4 mb-8">
          {daysOfWeek.map((day, index) => {
            const isSelected = selectedDays.includes(day);
            return (
              <div 
                key={day} 
                className={`
                  flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-800'}
                `}
                onClick={() => handleDayToggle(day)}
              >
                <span className={`text-sm font-medium ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-400'}`}>
                  {daysOfWeekVietnamese[index]}
                </span>
                <Checkbox 
                  checked={isSelected}
                  className="mt-2"
                  onCheckedChange={() => handleDayToggle(day)}
                />
              </div>
            );
          })}
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 dark:text-amber-300 text-sm">
                Ngày làm việc xác định thời gian hoạt động kinh doanh thông thường. Công việc được lên lịch 
                ngoài ngày làm việc có thể được xử lý khác nhau hoặc có mức độ ưu tiên khác. Điều này cũng 
                ảnh hưởng đến việc tính toán giờ làm việc.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedDays.length} ngày được chọn
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSelectedDays(workingHoursConfig?.workingDays || [])}
            >
              Đặt lại
            </Button>
            <Button 
              onClick={saveWorkingDays}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu ngày làm việc
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Tab Ca làm việc
const ShiftsTab = ({ 
  shifts, 
  setShifts,
  workingHoursConfig,
  setWorkingHoursConfig
}: { 
  shifts: Shift[];
  setShifts: (shifts: Shift[]) => void;
  workingHoursConfig: WorkingHoursConfig | null;
  setWorkingHoursConfig: (config: WorkingHoursConfig | null) => void;
}) => {
  const { toast } = useToast();
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [officeHourShiftIds, setOfficeHourShiftIds] = useState<string[]>(
    workingHoursConfig?.officeHourShifts.map(s => s.id) || []
  );
  
  const handleShiftEdit = (shift: Shift) => {
    setEditingShift({...shift});
    setIsDialogOpen(true);
  };
  
  const saveShift = async () => {
    if (!editingShift) return;
    
    setSaving(true);
    try {
      const response = await apiClient.time.updateShift(
        editingShift.id,
        {
          shiftName: editingShift.shiftName,
          startTime: editingShift.startTime,
          endTime: editingShift.endTime,
          isActive: editingShift.isActive,
          isOfficeHour: editingShift.isOfficeHour
        }
      );
      
      // Cập nhật danh sách ca làm việc
      setShifts(shifts.map(s => s.id === response.id ? response : s));
      
      // Đóng hộp thoại
      setIsDialogOpen(false);
      setEditingShift(null);
      
      toast({
        title: "Đã cập nhật ca làm việc",
        description: "Thông tin ca làm việc đã được cập nhật thành công.",
      });
    } catch (err) {
      console.error("Lỗi khi cập nhật ca làm việc:", err);
      toast({
        title: "Không thể cập nhật ca làm việc",
        description: "Đã xảy ra lỗi khi cập nhật ca làm việc. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleOfficeHourChange = async (shiftId: string, checked: boolean) => {
    const newOfficeHourShiftIds = checked 
      ? [...officeHourShiftIds, shiftId]
      : officeHourShiftIds.filter(id => id !== shiftId);
      
    try {
      const response = await apiClient.time.updateOfficeHourShifts({
        officeHourShiftIds: newOfficeHourShiftIds
      });
      
      setWorkingHoursConfig(response);
      setOfficeHourShiftIds(response.officeHourShifts.map(s => s.id));
      
      toast({
        title: "Đã cập nhật giờ hành chính",
        description: "Ca làm việc giờ hành chính đã được cập nhật thành công.",
      });
    } catch (err) {
      console.error("Lỗi khi cập nhật ca làm việc giờ hành chính:", err);
      toast({
        title: "Không thể cập nhật",
        description: "Đã xảy ra lỗi khi cập nhật ca làm việc giờ hành chính. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };
  
  // Hàm trợ giúp phân tích chuỗi thời gian
  const parseTimeString = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    return date;
  };
  
  // Định dạng thời gian để hiển thị
  const formatTime = (timeString: string): string => {
    try {
      const date = parseTimeString(timeString);
      return format(date, 'HH:mm'); // Định dạng 24h, phù hợp với người Việt
    } catch (e) {
      return timeString;
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cấu hình Ca làm việc
          </CardTitle>
          <CardDescription>
            Quản lý ca làm việc và chỉ định giờ hành chính
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto border rounded-lg mb-6">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <th scope="col" className="px-6 py-3">Tên ca làm việc</th>
                  <th scope="col" className="px-6 py-3">Giờ bắt đầu</th>
                  <th scope="col" className="px-6 py-3">Giờ kết thúc</th>
                  <th scope="col" className="px-6 py-3">Thời lượng</th>
                  <th scope="col" className="px-6 py-3">Trạng thái</th>
                  <th scope="col" className="px-6 py-3">Giờ hành chính</th>
                  <th scope="col" className="px-6 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => {
                  // Tính toán thời lượng ca làm việc
                  const startParts = shift.startTime.split(':');
                  const endParts = shift.endTime.split(':');
                  const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                  const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                  let durationMinutes = endMinutes - startMinutes;
                  
                  // Xử lý ca làm việc qua đêm
                  if (durationMinutes < 0) durationMinutes += 24 * 60;
                  
                  const hours = Math.floor(durationMinutes / 60);
                  const minutes = durationMinutes % 60;
                  const durationText = `${hours}g ${minutes}p`;
                  
                  return (
                    <tr key={shift.id} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {shift.shiftName}
                      </td>
                      <td className="px-6 py-4">{formatTime(shift.startTime)}</td>
                      <td className="px-6 py-4">{formatTime(shift.endTime)}</td>
                      <td className="px-6 py-4">{durationText}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${shift.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}
                        >
                          {shift.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Switch
                          checked={officeHourShiftIds.includes(shift.id)}
                          onCheckedChange={(checked) => handleOfficeHourChange(shift.id, checked)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleShiftEdit(shift)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Chỉnh sửa</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-blue-800 dark:text-blue-300 font-medium mb-1">Hiểu về Ca làm việc và Giờ hành chính</h3>
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  <strong>Ca làm việc</strong> xác định các khoảng thời gian làm việc trong ngày. <strong>Giờ hành chính</strong> là 
                  những ca làm việc cụ thể khi nhân viên hành chính có mặt và hoạt động kinh doanh thông thường diễn ra. Công việc có thể 
                  được ưu tiên khác nhau trong giờ hành chính so với các ca làm việc khác.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hộp thoại chỉnh sửa ca làm việc */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Ca làm việc</DialogTitle>
          </DialogHeader>
          
          {editingShift && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shiftName">Tên ca làm việc</Label>
                  <Input
                    id="shiftName"
                    value={editingShift.shiftName}
                    onChange={(e) => setEditingShift({...editingShift, shiftName: e.target.value})}
                    placeholder="Ca sáng"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Giờ bắt đầu</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={editingShift.startTime.substring(0, 5)}
                      onChange={(e) => setEditingShift({...editingShift, startTime: e.target.value + ':00'})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Giờ kết thúc</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={editingShift.endTime.substring(0, 5)}
                      onChange={(e) => setEditingShift({...editingShift, endTime: e.target.value + ':00'})}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={editingShift.isActive}
                    onCheckedChange={(checked) => setEditingShift({...editingShift, isActive: checked})}
                  />
                  <Label htmlFor="isActive">Hoạt động</Label>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button 
              onClick={saveShift}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Tab Ngày lễ
const HolidaysTab = ({ 
  holidays, 
  setHolidays,
  selectedYear,
  setSelectedYear
}: { 
  holidays: Holiday[];
  setHolidays: (holidays: Holiday[]) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  const [newHoliday, setNewHoliday] = useState<{
    date: Date | undefined;
    description: string;
  }>({
    date: undefined,
    description: ""
  });
  
  const [editHoliday, setEditHoliday] = useState<{
    id: string;
    date: Date;
    description: string;
  } | null>(null);
  
  const addHoliday = async () => {
    if (!newHoliday.date || !newHoliday.description) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng cung cấp cả ngày và mô tả cho ngày lễ.",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await apiClient.time.addHoliday({
        holidayDate: newHoliday.date.toISOString(),
        description: newHoliday.description
      });
      
      setHolidays([...holidays, response]);
      
      // Đặt lại và đóng hộp thoại
      setNewHoliday({ date: undefined, description: "" });
      setIsDialogOpen(false);
      
      toast({
        title: "Đã thêm ngày lễ",
        description: "Ngày lễ mới đã được thêm thành công.",
      });
    } catch (err) {
      console.error("Lỗi khi thêm ngày lễ:", err);
      toast({
        title: "Không thể thêm ngày lễ",
        description: "Đã xảy ra lỗi khi thêm ngày lễ. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const updateHoliday = async () => {
    if (!editHoliday || !editHoliday.date || !editHoliday.description) return;
    
    setSaving(true);
    
    try {
      const response = await apiClient.time.updateHoliday(
        editHoliday.id,
        {
          holidayDate: editHoliday.date.toISOString(),
          description: editHoliday.description
        }
      );
      
      // Cập nhật danh sách ngày lễ
      setHolidays(holidays.map(h => h.id === response.id ? response : h));
      
      // Đặt lại và đóng hộp thoại
      setEditHoliday(null);
      
      toast({
        title: "Đã cập nhật ngày lễ",
        description: "Ngày lễ đã được cập nhật thành công.",
      });
    } catch (err) {
      console.error("Lỗi khi cập nhật ngày lễ:", err);
      toast({
        title: "Không thể cập nhật ngày lễ",
        description: "Đã xảy ra lỗi khi cập nhật ngày lễ. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const deleteHoliday = async (id: string) => {
    setDeleting(id);
    
    try {
      await apiClient.time.deleteHoliday(id);
      
      // Cập nhật danh sách ngày lễ
      setHolidays(holidays.filter(h => h.id !== id));
      
      toast({
        title: "Đã xóa ngày lễ",
        description: "Ngày lễ đã được xóa thành công.",
      });
    } catch (err) {
      console.error("Lỗi khi xóa ngày lễ:", err);
      toast({
        title: "Không thể xóa ngày lễ",
        description: "Đã xảy ra lỗi khi xóa ngày lễ. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };
  
  // Nhóm ngày lễ theo tháng để hiển thị tốt hơn
  const holidaysByMonth = holidays.reduce((acc, holiday) => {
    const date = new Date(holiday.holidayDate);
    const month = date.getMonth();
    
    if (!acc[month]) {
      acc[month] = [];
    }
    
    acc[month].push({
      ...holiday,
      date: date
    });
    
    return acc;
  }, {} as Record<number, Array<Holiday & { date: Date }>>);
  
  // Tạo danh sách các năm cho dropdown (5 năm trước và sau năm hiện tại)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  
  // Tên tháng tiếng Việt
  const monthsInVietnamese = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Ngày lễ ({selectedYear})
            </CardTitle>
            <CardDescription>
              Quản lý ngày lễ công ty và ngày nghỉ đặc biệt
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{selectedYear}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0" align="end">
                <div className="grid grid-cols-1 gap-1 p-2">
                  {yearOptions.map((year) => (
                    <Button
                      key={year}
                      variant={year === selectedYear ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => setSelectedYear(year)}
                    >
                      {year}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setNewHoliday({ date: undefined, description: "" });
                    setIsDialogOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Thêm ngày lễ
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm ngày lễ mới</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="holiday-date">Ngày</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="holiday-date"
                          variant={"outline"}
                          className={`w-full justify-start text-left font-normal ${!newHoliday.date && "text-muted-foreground"}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newHoliday.date 
                            ? format(newHoliday.date, "dd/MM/yyyy", { locale: vi }) 
                            : "Chọn ngày"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newHoliday.date}
                          onSelect={(date) => setNewHoliday({ ...newHoliday, date })}
                          locale={vi}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Input
                      id="description"
                      value={newHoliday.description}
                      onChange={(e) => setNewHoliday({...newHoliday, description: e.target.value})}
                      placeholder="VD: Tết Nguyên Đán"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button 
                    onClick={addHoliday}
                    disabled={saving || !newHoliday.date || !newHoliday.description}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang thêm...
                      </>
                    ) : 'Thêm ngày lễ'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(holidaysByMonth).length === 0 ? (
            <div className="text-center py-12 border rounded-lg border-dashed">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-200">Không tìm thấy ngày lễ</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Chưa có ngày lễ nào được cấu hình cho năm {selectedYear}
              </p>
              <Button
                className="mt-6"
                onClick={() => {
                  setNewHoliday({ date: undefined, description: "" });
                  setIsDialogOpen(true);
                }}
              >
                Thêm ngày lễ đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from({ length: 12 }).map((_, monthIndex) => {
                const monthHolidays = holidaysByMonth[monthIndex] || [];
                if (monthHolidays.length === 0) return null;
                
                return (
                  <div key={monthIndex} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b">
                      <h3 className="font-medium text-gray-900 dark:text-gray-200">{monthsInVietnamese[monthIndex]}</h3>
                    </div>
                    <div className="divide-y">
                      {monthHolidays.map((holiday) => (
                        <div 
                          key={holiday.id} 
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-2 rounded-md">
                              <CalendarIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-200">
                                {format(holiday.date, 'dd/MM/yyyy', { locale: vi })}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{holiday.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setEditHoliday({
                                        id: holiday.id,
                                        date: holiday.date,
                                        description: holiday.description
                                      });
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Chỉnh sửa</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Chỉnh sửa ngày lễ</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => deleteHoliday(holiday.id)}
                                    disabled={deleting === holiday.id}
                                  >
                                    {deleting === holiday.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className="sr-only">Xóa</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Xóa ngày lễ</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hộp thoại chỉnh sửa ngày lễ */}
      {editHoliday && (
        <Dialog open={!!editHoliday} onOpenChange={(open) => !open && setEditHoliday(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa ngày lễ</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-holiday-date">Ngày</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="edit-holiday-date"
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(editHoliday.date, "dd/MM/yyyy", { locale: vi })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editHoliday.date}
                      onSelect={(date) => date && setEditHoliday({ ...editHoliday, date })}
                      locale={vi}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Mô tả</Label>
                <Input
                  id="edit-description"
                  value={editHoliday.description}
                  onChange={(e) => setEditHoliday({...editHoliday, description: e.target.value})}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditHoliday(null)}
              >
                Hủy
              </Button>
              <Button 
                onClick={updateHoliday}
                disabled={saving || !editHoliday.date || !editHoliday.description}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : 'Cập nhật ngày lễ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default TimeManagementPage;