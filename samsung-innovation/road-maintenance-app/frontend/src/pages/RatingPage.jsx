import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Star, Loader2 } from 'lucide-react';

export default function RatingPage() {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  const submitRating = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/rate', {
        complaintId: id,
        token,
        rating
      });
      toast.success('Thank you for your feedback!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-2xl text-center border border-gray-100">
      <h2 className="text-3xl font-extrabold mb-3 text-gray-900">Rate Resolution Quality</h2>
      <p className="text-gray-500 mb-8 font-medium">How satisfied are you with the road maintenance work done?</p>
      
      <div className="flex justify-center gap-2 mb-10">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none transition-transform hover:scale-125 duration-200"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(rating)}
          >
            <Star
              className={`w-14 h-14 transition-colors duration-200 ${star <= (hover || rating) ? 'fill-yellow-400 text-yellow-400 drop-shadow-md' : 'text-gray-200 fill-gray-100 hover:text-gray-300'}`}
            />
          </button>
        ))}
      </div>
      
      <button
        onClick={submitRating}
        disabled={loading || rating === 0}
        className="w-full flex justify-center items-center px-6 py-4 text-lg font-bold rounded-xl shadow-lg shadow-indigo-200 text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
      >
        {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : 'Submit Feedback'}
      </button>
    </div>
  );
}
