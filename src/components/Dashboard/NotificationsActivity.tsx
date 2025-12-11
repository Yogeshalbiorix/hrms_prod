import React, { useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, Clock, Calendar, Users, FileText, DollarSign, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'reminder';
  title: string;
  message: string;
  time: string;
  read: boolean;
  category: string;
}

export default function NotificationsActivity() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'reminder',
      title: 'Performance Review Due',
      message: 'You have 3 performance reviews scheduled for this week',
      time: '10 minutes ago',
      read: false,
      category: 'Performance'
    },
    {
      id: '2',
      type: 'success',
      title: 'Leave Request Approved',
      message: 'Sarah Johnson\'s leave request for Jan 25-27 has been approved',
      time: '1 hour ago',
      read: false,
      category: 'Leave Management'
    },
    {
      id: '3',
      type: 'warning',
      title: 'High Absence Rate',
      message: 'Engineering department showing higher than average absence rate this week',
      time: '2 hours ago',
      read: true,
      category: 'Attendance'
    },
    {
      id: '4',
      type: 'info',
      title: 'New Job Applications',
      message: '12 new applications received for Senior Developer position',
      time: '3 hours ago',
      read: true,
      category: 'Recruitment'
    },
    {
      id: '5',
      type: 'reminder',
      title: 'Payroll Processing',
      message: 'Monthly payroll processing deadline is in 3 days',
      time: '5 hours ago',
      read: false,
      category: 'Payroll'
    },
    {
      id: '6',
      type: 'success',
      title: 'Employee Onboarding Complete',
      message: 'Michael Chen has completed all onboarding tasks',
      time: '1 day ago',
      read: true,
      category: 'Onboarding'
    },
    {
      id: '7',
      type: 'warning',
      title: 'Goal Deadline Approaching',
      message: 'Emily Rodriguez has 2 goals due within the next week',
      time: '1 day ago',
      read: true,
      category: 'Performance'
    },
    {
      id: '8',
      type: 'info',
      title: 'Interview Scheduled',
      message: 'Interview with Alexandra Martinez scheduled for Jan 28, 2024',
      time: '2 days ago',
      read: true,
      category: 'Recruitment'
    },
  ]);

  const [filterCategory, setFilterCategory] = useState('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-600 dark:text-green-400" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={20} />;
      case 'info':
        return <Info className="text-blue-600 dark:text-blue-400" size={20} />;
      case 'reminder':
        return <Clock className="text-purple-600 dark:text-purple-400" size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-950';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-950';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-950';
      case 'reminder':
        return 'bg-purple-100 dark:bg-purple-950';
      default:
        return 'bg-gray-100';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const categories = ['All', 'Performance', 'Leave Management', 'Attendance', 'Recruitment', 'Payroll', 'Onboarding'];

  const filteredNotifications = filterCategory === 'all' 
    ? notifications 
    : notifications.filter(n => n.category === filterCategory);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground">You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Mark All as Read
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setFilterCategory(category.toLowerCase())}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filterCategory === category.toLowerCase()
                ? 'bg-primary text-primary-foreground'
                : 'bg-background border border-input hover:bg-accent'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Total Notifications</p>
              <h3 className="text-2xl font-bold">{notifications.length}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
              <Bell className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Unread</p>
              <h3 className="text-2xl font-bold">{unreadCount}</h3>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-950 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Reminders</p>
              <h3 className="text-2xl font-bold">{notifications.filter(n => n.type === 'reminder').length}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
              <Clock className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Today</p>
              <h3 className="text-2xl font-bold">
                {notifications.filter(n => 
                  n.time.includes('minutes') || n.time.includes('hour')
                ).length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
              <Calendar className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bell size={48} className="mx-auto mb-4 opacity-50" />
              <p>No notifications found</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-muted/30 transition-colors ${
                  !notification.read ? 'bg-muted/10' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationBgColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h4 className="font-semibold text-sm">{notification.title}</h4>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{notification.time}</span>
                      <span>•</span>
                      <span className="px-2 py-1 bg-muted rounded text-xs">{notification.category}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 hover:bg-accent rounded-lg transition-colors text-destructive"
                      title="Delete"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-heading text-lg font-semibold mb-4">Recent Activity Log</h3>
        <div className="space-y-4">
          {[
            { 
              icon: Users, 
              color: 'text-blue-600',
              bgColor: 'bg-blue-100 dark:bg-blue-950',
              action: 'New employee onboarded',
              details: 'Michael Chen joined Engineering department',
              time: '2 hours ago'
            },
            { 
              icon: FileText, 
              color: 'text-green-600',
              bgColor: 'bg-green-100 dark:bg-green-950',
              action: 'Performance review completed',
              details: 'Sarah Johnson - Q4 2023 review finalized',
              time: '4 hours ago'
            },
            { 
              icon: Calendar, 
              color: 'text-purple-600',
              bgColor: 'bg-purple-100 dark:bg-purple-950',
              action: 'Leave request approved',
              details: 'Emily Rodriguez - 3 days approved',
              time: '5 hours ago'
            },
            { 
              icon: DollarSign, 
              color: 'text-yellow-600',
              bgColor: 'bg-yellow-100 dark:bg-yellow-950',
              action: 'Payroll processed',
              details: 'January 2024 payroll completed for 1,247 employees',
              time: '1 day ago'
            },
            { 
              icon: Users, 
              color: 'text-red-600',
              bgColor: 'bg-red-100 dark:bg-red-950',
              action: 'Interview scheduled',
              details: 'Alexandra Martinez - Senior Developer position',
              time: '1 day ago'
            },
          ].map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.bgColor}`}>
                  <Icon size={20} className={activity.color} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.details}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
