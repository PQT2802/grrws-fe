"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wrench, CheckCircle, AlertTriangle, Clock, TrendingUp } from "lucide-react";

const OperationStatsCpn = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thống kê vận hành hôm nay</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Wrench className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Máy hoạt động</span>
            </div>
            <div className="text-xl font-bold">156/180</div>
            <div className="text-xs text-muted-foreground">86.7%</div>
          </div>
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Hiệu suất TB</span>
            </div>
            <div className="text-xl font-bold">94.2%</div>
            <div className="text-xs text-green-600">+2.1%</div>
          </div>
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Cảnh báo</span>
            </div>
            <div className="text-xl font-bold">3</div>
            <div className="text-xs text-muted-foreground">Linh kiện</div>
          </div>
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Thời gian chờ</span>
            </div>
            <div className="text-xl font-bold">2.4h</div>
            <div className="text-xs text-red-600">-0.3h</div>
          </div>
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-medium">Sản lượng</span>
            </div>
            <div className="text-xl font-bold">3,050</div>
            <div className="text-xs text-green-600">+150</div>
          </div>
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Wrench className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Bảo trì</span>
            </div>
            <div className="text-xl font-bold">12</div>
            <div className="text-xs text-muted-foreground">Máy</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OperationStatsCpn;