import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/lib/context/app-context';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  FileText,
  Calendar,
  CheckSquare,
  ChartBar,
  MessageSquare,
  Files,
  Settings
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { isSidebarOpen } = useAppContext();

  const navItems = [
    { 
      href: '/', 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="h-5 w-5 mr-3" />
    },
    { 
      href: '/pipeline', 
      label: 'Pipeline', 
      icon: <ClipboardList className="h-5 w-5 mr-3" />
    },
    { 
      href: '/clients', 
      label: 'Client Manager', 
      icon: <Users className="h-5 w-5 mr-3" />
    },
    { 
      href: '/policies', 
      label: 'Policy Manager', 
      icon: <FileText className="h-5 w-5 mr-3" />
    },
    { 
      href: '/calendar', 
      label: 'Calendar', 
      icon: <Calendar className="h-5 w-5 mr-3" />
    },
    { 
      href: '/underwriting', 
      label: 'Underwriting', 
      icon: <CheckSquare className="h-5 w-5 mr-3" />
    },
    { 
      href: '/analytics', 
      label: 'Analytics', 
      icon: <ChartBar className="h-5 w-5 mr-3" />
    },
    { 
      href: '/communications', 
      label: 'Communications', 
      icon: <MessageSquare className="h-5 w-5 mr-3" />
    },
    { 
      href: '/documents', 
      label: 'Documents', 
      icon: <Files className="h-5 w-5 mr-3" />
    }
  ];

  const getNavItemClasses = (href: string) => cn(
    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
    location === href 
      ? "text-white bg-blue-600" 
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
  );

  return (
    <div className={cn(
      "hidden md:flex md:flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950",
      isSidebarOpen ? "md:w-64" : "md:w-20"
    )}>
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
        <div className="flex items-center px-4 pb-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {isSidebarOpen ? 'InsureFlow CRM' : 'IF'}
          </h1>
        </div>
        
        <nav className="flex-1 px-2 pb-4 space-y-1 mt-3">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className={getNavItemClasses(item.href)}
            >
              {item.icon}
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Link 
              href="/settings" 
              className={getNavItemClasses('/settings')}
            >
              <Settings className="h-5 w-5 mr-3" />
              {isSidebarOpen && <span>Settings</span>}
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
