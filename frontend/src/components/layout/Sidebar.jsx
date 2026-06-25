import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import { LayoutDashboard, Users, BookOpen, Calendar, FileText, QrCode, User, Book } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();
  
  const teacherLinks = [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'Classes & Roster', path: '/teacher/classes', icon: Users },
    { name: 'Manual Attendance', path: '/teacher/attendance', icon: BookOpen },
    { name: 'QR Live View', path: '/teacher/qr-display', icon: QrCode },
    { name: 'Assignments', path: '/teacher/assignments', icon: FileText },
    { name: 'Dynamic Forms', path: '/teacher/dynamic-forms', icon: FileText },
    { name: 'Study Notes', path: '/teacher/notes', icon: Book },
    { name: 'Schedule', path: '/teacher/schedule', icon: Calendar },
    { name: 'Profile', path: '/teacher/profile', icon: User },
  ];

  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'QR Scanner', path: '/student/qr', icon: QrCode },
    { name: 'My Schedule', path: '/student/schedule', icon: Calendar },
    { name: 'Assignments', path: '/student/assignments', icon: FileText },
    { name: 'Dynamic Forms', path: '/student/dynamic-forms', icon: FileText },
    { name: 'Study Notes', path: '/student/notes', icon: Book },
    { name: 'Profile', path: '/student/profile', icon: User },
  ];

  const links = user?.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 transform border-r border-white/10 bg-white/80 backdrop-blur-xl transition-transform duration-300 ease-in-out dark:bg-slate-900/80 md:relative md:translate-x-0 pt-16 md:pt-0 shadow-2xl md:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
          <ul className="space-y-3 font-medium">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.name}>
                  <NavLink
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center rounded-xl p-3 text-gray-600 transition-all duration-300 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-slate-800/50 hover:-translate-y-0.5",
                        isActive && "bg-gradient-to-r from-indigo-500/10 to-blue-500/10 text-indigo-600 dark:from-indigo-500/20 dark:to-blue-500/20 dark:text-indigo-400 shadow-sm border border-indigo-500/20"
                      )
                    }
                  >
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-all duration-300 group-hover:scale-110",
                      "text-gray-400 group-hover:text-indigo-500"
                    )} />
                    <span className="ml-3 font-semibold">{link.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}
