"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

  useEffect(() => {
    const fetchRequestSummary = async () => {
      try {
        setLoading(true);
        const data = await requestService.getRequestSummary();
        console.log(data);
        setRequestSummary(data);
      } catch (error) {
        console.error("Failed to fetch request summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestSummary();
  }, []);

  const handleExport = () => {
    if (!requestSummary || loading) return;

    // Convert data to CSV format
    const csvData = Object.entries(requestSummary)
      .map(([key, value]) => `${key},${value}`)
      .join("\n");

    const csvContent = `data:text/csv;charset=utf-8,Field,Value\n${csvData}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "request_summary.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <PageTitle
        title="Requests"
        description="View all of your requests here"
      />

      <Card className="my-5">
        <CardHeader className="p-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h3 className="text-lg font-semibold">Request Summary</h3>

            <div className="flex items-center gap-3">
              <ButtonCpn
                type="button"
                title="Export"
                icon={<Download />}
                loading={loading}
                onClick={handleExport}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pt-0 pb-4">
          {loading ? (
            <SkeletonCard />
          ) : (
            <RequestTableCpn
              requestSummary={requestSummary}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestsPage;
