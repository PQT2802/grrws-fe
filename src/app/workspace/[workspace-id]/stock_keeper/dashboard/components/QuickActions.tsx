'use client';

import { Plus, Package, Settings, FileText, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'Import Part',
      icon: Plus,
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
      action: () => router.push('./inventory?action=import')
    },
    {
      label: 'View Requests',
      icon: FileText,
      color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
      action: () => router.push('./requests')
    },
    {
      label: 'Adjust Stock',
      icon: Settings,
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
      action: () => router.push('./inventory?action=adjust')
    },
    {
      label: 'View Reports',
      icon: BarChart3,
      color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200',
      action: () => router.push('./logs')
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border p-6">
      <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.action}
              className={`p-4 rounded-lg border transition-colors ${action.color} dark:bg-opacity-80`}
            >
              <div className="flex flex-col items-center gap-2">
                <IconComponent className="w-6 h-6" />
                <span className="text-sm font-medium">{action.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}