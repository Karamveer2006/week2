import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { Moon, Sun, LogOut, Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-40 flex w-full h-16 items-center justify-between glass border-b-0 px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        <button onClick={toggleSidebar} className="md:hidden p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="ClassFlow Logo" className="h-8 w-8 rounded-lg object-contain drop-shadow" />
          <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            ClassFlow
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-5">
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
        <div className="hidden md:flex items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-4">
          <Link to={`/${user?.role}/profile`} className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-transparent group-hover:ring-indigo-300 dark:group-hover:ring-indigo-500 transition-all duration-300">
              {getInitials(user?.name)}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{user?.role}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {user?.name}
              </span>
            </div>
          </Link>
        </div>
        <NotificationBell />
        <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </nav>
  );
}
