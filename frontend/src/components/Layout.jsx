import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LogOut, Users, Settings, BarChart3, 
  Menu, X, ChevronLeft, ChevronRight,
  Sun, Moon 
} from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    
    return false;
  });

  // Sidebar states
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persist states
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('sidebarCollapsed');
    localStorage.removeItem('darkMode'); // optional
    navigate('/login');
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const toggleCollapse = () => setIsCollapsed(prev => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-72';
  const textVisible = !isCollapsed;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300">
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 lg:hidden z-40 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          flex flex-col transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarWidth}
        `}
      >
        {/* Logo / Header area */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 relative">
          <div className={`flex flex-col ${isCollapsed ? 'gap-4' : 'gap-3'}`}>
            {/* Logo */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl font-bold">A</span>
              </div>
              {textVisible && (
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold">AIDEN</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Security Awareness</p>
                </div>
              )}
            </div>

            {/* Collapse/Expand button */}
            <button
              onClick={toggleCollapse}
              className={`
                hidden lg:flex items-center justify-center
                ${isCollapsed 
                  ? 'w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-200 scale-100 hover:scale-110 z-10 hover:ring-2 hover:ring-blue-400/30 dark:hover:ring-blue-500/30' 
                  : 'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition'
                }
                ${isCollapsed ? 'mt-2' : 'absolute right-5 top-5'}
              `}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={closeMobile}
          className="lg:hidden absolute top-5 right-5 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 z-10"
          title="Close menu"
        >
          <X size={24} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            <NavItem to="/dashboard" icon={BarChart3} label="Dashboard" collapsed={isCollapsed} />
            <NavItem to="/employees" icon={Users} label="Employees" collapsed={isCollapsed} />
            <NavItem to="/settings" icon={Settings} label="Settings" collapsed={isCollapsed} />
          </ul>
        </nav>

        {/* Footer controls */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 mt-auto space-y-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              hover:bg-gray-100 dark:hover:bg-gray-800 
              text-gray-700 dark:text-gray-300
              font-medium transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}
              group
            `}
            title={isCollapsed ? (darkMode ? "Switch to light mode" : "Switch to dark mode") : undefined}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <Sun 
                size={20} 
                className={`
                  absolute transition-all duration-500 ease-in-out
                  ${darkMode 
                    ? 'opacity-0 scale-75 rotate-90' 
                    : 'opacity-100 scale-100 rotate-0'
                  }
                  group-hover:text-yellow-500 dark:group-hover:text-yellow-300
                `}
              />
              <Moon 
                size={20} 
                className={`
                  absolute transition-all duration-500 ease-in-out
                  ${darkMode 
                    ? 'opacity-100 scale-100 rotate-0' 
                    : 'opacity-0 scale-75 -rotate-90'
                  }
                  group-hover:text-indigo-500 dark:group-hover:text-indigo-300
                `}
              />
            </div>

            {textVisible && (
              <span className="transition-opacity duration-300">
                {darkMode ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-4 py-3 
              text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30
              rounded-xl font-medium transition
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {textVisible && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-5 py-4 flex items-center justify-between">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="text-gray-700 dark:text-gray-300 p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu size={24} />
          </button>

          <div className="text-xl font-bold">AIDEN</div>

          <div className="w-10" /> {/* balance */}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) => `
          flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition
          ${collapsed ? 'justify-center' : ''}
          ${isActive 
            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
        title={collapsed ? label : undefined}
      >
        <Icon size={20} className="flex-shrink-0" />
        {!collapsed && <span>{label}</span>}
      </NavLink>
    </li>
  );
}

export default Layout;