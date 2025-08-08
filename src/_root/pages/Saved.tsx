import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// The interface matches the snake_case data from the backend
interface SavedPost {
  post_id: number;
  post_caption: string;
  post_imageurl: string;
  user_username: string;
}

const Saved = () => {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("You must be logged in to see saved posts.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/users/saved', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSavedPosts(response.data);
      } catch (err) {
        setError("Failed to fetch saved posts.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedPosts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-center w-full h-full">
        <p className="text-light-1">Loading saved posts...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex-center w-full h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="common-container p-4 md:p-8 w-full">
      <div className="flex items-center gap-2 mb-8">
        <img src="/assets/icons/save.svg" alt="save" width={30} height={30} />
        <h2 className="h3-bold md:h2-bold text-left w-full">Saved Posts</h2>
      </div>
      
      {savedPosts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {savedPosts.map(post => (
            // Using the correct snake_case property names here
            <div key={post.post_id} className="bg-gray-800 p-4 rounded-xl">
              <img 
                src={`http://localhost:5000${post.post_imageurl}`} 
                alt="post" 
                className="w-full h-48 object-cover rounded-lg" 
              />
              <p className="mt-2 truncate">{post.post_caption}</p>
              <p className="text-sm text-gray-400">by {post.user_username}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400">
          <p>You haven't saved any posts yet.</p>
          <Link to="/" className="text-primary-500 hover:underline mt-2 inline-block">
            Find some posts to save!
          </Link>
        </div>
      )}
    </div>
  );
};

export default Saved;