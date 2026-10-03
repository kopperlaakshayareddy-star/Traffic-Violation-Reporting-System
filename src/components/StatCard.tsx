import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: 'blue' | 'orange' | 'green' | 'red' | 'gray';
}

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
  blue: { bg: 'bg-gov-blue-50', text: 'text-gov-blue-700', ring: 'ring-gov-blue-200' },
  orange: { bg: 'bg-gov-orange-50', text: 'text-gov-orange-700', ring: 'ring-gov-orange-200' },
  green: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-200' },
  red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-200' },
};

export default function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ring-4 ${c.bg} ${c.text} ${c.ring}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
