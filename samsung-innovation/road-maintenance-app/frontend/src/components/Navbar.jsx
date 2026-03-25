import { Link } from 'react-router-dom';
import { Home, AlertTriangle, User, Globe, Map as MapIcon, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };
  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full z-50 top-0 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="shrink-0 flex items-center group">
              <AlertTriangle className="h-8 w-8 text-indigo-600 mr-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-2xl tracking-tight text-gray-900">Road<span className="text-indigo-600">Fix</span></span>
            </Link>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className="hidden sm:flex items-center bg-gray-100 rounded-full px-2 py-1">
              <Globe className="w-4 h-4 text-gray-500 mr-1" />
              <button type="button" onClick={() => changeLanguage('en')} className={`px-2 py-1 text-xs font-bold rounded-full transition-colors ${i18n.language === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-indigo-600'}`}>EN</button>
              <button type="button" onClick={() => changeLanguage('ta')} className={`px-2 py-1 text-xs font-bold rounded-full transition-colors ${i18n.language === 'ta' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-indigo-600'}`}>TA</button>
              <button type="button" onClick={() => changeLanguage('hi')} className={`px-2 py-1 text-xs font-bold rounded-full transition-colors ${i18n.language === 'hi' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-indigo-600'}`}>HI</button>
            </div>
            
            <Link to="/map" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 py-2 rounded-md font-medium flex items-center transition-colors">
              <MapIcon className="w-4 h-4 mr-1 sm:mr-1.5" /> <span className="hidden md:inline">{t('map') || 'Map'}</span>
            </Link>
            
            <Link to="/worker" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 py-2 rounded-md font-medium flex items-center transition-colors">
              <Briefcase className="w-4 h-4 mr-1 sm:mr-1.5" /> <span className="hidden md:inline">{t('worker') || 'Worker'}</span>
            </Link>
            
            <Link to="/admin" className="text-gray-400 hover:text-gray-700 px-2 sm:px-3 py-2 rounded-md font-medium flex items-center transition-colors">
              <User className="w-4 h-4 mr-1" /> <span className="hidden md:inline">{t('admin_dashboard') || 'Admin'}</span>
            </Link>

            <Link to="/report" className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 whitespace-nowrap">
              {t('report_issue') || "Report Issue"}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
