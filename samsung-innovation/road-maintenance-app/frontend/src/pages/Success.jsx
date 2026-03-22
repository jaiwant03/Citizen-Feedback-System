import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function Success() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-emerald-100 blur-sm"></div>
            <CheckCircle2 className="relative h-28 w-28 text-emerald-500 bg-white rounded-full" />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Report Submitted!</h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            Thank you for making our roads safer. Your feedback has been successfully submitted and will be reviewed by the authorities shortly.
          </p>
        </div>
        <div className="pt-6">
          <Link to="/" className="inline-flex items-center justify-center py-3.5 px-8 rounded-full shadow-md shadow-indigo-100 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
            Return to Home
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
