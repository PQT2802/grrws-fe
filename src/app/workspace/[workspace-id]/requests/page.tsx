"use client";

import { useEffect, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import PageTitle from "@/components/PageTitle/PageTitle";
import ButtonCpn from "@/components/ButtonCpn/ButtonCpn";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import { requestService } from "@/app/service/request.service";
import { REQUEST_SUMMARY } from "@/types/request.type";
import RequestTableCpn from "@/components/RequestTableCpn/RequestTableCpn";

const RequestsPage = () => {
  const [requestSummary, setRequestSummary] = useState<REQUEST_SUMMARY | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchRequestSummary = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const data = await requestService.getRequestSummary();
      console.log(data);
      setRequestSummary(data);
    } catch (error) {
      console.error("Failed to fetch request summary:", error);
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRequestSummary();
  }, []);

  const handleExport = () => {
    if (!requestSummary || loading) return;

    // Convert data to CSV format
    const csvData = Object.entries(requestSummary)
      .map(([key, value]) => `${key},${value}`)
      .join("\n");

    const csvContent = `data:text/csv;charset=utf-8,Trường,Giá trị\n${csvData}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tong_quan_yeu_cau.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    fetchRequestSummary(true);
  };

  return (
    <div>
      {/* Header with Title and Action Buttons */}
      <div className="flex items-center justify-between mb-6">
        {/* Bigger Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Tổng quan yêu cầu
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Xem tất cả các yêu cầu của bạn tại đây
          </p>
        </div>
        
        {/* Action Buttons - Refresh and Export */}
        <div className="flex items-center gap-3">
          <ButtonCpn
            type="button"
            title="Làm mới"
            icon={<RotateCcw />}
            loading={isRefreshing}
            onClick={handleRefresh}
          />
          
          <ButtonCpn
            type="button"
            title="Xuất dữ liệu"
            icon={<Download />}
            loading={loading}
            onClick={handleExport}
          />
        </div>
      </div>

      {/* Request Table Content */}
      <div className="my-5">
        <div className="px-0 pt-0 pb-4">
          {loading ? (
            <SkeletonCard />
          ) : (
            <RequestTableCpn
              requestSummary={requestSummary}
              loading={loading || isRefreshing}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestsPage;