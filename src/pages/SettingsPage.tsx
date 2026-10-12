import { Settings, Building2, Users, Bell, Palette, Database } from 'lucide-react';

const settingsSections = [
  {
    icon: Building2,
    title: 'Business Profile',
    description: 'Update your business name, address, and contact information.',
    status: 'Coming soon',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Invite team members, assign roles, and manage access permissions.',
    status: 'Coming soon',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Configure email and in-app notification preferences.',
    status: 'Coming soon',
  },
  {
    icon: Palette,
    title: 'Appearance',
    description: 'Customize the look and feel of your workspace.',
    status: 'Coming soon',
  },
  {
    icon: Database,
    title: 'Data & Integrations',
    description: 'Manage data exports, backups, and third-party integrations.',
    status: 'Coming soon',
  },
  {
    icon: Settings,
    title: 'Workflow Configuration',
    description: 'Customize item statuses, inspection checklists, and QC criteria.',
    status: 'Coming soon',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          Manage your account, team, and application preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {settingsSections.map(({ icon: Icon, title, description, status }) => (
          <div
            key={title}
            className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4 items-start hover:shadow-sm transition-shadow"
          >
            <div className="bg-gray-100 p-2.5 rounded-lg shrink-0">
              <Icon size={20} className="text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500 mt-1">{description}</p>
              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-100 rounded-full">
                {status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
