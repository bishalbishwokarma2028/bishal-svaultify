import React from 'react';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills'
}) => {
  return (
    <div className={`flex items-center gap-1 overflow-x-auto no-scrollbar ${variant === 'pills' ? 'bg-white/[0.03] p-1 rounded-xl border border-white/5' : 'border-b border-white/10'}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isActive 
                ? 'text-white' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400'}`}>
                {tab.count}
              </span>
            )}

            {isActive && variant === 'pills' && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-white/10 rounded-lg -z-10 border border-white/10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}

            {isActive && variant === 'underline' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 glow-blue"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
