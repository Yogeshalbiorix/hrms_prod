import React, { useState, useEffect } from 'react';
import { User, Building, Bell, Lock, Globe, Palette, Database, Mail, Save, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { baseUrl } from '../../lib/base-url';

interface Settings {
  company_name?: string;
  industry?: string;
  company_size?: string;
  address?: string;
  profile_first_name?: string;
  profile_last_name?: string;
  profile_email?: string;
  profile_job_title?: string;
  notifications?: {
    leave_requests?: boolean;
    attendance_alerts?: boolean;
    performance_reviews?: boolean;
    payroll_processing?: boolean;
    new_applications?: boolean;
  };
  theme_mode?: string;
  primary_color?: string;
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/settings`);
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      setSaving(true);
      const response = await fetch(`${baseUrl}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Database },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600 mt-1">Manage your application preferences</p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-200">
            <Check className="h-4 w-4" />
            <span className="font-medium">Settings saved!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                        activeSection === section.id
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-blue-50 text-gray-700'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSection === 'general' && (
            <Card className="border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <CardTitle className="text-blue-900">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-blue-900">Company Name</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name || ''}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    className="border-blue-200"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-blue-900">Industry</Label>
                    <Select
                      value={settings.industry || 'Technology'}
                      onValueChange={(value) => setSettings({ ...settings, industry: value })}
                    >
                      <SelectTrigger className="border-blue-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Consulting">Consulting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_size" className="text-blue-900">Company Size</Label>
                    <Select
                      value={settings.company_size || '51-200'}
                      onValueChange={(value) => setSettings({ ...settings, company_size: value })}
                    >
                      <SelectTrigger className="border-blue-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-50">1-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-1000">201-1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-blue-900">Address</Label>
                  <textarea
                    id="address"
                    rows={3}
                    value={settings.address || ''}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <Button
                  onClick={() => updateSettings(settings)}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'profile' && (
            <Card className="border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <CardTitle className="text-blue-900">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={32} className="text-blue-600" />
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Change Photo
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile_first_name" className="text-blue-900">First Name</Label>
                    <Input
                      id="profile_first_name"
                      value={settings.profile_first_name || ''}
                      onChange={(e) => setSettings({ ...settings, profile_first_name: e.target.value })}
                      className="border-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile_last_name" className="text-blue-900">Last Name</Label>
                    <Input
                      id="profile_last_name"
                      value={settings.profile_last_name || ''}
                      onChange={(e) => setSettings({ ...settings, profile_last_name: e.target.value })}
                      className="border-blue-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile_email" className="text-blue-900">Email</Label>
                  <Input
                    id="profile_email"
                    type="email"
                    value={settings.profile_email || ''}
                    onChange={(e) => setSettings({ ...settings, profile_email: e.target.value })}
                    className="border-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile_job_title" className="text-blue-900">Job Title</Label>
                  <Input
                    id="profile_job_title"
                    value={settings.profile_job_title || ''}
                    onChange={(e) => setSettings({ ...settings, profile_job_title: e.target.value })}
                    className="border-blue-200"
                  />
                </div>
                <Button
                  onClick={() => updateSettings(settings)}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card className="border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <CardTitle className="text-blue-900">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {[
                  { key: 'leave_requests', title: 'Leave Requests', desc: 'Get notified when employees submit leave requests' },
                  { key: 'attendance_alerts', title: 'Attendance Alerts', desc: 'Receive alerts for unusual attendance patterns' },
                  { key: 'performance_reviews', title: 'Performance Reviews', desc: 'Reminders for upcoming performance reviews' },
                  { key: 'payroll_processing', title: 'Payroll Processing', desc: 'Notifications about payroll deadlines and completion' },
                  { key: 'new_applications', title: 'New Applications', desc: 'Alerts when new job applications are received' },
                ].map((item) => (
                  <div key={item.key} className="flex items-start justify-between pb-6 border-b border-blue-200 last:border-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications?.[item.key as keyof typeof settings.notifications] ?? true}
                        onChange={(e) => {
                          const newNotifications = {
                            ...settings.notifications,
                            [item.key]: e.target.checked
                          };
                          const newSettings = { ...settings, notifications: newNotifications };
                          setSettings(newSettings);
                          updateSettings(newSettings);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <Card className="border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                  <CardTitle className="text-blue-900">Change Password</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password" className="text-blue-900">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      className="border-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="text-blue-900">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      className="border-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password" className="text-blue-900">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      className="border-blue-200"
                    />
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Lock className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                  <CardTitle className="text-blue-900">Two-Factor Authentication</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-4">Add an extra layer of security to your account</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Enable 2FA
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'appearance' && (
            <Card className="border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <CardTitle className="text-blue-900">Theme Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-blue-900">Theme Mode</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {['light', 'dark', 'auto'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          const newSettings = { ...settings, theme_mode: mode };
                          setSettings(newSettings);
                          updateSettings(newSettings);
                        }}
                        className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                          settings.theme_mode === mode
                            ? 'border-blue-600 bg-blue-50 text-blue-900'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-blue-900">Primary Color</Label>
                  <div className="grid grid-cols-6 gap-3">
                    {[
                      { color: '#3b82f6', name: 'Blue' },
                      { color: '#8b5cf6', name: 'Purple' },
                      { color: '#10b981', name: 'Green' },
                      { color: '#f59e0b', name: 'Orange' },
                      { color: '#ef4444', name: 'Red' },
                      { color: '#06b6d4', name: 'Cyan' }
                    ].map(({ color, name }) => (
                      <button
                        key={color}
                        onClick={() => {
                          const newSettings = { ...settings, primary_color: color };
                          setSettings(newSettings);
                          updateSettings(newSettings);
                        }}
                        className={`w-full aspect-square rounded-lg border-4 transition-transform hover:scale-110 ${
                          settings.primary_color === color ? 'border-gray-900 scale-110' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                        title={name}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'integrations' && (
            <Card className="border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <CardTitle className="text-blue-900">Third-Party Integrations</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {[
                  { name: 'Slack', desc: 'Get HR notifications in Slack', icon: Mail, connected: true },
                  { name: 'Google Calendar', desc: 'Sync events and interviews', icon: Globe, connected: true },
                  { name: 'Zoom', desc: 'Schedule video interviews', icon: Globe, connected: false },
                  { name: 'QuickBooks', desc: 'Sync payroll data', icon: Database, connected: false },
                ].map((integration, index) => {
                  const Icon = integration.icon;
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900">{integration.name}</h4>
                          <p className="text-sm text-gray-600">{integration.desc}</p>
                        </div>
                      </div>
                      {integration.connected ? (
                        <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                          Disconnect
                        </Button>
                      ) : (
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          Connect
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
