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
import { formatTimeStampDate } from "@/lib/utils";

interface TaskGroup {
  taskGroupId: string;
  groupName: string;
  groupType: string;
  tasks: any[];
  createdDate: string;
}

interface TaskGroupSelectorProps {
  taskGroups: TaskGroup[];
  selectedTaskGroup: TaskGroup | null;
  onTaskGroupSelect: (taskGroup: TaskGroup) => void;
  loading?: boolean;
  title?: string;
}

const TaskGroupSelector = ({
  taskGroups,
  selectedTaskGroup,
  onTaskGroupSelect,
  loading = false,
  title = "Select Task Group",
}: TaskGroupSelectorProps) => {
  if (loading) {
    return <SkeletonCard />;
  }

  const getGroupTypeColor = (groupType: string) => {
    switch (groupType.toLowerCase()) {
      case "replacement":
        return "bg-blue-100 text-blue-800";
      case "repair":
        return "bg-orange-100 text-orange-800";
      case "warranty":
        return "bg-green-100 text-green-800";
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
              <TableHead>Group Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Created Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taskGroups.map((group) => (
              <TableRow
                key={group.taskGroupId}
                className={`cursor-pointer hover:bg-gray-50 ${
                  selectedTaskGroup?.taskGroupId === group.taskGroupId
                    ? "bg-blue-50"
                    : ""
                }`}
                onClick={() => onTaskGroupSelect(group)}
              >
                <TableCell>
                  <Checkbox
                    checked={
                      selectedTaskGroup?.taskGroupId === group.taskGroupId
                    }
                    onCheckedChange={() => onTaskGroupSelect(group)}
                  />
                </TableCell>
                <TableCell className="font-medium">{group.groupName}</TableCell>
                <TableCell>
                  <Badge
                    className={`${getGroupTypeColor(group.groupType)} text-xs`}
                  >
                    {group.groupType}
                  </Badge>
                </TableCell>
                <TableCell>{group.tasks.length} tasks</TableCell>
                <TableCell className="text-gray-600">
                  {formatTimeStampDate(group.createdDate, "datetime")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TaskGroupSelector;
