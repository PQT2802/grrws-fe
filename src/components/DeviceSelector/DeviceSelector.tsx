import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";

interface Device {
  deviceId: string;
  name: string;
  type: string;
  status: string;
  serialNumber?: string;
  model?: string;
}

interface DeviceSelectorProps {
  devices: Device[];
  selectedDevice: Device | null;
  onDeviceSelect: (device: Device) => void;
  loading?: boolean;
  title?: string;
}

const DeviceSelector = ({
  devices,
  selectedDevice,
  onDeviceSelect,
  loading = false,
  title = "Select Device",
}: DeviceSelectorProps) => {
  if (loading) {
    return <SkeletonCard />;
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800";
      case "in use":
        return "bg-blue-100 text-blue-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Select</TableHead>
              <TableHead>Device Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow
                key={device.deviceId}
                className={`cursor-pointer hover:bg-gray-50 ${
                  selectedDevice?.deviceId === device.deviceId
                    ? "bg-blue-50"
                    : ""
                }`}
                onClick={() => onDeviceSelect(device)}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedDevice?.deviceId === device.deviceId}
                    onCheckedChange={() => onDeviceSelect(device)}
                  />
                </TableCell>
                <TableCell className="font-medium">{device.name}</TableCell>
                <TableCell>{device.type}</TableCell>
                <TableCell className="text-gray-600">
                  {device.model || "N/A"}
                </TableCell>
                <TableCell className="text-gray-600">
                  {device.serialNumber || "N/A"}
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(device.status)} text-xs`}>
                    {device.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DeviceSelector;
