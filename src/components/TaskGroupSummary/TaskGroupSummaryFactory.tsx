// src/components/TaskGroupSummary/TaskGroupSummaryFactory.tsx
const TaskGroupSummaryFactory = ({ taskGroup, ...props }) => {
  const getSummaryConfig = () => {
    switch (taskGroup.groupType.toLowerCase()) {
      case "warranty":
        return {
          title: "Warranty Summary",
          icon: <Shield className="h-5 w-5 text-blue-500" />,
          extraFields: [
            { label: "Claim Number", value: props.claimNumber },
            { label: "Expected Return", value: props.expectedReturn },
            { label: "Warranty Status", value: props.warrantyStatus },
          ],
        };
      case "repair":
        return {
          title: "Repair Summary",
          icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
          extraFields: [
            { label: "Issue Type", value: props.issueType },
            { label: "Severity", value: props.severity },
            { label: "Parts Required", value: props.partsRequired },
          ],
        };
      case "replacement":
        return {
          title: "Replacement Summary",
          icon: <Package className="h-5 w-5 text-blue-500" />,
          extraFields: [
            { label: "Old Device", value: props.oldDeviceModel },
            { label: "New Device", value: props.newDeviceModel },
            { label: "Installation Date", value: props.installationDate },
          ],
        };
      default:
        return {
          title: "Task Group Summary",
          icon: <Clock className="h-5 w-5 text-gray-500" />,
          extraFields: [],
        };
    }
  };

  const config = getSummaryConfig();

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {config.icon}
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Standard statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* ... standard stats */}
        </div>

        {/* Type-specific fields */}
        {config.extraFields.length > 0 && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {config.extraFields.map((field, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{field.label}:</span>
                  <span className="text-sm font-medium">{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
