import { Link } from 'react-router-dom';
import { Home, AlertTriangle, User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full z-50 top-0 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <AlertTriangle className="h-8 w-8 text-indigo-600 mr-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-2xl tracking-tight text-gray-900">Road<span className="text-indigo-600">Fix</span></span>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md font-medium flex items-center transition-colors">
              <Home className="w-4 h-4 mr-1.5" /> Home
            </Link>
            <Link to="/report" className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5">
              Report Issue
            </Link>
            <Link to="/admin" className="text-gray-400 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
              <User className="w-4 h-4 mr-1" /> Admin Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
