import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface TaskSummaryItem {
  label: string;
  value: React.ReactNode;
}

interface TaskSummaryCardProps {
  title: string;
  items: TaskSummaryItem[];
}

const TaskSummaryCard = ({ title, items }: TaskSummaryCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {items.map((item, index) => (
            <div key={index}>
              <Label>{item.label}</Label>
              <div className="font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskSummaryCard;
