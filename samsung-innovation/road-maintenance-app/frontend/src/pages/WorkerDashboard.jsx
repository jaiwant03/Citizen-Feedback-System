import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2, CheckCircle, Clock, UploadCloud, User, Shield, FileText, Wrench, CheckSquare } from 'lucide-react';

export default function WorkerDashboard() {
  const [email, setEmail] = useState(localStorage.getItem('workerEmail') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('workerEmail'));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // For status updates
  const [updatingId, setUpdatingId] = useState(null);
  const [completionImages, setCompletionImages] = useState({});

  const handleLogout = useCallback(() => {
    localStorage.removeItem('workerEmail');
    setIsAuthenticated(false);
    setTasks([]);
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/worker/tasks', {
        headers: { 'X-User-Email': email }
      });
      setTasks(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch tasks');
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [email, handleLogout]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated, fetchTasks]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email.trim()) {
      localStorage.setItem('workerEmail', email);
      setIsAuthenticated(true);
    }
  };

  const handleImageUpload = (taskId, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be < 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionImages((prev) => ({ ...prev, [taskId]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateStatus = async (complaintId, status) => {
    const uploadedImage = completionImages[complaintId];
    if (status === 'Resolved' && !uploadedImage) {
      toast.error("A completion photo is required to resolve a task.");
      return;
    }
    
    setUpdatingId(complaintId);
    try {
      await axios.post('http://localhost:5000/api/worker/update-status', {
        complaintId,
        status,
        completionImage: status === 'Resolved' ? uploadedImage : undefined
      }, {
        headers: { 'X-User-Email': email }
      });
      
      toast.success(`Task marked as ${status}`);
      setCompletionImages((prev) => ({ ...prev, [complaintId]: '' }));
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl text-center border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Worker Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="worker@city.gov"
            required
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Worker Dashboard</h1>
          <p className="text-gray-500 text-sm">Logged in as {email}</p>
        </div>
        <button onClick={handleLogout} className="text-red-600 font-semibold hover:text-red-800 bg-red-50 px-4 py-2 rounded-lg">Logout</button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* System Workflow Section */}
          <div className="mb-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-linear-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-2xl">🔄</span>
                System Workflow
              </h2>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 border-2 border-blue-200">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-center text-sm">User Submission</h3>
                  <p className="text-xs text-gray-600 text-center mt-1">Citizen reports issue</p>
                </div>

                <div className="flex items-center justify-center md:justify-between">
                  <div className="hidden md:block w-full h-1 bg-gray-200"></div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3 border-2 border-purple-200">
                    <Shield className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-center text-sm">Admin Handling</h3>
                  <p className="text-xs text-gray-600 text-center mt-1">Admin assigns task</p>
                </div>

                <div className="flex items-center justify-center md:justify-between">
                  <div className="hidden md:block w-full h-1 bg-gray-200"></div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3 border-2 border-indigo-200">
                    <FileText className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-center text-sm">Worker Dashboard</h3>
                  <p className="text-xs text-gray-600 text-center mt-1">View assigned task</p>
                </div>

                <div className="flex items-center justify-center md:justify-between">
                  <div className="hidden md:block w-full h-1 bg-gray-200"></div>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 border-2 border-green-200">
                    <Wrench className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-center text-sm">Resolution</h3>
                  <p className="text-xs text-gray-600 text-center mt-1">Fix issue & upload image</p>
                </div>

                <div className="flex items-center justify-center md:justify-between">
                  <div className="hidden md:block w-full h-1 bg-gray-200"></div>
                </div>

                {/* Step 5 */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3 border-2 border-emerald-200">
                    <CheckSquare className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-center text-sm">Verification</h3>
                  <p className="text-xs text-gray-600 text-center mt-1">Admin verifies completion</p>
                </div>
              </div>
            </div>
          </div>

          {/* Task List Section */}
          {tasks.length === 0 ? (
            <div className="text-center bg-white p-12 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-lg">No tasks currently available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task) => (
                <div key={task._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                      task.status === 'Pending' ? 'bg-red-100 text-red-700' : 
                      task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {task.status}
                    </span>
                    {task.isEmergency && <span className="bg-red-600 text-white px-2 py-1 text-[10px] font-bold rounded-md">EMERGENCY</span>}
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 capitalize text-gray-900">{task.issueType}</h3>
                  <p className="text-sm text-gray-600 mb-4 grow line-clamp-3">{task.description}</p>
                  
                  <div className="text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p><strong>Location:</strong> {task.address || "GPS Coordinates"}</p>
                    <p><strong>Priority:</strong> {task.priority}</p>
                    {task.aiDetection && <p><strong>AI Detected:</strong> {task.aiDetection?.damageType} ({task.aiDetection?.severity})</p>}
                  </div>

                  {task.status !== 'Resolved' && (
                    <div className="mt-auto space-y-3 border-t border-gray-100 pt-4">
                      {task.status === 'Pending' && (
                        <button 
                          onClick={() => updateStatus(task._id, 'In Progress')}
                          disabled={updatingId === task._id}
                          className="w-full py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                          {updatingId === task._id ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Clock className="w-4 h-4 mr-2"/>}
                          Start Work
                        </button>
                      )}
                      
                      {task.status === 'In Progress' && (
                        <div className="w-full space-y-4">
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center">
                              <span className="text-lg mr-2">📸</span>
                              Completion Photo Required
                            </h4>
                            <p className="text-xs text-amber-700">
                              Please upload a photo showing the completed work to mark this task as resolved.
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleImageUpload(task._id, e)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {(completionImages[task._id] ?? '') && (
                              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                  <span className="text-sm font-medium text-green-800">Photo uploaded successfully!</span>
                                </div>
                                <img src={completionImages[task._id]} alt="Completion Preview" className="w-full h-32 object-cover rounded-lg" />
                              </div>
                            )}
                          </div>
                          
                          <button 
                            onClick={() => updateStatus(task._id, 'Resolved')}
                            disabled={updatingId === task._id || !(completionImages[task._id] ?? '')}
                            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                             {updatingId === task._id ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <CheckCircle className="w-4 h-4 mr-2"/>}
                             {(completionImages[task._id] ?? '') ? 'Mark Task as Completed' : 'Upload Photo to Complete'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
