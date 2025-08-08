// src/_root/pages/Saved.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
// You can reuse the Post and LikeButton components if you extract them to their own files
// For now, we'll just define the interface again.
interface SavedPost {
  Post_id: number;
  Post_caption: string;
  Post_imageurl: string;
  User_username: string;
}

const Saved = () => {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:5000/api/users/saved', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSavedPosts(response.data);
      } catch (error) {
        console.error("Failed to fetch saved posts", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSavedPosts();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="common-container">
      <h2 className="h3-bold md:h2-bold text-left w-full">Saved Posts</h2>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {savedPosts.length > 0 ? (
          savedPosts.map(post => (
            <div key={post.Post_id} className="bg-gray-800 p-4 rounded-xl">
              <img src={`http://localhost:5000${post.Post_imageurl}`} alt="post" className="w-full h-48 object-cover rounded-lg" />
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