import { Link } from 'react-router-dom';
import { Shield, MapPin, Camera } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-16 py-12 md:py-24 animate-in fade-in duration-700">
      <div className="text-center max-w-4xl space-y-8">
        <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full text-sm font-semibold text-indigo-600 mb-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
          <span>Community Driven Maintenance</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight">
          Keep Our Roads <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Safe Together</span>
        </h1>
        
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Report potholes, cracks, and other road infrastructure issues directly to local authorities. Track the progress in real-time as we build a better city.
        </p>
        
        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/report" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 md:px-10 transition-all transform hover:scale-105 shadow-xl shadow-indigo-200">
            Report an Issue
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full text-gray-700 bg-white border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 md:px-10 transition-all">
            How it works
          </a>
        </div>
      </div>
      
      <div id="how-it-works" className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-24">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl text-indigo-600 border border-indigo-50">
            <MapPin className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Pinpoint Location</h3>
          <p className="text-gray-500 leading-relaxed">Use your device's GPS to provide exact coordinates for crews to quickly locate the damage.</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl text-purple-600 border border-purple-50">
            <Camera className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Upload Evidence</h3>
          <p className="text-gray-500 leading-relaxed">Snap a quick photo of the pothole or crack. Visual proof helps prioritize repairs effectively.</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl text-emerald-600 border border-emerald-50">
            <Shield className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Track Progress</h3>
          <p className="text-gray-500 leading-relaxed">Authorities review reports within 24 hours. Track the status from "Pending" to "Resolved".</p>
        </div>
      </div>
    </div>
  );
}
