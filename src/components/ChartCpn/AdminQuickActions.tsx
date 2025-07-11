'use client';

import { Plus, Users, Settings, FileText, BarChart3, Shield } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function AdminQuickActions() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.["workspace-id"];

  const actions = [
    {
      label: 'Users',
      icon: Users,
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      action: () => router.push(`/workspace/${workspaceId}/admin/userList`)
    },
    {
      label: 'Machines',
      icon: Settings,
      color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      action: () => router.push(`/workspace/${workspaceId}/admin/machineList`)
    },
    {
      label: 'Requests',
      icon: FileText,
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
      action: () => router.push(`/workspace/${workspaceId}/admin/requestList`)
    },
    {
      label: 'Devices',
      icon: Shield,
      color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
      action: () => router.push(`/workspace/${workspaceId}/admin/deviceList`)
    }
  ];

  return (
    <div className=" p-6 mt-3 rounded-lg shadow-sm border">
      <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3.5">
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.action}
              className={`p-4 rounded-lg border transition-colors ${action.color}`}
            >
              <div className="flex flex-col items-center gap-2.5">
                <IconComponent className="w-7 h-7" />
                <span className="text-sm font-medium">{action.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}