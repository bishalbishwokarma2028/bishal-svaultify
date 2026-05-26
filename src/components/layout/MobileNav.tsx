import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderLock, Scan, KeyRound, Menu } from 'lucide-react';

interface MobileNavProps {
  onOpenMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenMenu }) => {
  const items = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Vault', path: '/vault', icon: FolderLock },
    { name: 'Scan', path: '/scanner', icon: Scan },
    { name: 'Keys', path: '/passwords', icon: KeyRound },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass-panel border-t border-white/10 z-40 px-4 flex items-center justify-around pb-safe">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all
              ${isActive 
                ? 'text-blue-400 font-semibold' 
                : 'text-gray-400 hover:text-gray-200'}
            `}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{item.name}</span>
          </NavLink>
        );
      })}

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-gray-400 hover:text-gray-200 transition-all"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">More</span>
      </button>
    </div>
  );
};
