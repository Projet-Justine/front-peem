import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, MessageSquare, FolderOpen, Video, Users,
  Newspaper, BookOpen, BarChart3, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, Shield, User, Menu, X
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['*'] },
  { to: '/feed', label: 'Fil d\'actualité', icon: Newspaper, roles: ['*'] },
  { to: '/chat', label: 'Messages', icon: MessageSquare, roles: ['*'] },
  { to: '/groups', label: 'Groupes', icon: Users, roles: ['*'] },
  { to: '/files', label: 'Fichiers', icon: FolderOpen, roles: ['*'] },
  { to: '/meetings', label: 'Réunions', icon: Video, roles: ['*'] },
  { to: '/academic', label: 'Unités d\'enseignement', icon: BookOpen, roles: ['*'] },
  { to: '/grades', label: 'Notes & Résultats', icon: BarChart3, roles: ['*'] },
  { to: '/social', label: 'Réseau social', icon: User, roles: ['*'] },
  { to: '/admin', label: 'Administration', icon: Shield, roles: ['ADMIN', 'SCOLARITE', 'RESPONSABLE_FILIERE'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(item => {
    if (item.roles.includes('*')) return true;
    return user && item.roles.includes(user.role);
  });

  const roleLabel: Record<string, string> = {
    ADMIN: 'Administrateur',
    SCOLARITE: 'Scolarité',
    RESPONSABLE_FILIERE: 'Resp. Filière',
    ENSEIGNANT: 'Enseignant',
    ETUDIANT: 'Étudiant',
    DELEGUE: 'Délégué',
  };

  const roleColor: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700',
    SCOLARITE: 'bg-purple-100 text-purple-700',
    RESPONSABLE_FILIERE: 'bg-orange-100 text-orange-700',
    ENSEIGNANT: 'bg-blue-100 text-blue-700',
    ETUDIANT: 'bg-green-100 text-green-700',
    DELEGUE: 'bg-teal-100 text-teal-700',
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`
        ${mobile ? 'fixed inset-y-0 left-0 z-50 shadow-2xl' : 'hidden md:flex'}
        flex flex-col bg-white border-r border-slate-200
        transition-all duration-300
        ${collapsed && !mobile ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <span className="text-white font-bold text-xs">E</span>
            </div>
            <span className="font-bold text-slate-800 text-sm">EMIT Platform</span>
          </div>
        )}
        {collapsed && !mobile && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xs">E</span>
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-500 ml-auto"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="p-1 rounded-md hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        )}
      </div>

      {/* User info */}
      {(!collapsed || mobile) && user && (
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user.prenom?.[0]}{user.nom?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.prenom} {user.nom}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleColor[user.role] || 'bg-slate-100 text-slate-600'}`}>
                {roleLabel[user.role] || user.role}
              </span>
            </div>
          </div>
          {user.filiere && (
            <p className="text-xs text-slate-400 mt-1 truncate">{user.filiere} · {user.niveau}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {filteredNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }
              ${collapsed && !mobile ? 'justify-center' : ''}`
            }
            title={collapsed && !mobile ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {(!collapsed || mobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-slate-100 px-2 py-3 space-y-0.5">
        <NavLink
          to="/notifications"
          onClick={() => mobile && setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
            ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
            ${collapsed && !mobile ? 'justify-center' : ''}`
          }
          title={collapsed && !mobile ? 'Notifications' : undefined}
        >
          <Bell size={18} className="flex-shrink-0" />
          {(!collapsed || mobile) && <span>Notifications</span>}
        </NavLink>
        <NavLink
          to="/profile"
          onClick={() => mobile && setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
            ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
            ${collapsed && !mobile ? 'justify-center' : ''}`
          }
          title={collapsed && !mobile ? 'Mon Profil' : undefined}
        >
          <Settings size={18} className="flex-shrink-0" />
          {(!collapsed || mobile) && <span>Mon Profil</span>}
        </NavLink>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-150
            ${collapsed && !mobile ? 'justify-center' : ''}`}
          title={collapsed && !mobile ? 'Déconnexion' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {(!collapsed || mobile) && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden">
          <Sidebar mobile />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md hover:bg-slate-100 text-slate-600"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <span className="text-white font-bold text-xs">E</span>
            </div>
            <span className="font-bold text-slate-800 text-sm">EMIT Platform</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
