import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ClipboardCheck,
  Wrench,
  ShieldCheck,
  BarChart3,
  Settings,
  X,
  Recycle,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/items', label: 'Items', icon: Package },
  { to: '/inspections', label: 'Inspections', icon: ClipboardCheck },
  { to: '/repairs', label: 'Repairs', icon: Wrench },
  { to: '/quality-control', label: 'Quality Control', icon: ShieldCheck },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-white
          flex flex-col transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Recycle size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Re<span className="text-emerald-400">Claim</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-slate-400">ReClaim v0.1.0</p>
          <p className="text-xs text-slate-500">Asset Recovery System</p>
        </div>
      </aside>
    </>
  );
}
