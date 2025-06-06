'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Route, User } from 'lucide-react';
import { useEffect, useState }from 'react';

interface BottomNavProps {
  darkMode: boolean;
  user: { username: string } | null;
}

const BottomNav = ({ darkMode}: BottomNavProps) => {

  interface User {
      name: string;
      username: string;
      email: string;
      profilePicture: string | null;
  }

  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
      const fetchCsrfAndUser = async () => {
          try {
          const response = await fetch(`${API_BASE_URL}/api/csrf-token/`, {
              credentials: 'include',
          });
          const data = await response.json();
          const token = data.csrfToken;
          setCsrfToken(token);

          const userRes = await fetch(`${API_BASE_URL}/api/logged_user`, {
              method: 'GET',
              headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': token,
              },
              credentials: 'include',
          });
          const userData = await userRes.json();
          if (userData.authenticated) {
              setUser(userData.user);
          }
          } catch (error) {
          console.error('Failed to fetch CSRF token or user:', error);
          setUser(null);
          setError('Failed to fetch user info');
          } finally {
          setLoading(false);
          }
      };

      fetchCsrfAndUser();
      }, []);

  const navItems = [
    { icon: Home, label: 'Home', path: '/Dashboard' },
    { icon: Route, label: 'Trips', path: user ? '/Stats' : '/Login', },
    {
      icon: User,
      label: 'Profile',
      path: user ? '/profile' : '/Login',
    },
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
