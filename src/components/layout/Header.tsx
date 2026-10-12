import { Menu, Bell, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
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

        {/* Right: notifications + user */}
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
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700 leading-tight">Operator</p>
              <p className="text-xs text-gray-400 leading-tight">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
