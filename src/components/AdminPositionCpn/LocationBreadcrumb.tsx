'use client';

import { ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface LocationBreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function LocationBreadcrumb({ items }: LocationBreadcrumbProps) {
  const params = useParams();
  const workspaceId = params?.["workspace-id"];

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      <MapPin className="h-4 w-4" />
      <Link 
        href={`/workspace/${workspaceId}/admin/location/areas`}
        className="hover:text-primary transition-colors"
      >
        Location Management
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {item.href && !item.isActive ? (
            <Link 
              href={item.href}
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={item.isActive ? 'text-primary font-medium' : ''}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}