// import { PartType } from "../../type";

// export function sortAndFilterParts(
//   parts: PartType[],
//   search: string,
//   machineFilter: string,
//   categoryFilter: string,
//   sortBy: string,
//   sortDirection: string
// ): PartType[] {
//   return parts
//     .filter(
//       (part) =>
//         part.name.toLowerCase().includes(search.toLowerCase()) &&
//         (machineFilter === "" || part.machineType === machineFilter) &&
//         (categoryFilter === "" || part.category === categoryFilter)
//     )
//     .sort((a, b) => {
//       if (sortBy === "name") {
//         return sortDirection === "asc"
//           ? a.name.localeCompare(b.name)
//           : b.name.localeCompare(a.name);
//       } else if (sortBy === "quantity") {
//         return sortDirection === "asc"
//           ? a.quantity - b.quantity
//           : b.quantity - a.quantity;
//       } else if (sortBy === "importedDate") {
//         return sortDirection === "asc"
//           ? new Date(a.importedDate).getTime() - new Date(b.importedDate).getTime()
//           : new Date(b.importedDate).getTime() - new Date(a.importedDate).getTime();
//       }
//       return 0;
//     });
// }