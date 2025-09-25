import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Library, 
  BookOpen, 
  Settings, 
  BarChart3, 
  Users,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/bibliotheque', icon: Library, label: 'Bibliothèque' },
    { path: '/lectures', icon: BookOpen, label: 'Mes Lectures' },
    { path: '/rapports', icon: BarChart3, label: 'Rapports' },
    { path: '/parametres', icon: Settings, label: 'Paramètres' },
  ];

  // Ajouter l'item Suivi pour les enseignants et admins
  if (user?.role === 'enseignant' || user?.role === 'admin') {
    navigationItems.splice(4, 0, { path: '/suivi', icon: Users, label: 'Suivi de Classe' });
  }

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo et titre */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-gray-900">Mon Espace de Lecture</h1>
            </div>
          </div>

          {/* Navigation principale */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${
                      isActive(item.path)
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Menu utilisateur */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user?.prenom} {user?.nom}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {user?.role}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline ml-2">Déconnexion</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation mobile */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-2 ${
                  isActive(item.path)
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="px-3 py-2 text-sm text-gray-600 flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{user?.prenom} {user?.nom}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

