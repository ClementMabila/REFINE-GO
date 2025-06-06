'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Home, MapPin, Fuel, Route, User } from 'lucide-react'; // adjust your icon import as needed

interface BottomNavProps {
  darkMode: boolean;
}

const BottomNav = ({ darkMode }: BottomNavProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: 'Home', path: '/Dashboard' },
    { icon: Route, label: 'Trips', path: '/Stats' },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <nav className={`md:hidden ${darkMode ? 'bg-black border-gray-600' : 'bg-white border-gray-200'} border-t`}>
      <div className="flex justify-around py-2">
        {navItems.map((item, index) => {
          const isActive = pathname === item.path;
          const colorClass = isActive
            ? 'text-[#2edda2]'
            : darkMode
              ? 'text-gray-400'
              : 'text-gray-600';

          return (
            <button
              key={index}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center py-1 px-3 ${colorClass}`}
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
