import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/lib/context/app-context';
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Building2,
  Package,
  Calendar,
  Settings,
  BarChart3,
  PieChart,
  CheckSquare,
  HelpCircle
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { isSidebarOpen } = useAppContext();

  // Main navigation items
  const mainNavItems = [
    { 
      href: '/', 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="h-5 w-5 mr-3" />
    }
  ];

  // Records navigation items
  const recordNavItems = [
    { 
      href: '/contacts', 
      label: 'Contacts', 
      icon: <Users className="h-5 w-5 mr-3" />
    },
    { 
      href: '/companies', 
      label: 'Companies', 
      icon: <Building2 className="h-5 w-5 mr-3" />
    },
    { 
      href: '/products', 
      label: 'Products', 
      icon: <Package className="h-5 w-5 mr-3" />
    }
  ];

  // Sales navigation items
  const salesNavItems = [
    { 
      href: '/pipelines', 
      label: 'Pipelines', 
      icon: <KanbanSquare className="h-5 w-5 mr-3" />
    },
    { 
      href: '/activities', 
      label: 'Activities', 
      icon: <CheckSquare className="h-5 w-5 mr-3" />
    }
  ];

  // We've removed the Analytics navigation items as requested

  // Support navigation items
  const supportNavItems = [
    { 
      href: '/settings', 
      label: 'Settings', 
      icon: <Settings className="h-5 w-5 mr-3" />
    },
    { 
      href: '/help', 
      label: 'Help', 
      icon: <HelpCircle className="h-5 w-5 mr-3" />
    }
  ];

  const getNavItemClasses = (href: string) => cn(
    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
    location === href 
      ? "text-white bg-blue-600" 
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
  );

  // Render a section of navigation items with a heading
  const renderNavSection = (items: any[], title: string) => {
    if (!isSidebarOpen && items !== mainNavItems) {
      return (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          {items.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className={getNavItemClasses(item.href)}
            >
              {item.icon}
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        {isSidebarOpen && (
          <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </h3>
        )}
        {items.map((item) => (
          <Link 
            key={item.href} 
            href={item.href} 
            className={getNavItemClasses(item.href)}
          >
            {item.icon}
            {isSidebarOpen && <span>{item.label}</span>}
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className={cn(
      "hidden md:flex md:flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950",
      isSidebarOpen ? "md:w-64" : "md:w-20"
    )}>
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
        <div className="flex items-center px-4 pb-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {isSidebarOpen ? 'Business CRM' : 'CRM'}
          </h1>
        </div>
        
        <nav className="flex-1 px-2 pb-4 mt-3">
          {/* Main section doesn't need a heading */}
          {mainNavItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className={getNavItemClasses(item.href)}
            >
              {item.icon}
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}

          {/* Records section */}
          {renderNavSection(recordNavItems, "Records")}
          
          {/* Sales section */}
          {renderNavSection(salesNavItems, "Sales")}
          
          {/* Analytics section has been removed as requested */}
          
          {/* Support section */}
          {renderNavSection(supportNavItems, "Support")}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
