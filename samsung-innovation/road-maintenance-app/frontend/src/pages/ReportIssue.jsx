import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitReport } from '../services/api';
import { toast } from 'react-toastify';
import { UploadCloud, MapPin, Loader2, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ReportIssue() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    issueType: 'pothole',
    description: '',
    image: '',
    location: { latitude: null, longitude: null },
    address: '',
    isEmergency: false
  });

  const [locationStatus, setLocationStatus] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, address: value });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    if (value.length > 3) {
      typingTimeoutRef.current = setTimeout(() => {
        searchAddress(value);
      }, 600);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const searchAddress = async (query) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  const selectSuggestion = (suggestion) => {
    setFormData({
      ...formData,
      address: suggestion.display_name,
      location: {
        latitude: parseFloat(suggestion.lat),
        longitude: parseFloat(suggestion.lon)
      }
    });
    setSuggestions([]);
    setShowSuggestions(false);
    setLocationStatus('Location selected from map data');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    setLocationStatus('Getting GPS and Address...');
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          
          setFormData({
            ...formData,
            location: { latitude: lat, longitude: lon },
            address: data.display_name || formData.address
          });
          setLocationStatus('GPS & Address acquired!');
          toast.success('Location mapped automatically');
        } catch (e) {
          setFormData({
            ...formData,
            location: { latitude: lat, longitude: lon }
          });
          setLocationStatus('GPS acquired (Address failed)');
        }
      },
      () => {
        setLocationStatus('GPS blocked. Please type your address manually.');
        toast.info('GPS permission denied. Please use the text box above to search for your address manually.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      toast.error('Please upload an image of the issue');
      return;
    }
    if (!formData.location.latitude) {
      toast.error('GPS location is strictly required! Please use the GPS button to capture your location or type the address and select from dropdown.');
      return;
    }
    
    // Add current language to the formData correctly
    const finalData = { ...formData, language: i18n.language || "en" };

    setLoading(true);
    try {
      await submitReport(finalData);
      navigate('/success');
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in slide-in-from-bottom-4 duration-500 w-full">
      <div className={`bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden ${formData.isEmergency ? 'shadow-red-200/50 border-red-200' : 'shadow-indigo-100/50'}`}>
        <div className={`px-8 py-8 text-white text-center transition-colors duration-300 ${formData.isEmergency ? 'bg-red-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
          <h2 className="text-3xl font-extrabold tracking-tight">{t('report_issue')}</h2>
          <p className="mt-2 text-white/90 font-medium">{t('help_text')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 md:px-10 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">{t('full_name')}</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">{t('email_address')}</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none" placeholder="john@example.com" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">{t('issue_type')}</label>
            <select name="issueType" value={formData.issueType} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none">
              <option value="pothole">{t('pothole')}</option>
              <option value="crack">{t('crack')}</option>
              <option value="drainage">{t('drainage')}</option>
              <option value="signage">{t('signage')}</option>
              <option value="other">{t('other')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">{t('description')}</label>
            <textarea required name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none" placeholder="Please describe the issue in detail"></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">{t('upload_image')}</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-indigo-200 border-dashed rounded-2xl cursor-pointer bg-indigo-50/50 hover:bg-indigo-50 transition-colors relative overflow-hidden group">
                <div className="flex flex-col items-center justify-center p-6 w-full h-full text-center">
                  {formData.image ? (
                    <div className="relative w-full flex justify-center">
                      <img src={formData.image} alt="Preview" className="h-32 object-contain rounded-lg shadow-sm" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                        <span className="text-white text-sm font-medium">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                        <UploadCloud className="w-8 h-8 text-indigo-500" />
                      </div>
                      <p className="mb-1 text-sm text-gray-700"><span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-700">{t('location')}</label>
            <div className={`bg-gray-50 p-5 rounded-2xl border flex flex-col gap-4 ${formData.location.latitude ? 'border-emerald-200' : 'border-red-300'}`}>
              <div className="relative w-full">
                <input 
                  type="text" 
                  name="address" 
                  value={formData.address} 
                  autoComplete="off"
                  onChange={handleAddressChange} 
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" 
                  placeholder="Type address to search for coordinates..." 
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <li 
                        key={i} 
                        className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex items-start gap-2 border-b border-gray-50 last:border-0 transition-colors"
                        onClick={() => selectSuggestion(s)}
                      >
                         <Navigation className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                         <span className="text-sm text-gray-700">{s.display_name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                <button type="button" onClick={getLocation} className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">
                  <MapPin className="w-4 h-4 mr-2 text-indigo-600" />
                  {t('get_gps')}
                </button>
                <div className="text-sm font-medium pr-2">
                  {formData.location.latitude ? (
                    <span className="text-emerald-600 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                      GPS recorded
                    </span>
                  ) : (
                    <span className="text-red-500 font-bold">
                      ⚠ GPS Required
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-3 cursor-pointer select-none bg-red-50 p-4 rounded-xl border border-red-100 hover:bg-red-100 transition-colors">
              <input type="checkbox" className="form-checkbox h-6 w-6 text-red-600 rounded-md border-gray-300 focus:ring-red-500" checked={formData.isEmergency} onChange={(e) => setFormData({...formData, isEmergency: e.target.checked})} />
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-red-600">{t('emergency')}</span>
                <span className="text-xs text-red-500 font-medium">{t('emergency_desc')}</span>
              </div>
            </label>
          </div>

          <div className="pt-6">
            <button type="submit" disabled={loading} className={`w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-none disabled:opacity-70 disabled:cursor-not-allowed ${formData.isEmergency ? 'bg-red-600 hover:bg-red-700 shadow-red-200 focus:ring-red-500' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 focus:ring-indigo-500'}`}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-6 w-6 text-white" />
                  {t('submitting')}
                </>
              ) : (
                formData.isEmergency ? "🚨 Submit EMERGENCY Report" : t('submit')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
