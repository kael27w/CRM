import React from 'react';
import { useAppContext } from '@/lib/context/app-context';
import { 
  Bell, 
  Plus, 
  Search, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Settings as SettingsIcon,
  FileCheck,
  Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'wouter';

const Header: React.FC = () => {
  const { toggleTheme, theme, toggleSidebar, isSidebarOpen } = useAppContext();

  return (
    <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center">
          <button 
            type="button" 
            onClick={toggleSidebar}
            className="text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          
          <div className="relative ml-4 md:ml-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <Input 
              id="search" 
              name="search" 
              className="pl-10 pr-3 py-2 w-full md:w-64 lg:w-96"
              placeholder="Search contacts, companies, deals..." 
              type="search"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Create New Record Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Create New</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Contact</DropdownMenuItem>
              <DropdownMenuItem>Company</DropdownMenuItem>
              <DropdownMenuItem>Deal</DropdownMenuItem>
              <DropdownMenuItem>Product</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Activity</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>Task</DropdownMenuItem>
                      <DropdownMenuItem>Event</DropdownMenuItem>
                      <DropdownMenuItem>Call</DropdownMenuItem>
                      <DropdownMenuItem>Email</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Approval Forms */}
          <Button variant="ghost" size="icon">
            <FileCheck className="h-5 w-5" />
          </Button>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          
          {/* Signals */}
          <Button variant="ghost" size="icon">
            <Zap className="h-5 w-5" />
          </Button>
          
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          
          {/* Settings */}
          <Button 
            variant="ghost" 
            size="icon"
            asChild
          >
            <Link href="/settings">
              <SettingsIcon className="h-5 w-5" />
            </Link>
          </Button>
          
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Alex Davis</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    a.davis@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Account Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Header;
