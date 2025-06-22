"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, Eye, Trash2, Edit, Printer, Download, User } from "lucide-react"

const serverData = [
	{
		id: 1,
		name: "Noveruche Admin",
		description: "8GB/80GB/SF02-Ubuntu iconic- jfkakt-daksl...",
		ipAddress: "192.168.130.26",
		created: "2 Months ago",
		tag: "Web server",
		tagColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
		provider: "Indioserver",
	},
	{
		id: 2,
		name: "Developing Hier",
		description: "8GB/80GB/SF02-Ubuntu iconic- jfkakt-daksl...",
		ipAddress: "192.168.130.26",
		created: "4 Months ago",
		tag: "Desky",
		tagColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
		provider: "Jeniorde",
	},
	{
		id: 3,
		name: "Naturel Dilam",
		description: "8GB/80GB/SF02-Ubuntu iconic- jfkakt-daksl...",
		ipAddress: "192.168.130.26",
		created: "5 Months ago",
		tag: "Software",
		tagColor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
		provider: "Walikarsi",
	},
	{
		id: 4,
		name: "Nariokali Borji",
		description: "8GB/80GB/SF02-Ubuntu iconic- jfkakt-daksl...",
		ipAddress: "192.168.130.26",
		created: "6 Months ago",
		tag: "Innohouse",
		tagColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
		provider: "Leoharshan",
	},
	{
		id: 5,
		name: "Bulesta Karolin",
		description: "8GB/80GB/SF02-Ubuntu iconic- jfkakt-daksl...",
		ipAddress: "192.168.130.26",
		created: "6 Months ago",
		tag: "Rodriguez",
		tagColor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
		provider: "Karilorni",
	},
]

export default function ActiveInstances() {
	return (
		<Card className="shadow-sm border">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 bg-gradient-to-r rounded-t-lg">
				<CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
					Các yêu cầu gần đây
				</CardTitle>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="hover:bg-slate-200 dark:hover:bg-slate-600">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
						<DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700">
							<Eye className="mr-2 h-4 w-4" />
							View
						</DropdownMenuItem>
						<DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700">
							<Trash2 className="mr-2 h-4 w-4" />
							Delete
						</DropdownMenuItem>
						<DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700">
							<Edit className="mr-2 h-4 w-4" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700">
							<Printer className="mr-2 h-4 w-4" />
							Print
						</DropdownMenuItem>
						<DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700">
							<Download className="mr-2 h-4 w-4" />
							Download
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CardHeader>
			<CardContent className="p-6">
				<div className="space-y-4">
					{/* Table Header - Fixed dark mode text colors */}
					<div className="grid grid-cols-12 gap-4 text-base font-bold text-gray-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
						<div className="col-span-4">Servers</div>
						<div className="col-span-2">IP Address</div>
						<div className="col-span-2">Created</div>
						<div className="col-span-2">Tag</div>
						<div className="col-span-1">Provider</div>
						<div className="col-span-1"></div>
					</div>

					{/* Table Rows */}
					{serverData.map((server) => (
						<div key={server.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors rounded-lg">
							<div className="col-span-4 flex items-center gap-3">
								<div className="relative">
									<Avatar className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30">
										<AvatarFallback className="bg-orange-100 dark:bg-orange-900/30">
											<User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
										</AvatarFallback>
									</Avatar>
									<div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
								</div>
								<div>
									<div className="font-medium text-slate-900 dark:text-slate-100">{server.name}</div>
									<div className="text-sm text-slate-600 dark:text-slate-400">{server.description}</div>
								</div>
							</div>
							<div className="col-span-2 text-sm text-slate-700 dark:text-slate-300">{server.ipAddress}</div>
							<div className="col-span-2 text-sm text-slate-700 dark:text-slate-300">{server.created}</div>
							<div className="col-span-2">
								<Badge variant="secondary" className={`${server.tagColor} border-0`}>
									{server.tag}
								</Badge>
							</div>
							<div className="col-span-1 text-sm text-slate-700 dark:text-slate-300">{server.provider}</div>
							<div className="col-span-1 flex justify-end">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm" className="hover:bg-slate-200 dark:hover:bg-slate-600">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
										<DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700">
											<Eye className="mr-2 h-4 w-4" />
											View
										</DropdownMenuItem>
										<DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700">
											<Trash2 className="mr-2 h-4 w-4" />
											Delete
										</DropdownMenuItem>
										<DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700">
											<Edit className="mr-2 h-4 w-4" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700">
											<Printer className="mr-2 h-4 w-4" />
											Print
										</DropdownMenuItem>
										<DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700">
											<Download className="mr-2 h-4 w-4" />
											Download
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
