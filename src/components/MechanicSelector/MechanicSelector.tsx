import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import { GET_MECHANIC_USER } from "@/types/user.type";
import { getFirstLetterUppercase } from "@/lib/utils";

interface MechanicSelectorProps {
  mechanics: GET_MECHANIC_USER[];
  selectedMechanic: GET_MECHANIC_USER | null;
  onMechanicSelect: (mechanic: GET_MECHANIC_USER) => void;
  loading?: boolean;
  title?: string;
}

const MechanicSelector = ({
  mechanics,
  selectedMechanic,
  onMechanicSelect,
  loading = false,
  title = "Select Mechanic",
}: MechanicSelectorProps) => {
  if (loading) {
    return <SkeletonCard />;
  }

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
              <TableHead>Mechanic</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mechanics.map((mechanic) => (
              <TableRow
                key={mechanic.id}
                className={`cursor-pointer hover:bg-gray-50 ${
                  selectedMechanic?.id === mechanic.id ? "bg-blue-50" : ""
                }`}
                onClick={() => onMechanicSelect(mechanic)}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedMechanic?.id === mechanic.id}
                    onCheckedChange={() => onMechanicSelect(mechanic)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white text-sm">
                        {getFirstLetterUppercase(mechanic.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{mechanic.fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">
                  {mechanic.email}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">Available</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MechanicSelector;
