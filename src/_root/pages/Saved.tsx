import { useState, useEffect } from 'react';
import axios from 'axios';

// Define a simple interface for the data we expect for a saved post
interface SavedPost {
  Post_id: number;
  Post_caption: string;
  Post_imageurl: string;
  User_username: string;
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
        // CORRECTED: This now uses the simpler /api/users/saved route
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
    return <div className="p-4 text-center">Loading saved posts...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="common-container p-4 md:p-8">
      <div className="flex items-center gap-2">
        <img src="/assets/icons/save.svg" alt="save" width={24} height={24} />
        <h2 className="h3-bold md:h2-bold text-left w-full">Saved Posts</h2>
      </div>
      
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {savedPosts.length > 0 ? (
          savedPosts.map(post => (
            <div key={post.Post_id} className="bg-gray-800 p-4 rounded-xl">
              <img 
                src={`http://localhost:5000${post.Post_imageurl}`} 
                alt="post" 
                className="w-full h-48 object-cover rounded-lg" 
              />
              <p className="mt-2 truncate">{post.Post_caption}</p>
              <p className="text-sm text-gray-400">by {post.User_username}</p>
            </div>
          ))
        ) : (
          <p>You haven't saved any posts yet.</p>
        )}
      </div>
    </div>
  );
};

export default Saved;