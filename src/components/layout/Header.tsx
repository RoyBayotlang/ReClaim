import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { user, profile, signOut } = useAuth();

  // Display name: prefer profile full_name, fall back to user email
  const displayName = profile?.full_name || user?.email || 'User';
  const displayRole = profile?.email || user?.email || '';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Left: menu button + page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h1>
        </div>

        {/* Right: notifications + user + logout */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
          </button>

          <div className="flex items-center gap-2 pl-2 ml-1 border-l border-gray-200">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="hidden sm:block max-w-[140px]">
              <p className="text-sm font-medium text-gray-700 leading-tight truncate">
                {displayName}
              </p>
              {displayRole && displayRole !== displayName && (
                <p className="text-xs text-gray-400 leading-tight truncate">
                  {displayRole}
                </p>
              )}
            </div>

            <button
              onClick={signOut}
              className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
