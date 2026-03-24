import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports, updateStatus, deleteReport } from '../services/api';
import { toast } from 'react-toastify';
import { MapPin, Image as ImageIcon, Trash2, LogOut, RefreshCw, Filter } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchReports();
  }, [navigate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await getReports();
      setReports(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatus(id, newStatus);
      toast.success('Status updated');
      fetchReports();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await deleteReport(id);
        toast.success('Report deleted');
        fetchReports();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete report');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  const filteredReports =
    filter === 'All'
      ? reports
      : reports.filter((r) => r.status === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LOW':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500 w-full">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Manage and track road maintenance issues
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={fetchReports}
            className="flex items-center text-gray-600 hover:text-indigo-600 font-semibold px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center text-gray-700 font-semibold">
          <Filter className="h-5 w-5 mr-2 text-indigo-500" />
          Filter by Status:
        </div>

        <div className="flex flex-wrap gap-2">
          {['All', 'Pending', 'In Progress', 'Resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === s
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 border-dashed">
          <p className="text-gray-500 text-lg font-medium">
            No reports found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredReports.map((report) => (
            <div
              key={report._id}
              className="bg-white rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 group"
            >
              
              {/* Image */}
              <div className="relative h-56 bg-gray-100 overflow-hidden">
                {report.image ? (
                  <img
                    src={report.image}
                    alt="Issue"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50">
                    <ImageIcon className="h-12 w-12 opacity-50" />
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 shadow-md ${getStatusColor(
                      report.status
                    )}`}
                  >
                    {report.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 grow flex flex-col">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 capitalize">
                    {report.issueType}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-gray-700 text-sm mb-4 grow bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                  <p className="line-clamp-4">{report.description}</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(report.priority)}`}>
                    Priority: {report.priority || 'N/A'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${report.isDuplicate ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                    {report.isDuplicate ? 'Duplicate' : 'Unique'}
                  </span>
                </div>

                {report.summary && (
                  <div className="text-sm text-gray-600 mb-4 p-3 rounded-xl bg-white border border-gray-100">
                    <strong>AI Summary:</strong> {report.summary}
                  </div>
                )}

                {report.aiSuggestion && (
                  <div className="text-sm text-gray-600 mb-4 p-3 rounded-xl bg-white border border-gray-100">
                    <strong>AI Suggestion:</strong> {report.aiSuggestion.urgency || 'Medium'}, workers: {report.aiSuggestion.workersNeeded || '2'}, eta: {report.aiSuggestion.estimatedTime || '2 days'}
                  </div>
                )}

                {report.aiDetection && (
                  <div className="text-sm text-gray-600 mb-4 p-3 rounded-xl bg-white border border-gray-100">
                    <strong>Image AI:</strong> {report.aiDetection.damageType || 'Unknown'} / {report.aiDetection.severity || 'Unknown'}
                  </div>
                )}

                {/* Location */}
                <div className="mt-auto space-y-5 pt-5 border-t border-gray-100">
                  <div className="flex items-start text-sm text-gray-600 font-medium bg-indigo-50/50 p-3 rounded-xl border border-indigo-50">
                    <MapPin className="h-5 w-5 mr-2 text-indigo-500 shrink-0 mt-0.5" />

                    <div className="flex flex-col">
                      {report.address && (
                        <span className="font-bold text-gray-800">
                          {report.address}
                        </span>
                      )}

                      <span className="text-gray-500 text-xs mt-0.5">
                        {report.location?.latitude
                          ? `GPS: ${report.location.latitude.toFixed(
                              5
                            )}, ${report.location.longitude.toFixed(5)}`
                          : !report.address && 'No location provided'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-4">
                    <select
                      value={report.status}
                      onChange={(e) =>
                        handleStatusChange(report._id, e.target.value)
                      }
                      className="text-sm border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 py-3 font-semibold grow outline-none border px-4 shadow-sm"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>

                    <button
                      onClick={() => handleDelete(report._id)}
                      className="text-red-500 hover:text-white hover:bg-red-500 p-3 rounded-xl transition-all border border-red-100 hover:border-red-500 shadow-sm"
                      title="Delete Report"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}