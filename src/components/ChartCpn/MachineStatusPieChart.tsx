"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { apiClient } from "@/lib/api-client";
import { DEVICE_STATISTICS } from "@/types/dashboard.type";
import { Loader2 } from "lucide-react";

interface MachineData {
	name: string;
	value: number;
	color: string;
}

const MachineStatusPieChart = () => {
	const [machineData, setMachineData] = useState<MachineData[]>([]);
	const [totalMachines, setTotalMachines] = useState<number>(0);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchDeviceStatistics = async () => {
			try {
				setIsLoading(true);
				setError(null);
				console.log("🔄 Fetching device statistics for machine status chart");

				const response = await apiClient.dashboard.getDeviceStatistics();
				console.log("📦 Full API response:", response);

				// Handle different response structures
				let deviceStats: DEVICE_STATISTICS;

				if (response.data) {
					deviceStats = response.data;
				} else if (response) {
					deviceStats = response as any;
				} else {
					throw new Error("Invalid response structure");
				}

				console.log("📊 Device statistics extracted:", deviceStats);

				// Validate that we have the required fields
				if (typeof deviceStats.totalInUseDevices === "undefined") {
					console.error("❌ Missing required fields in device statistics:", deviceStats);
					throw new Error("Invalid device statistics format");
				}

				// Map API data to chart format
				const chartData: MachineData[] = [
					{ name: "Hoạt động", value: deviceStats.totalInUseDevices || 0, color: "#22c55e" },
					{ name: "Sửa chữa", value: deviceStats.totalInRepairDevices || 0, color: "#ef4444" },
					{ name: "Bảo hành", value: deviceStats.totalInWarrantyDevices || 0, color: "#f59e0b" },
					{ name: "Ngừng hoạt động", value: deviceStats.totalDecommissionedDevices || 0, color: "#6b7280" },
				];

				// Calculate total machines from the 4 categories
				const total =
					(deviceStats.totalInUseDevices || 0) +
					(deviceStats.totalInRepairDevices || 0) +
					(deviceStats.totalInWarrantyDevices || 0) +
					(deviceStats.totalDecommissionedDevices || 0);

				setMachineData(chartData);
				setTotalMachines(total);

				console.log("✅ Machine status data processed:", { chartData, total });
			} catch (error: any) {
				console.error("❌ Error fetching device statistics:", error);
				setError(`Failed to load device statistics: ${error.message || "Unknown error"}`);
			} finally {
				setIsLoading(false);
			}
		};

		fetchDeviceStatistics();
	}, []);

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-8">
					<Loader2 className="h-8 w-8 animate-spin" />
					<span className="ml-2">Loading device statistics...</span>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-8 text-center">
					<div>
						<p className="text-red-500 mb-2">{error}</p>
						<button
							onClick={() => window.location.reload()}
							className="text-blue-500 underline text-sm"
						>
							Retry
						</button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Trạng thái máy may</CardTitle>
				<CardDescription>
					Phân bổ {totalMachines} máy trong xưởng may hiện tại
				</CardDescription>
			</CardHeader>
			<CardContent>
				{totalMachines > 0 ? (
					<ChartContainer
						config={{
							active: { label: "Hoạt động", color: "#22c55e" },
							repair: { label: "Sửa chữa", color: "#ef4444" },
							warranty: { label: "Bảo hành", color: "#f59e0b" },
							inactive: { label: "Ngừng hoạt động", color: "#6b7280" },
						}}
						className="h-[200px] w-full"
					>
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={machineData}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
									outerRadius={70}
									fill="#8884d8"
									dataKey="value"
									animationBegin={0}
									animationDuration={1500}
								>
									{machineData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={2} />
									))}
								</Pie>
								<ChartTooltip content={<ChartTooltipContent />} animationDuration={300} />
							</PieChart>
						</ResponsiveContainer>
					</ChartContainer>
				) : (
					<div className="h-[200px] flex items-center justify-center text-muted-foreground">
						No machine data available
					</div>
				)}

				<div className="mt-4 grid grid-cols-2 gap-3">
					{machineData.map((item, index) => (
						<div key={index} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
								<span className="font-medium text-sm">{item.name}</span>
							</div>
							<div className="text-right">
								<span className="text-lg font-bold">{item.value}</span>
								<div className="text-xs text-muted-foreground">
									{totalMachines > 0 ? ((item.value / totalMachines) * 100).toFixed(1) : 0}%
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
};

export default MachineStatusPieChart;