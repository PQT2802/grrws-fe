// // src/components/TaskGroupActions/TaskGroupActionsFactory.tsx
// const TaskGroupActionsFactory = ({ taskGroup, ...props }) => {
//   switch (taskGroup.groupType.toLowerCase()) {
//     case "warranty":
//       return (
//         <div className="flex flex-wrap gap-2 justify-end">
//           <Button variant="outline" onClick={props.handleBack}>
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Tasks
//           </Button>
//           <UpdateWarrantyClaimButton {...props.warrantyProps} />
//           <CreateWarrantyReturnButton {...props.warrantyProps} />
//           <Button variant="default">
//             <Shield className="h-4 w-4 mr-2" />
//             Warranty Portal
//           </Button>
//         </div>
//       );

//     case "repair":
//       return (
//         <div className="flex flex-wrap gap-2 justify-end">
//           <Button variant="outline" onClick={props.handleBack}>
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Tasks
//           </Button>
//           <Button variant="default">
//             <Wrench className="h-4 w-4 mr-2" />
//             Update Repair Status
//           </Button>
//           <Button variant="default">
//             <Package className="h-4 w-4 mr-2" />
//             Order Parts
//           </Button>
//         </div>
//       );

//     case "replacement":
//       return (
//         <div className="flex flex-wrap gap-2 justify-end">
//           <Button variant="outline" onClick={props.handleBack}>
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Tasks
//           </Button>
//           <Button variant="default">
//             <ArrowLeftRight className="h-4 w-4 mr-2" />
//             Schedule Installation
//           </Button>
//           <Button variant="default">
//             <Monitor className="h-4 w-4 mr-2" />
//             Device Inventory
//           </Button>
//         </div>
//       );

//     default:
//       return (
//         <div className="flex flex-wrap gap-2 justify-end">
//           <Button variant="outline" onClick={props.handleBack}>
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Tasks
//           </Button>
//           <Button variant="default">
//             <Eye className="h-4 w-4 mr-2" />
//             View Request
//           </Button>
//         </div>
//       );
//   }
// };
