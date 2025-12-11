import React from 'react';
import { Search, Bell, Settings, User, Mail } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-10">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Title */}
        <div>
          <h1 className="font-heading text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm">Welcome back, Admin</p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search employees, reports..."
              className="pl-10 pr-4 py-2 w-80 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Notification Icon */}
          <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>

          {/* Messages Icon */}
          <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
            <Mail size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>

          {/* Settings Icon */}
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Settings size={20} />
          </button>

          {/* User Profile */}
          <button className="flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-lg transition-colors">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User size={20} className="text-primary-foreground" />
            </div>
            <div className="text-left hidden lg:block">
              <p className="font-medium text-sm">John Doe</p>
              <p className="text-xs text-muted-foreground">HR Manager</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
