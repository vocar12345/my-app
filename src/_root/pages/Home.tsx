import { useState, useEffect } from 'react';
import axios from 'axios';

// Define a type for the post data we expect from the backend
interface Post {
  Post_id: number;
  Post_caption: string;
  Post_imageurl: string;
  created_at: string;
  User_username: string;
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/posts');
        setPosts(response.data);
      } catch (err) {
        setError('Failed to fetch posts.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []); // The empty dependency array means this runs once when the component mounts

  if (isLoading) {
    return <div>Loading posts...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className='flex flex-1'>
      <div className='home-container'>
        <h2 className="h3-bold md:h2-bold text-left w-full">Home Feed</h2>
        <div className="mt-8 flex flex-col gap-9">
          {posts.length === 0 ? (
            <p>No posts yet. Be the first to create one!</p>
          ) : (
            posts.map((post) => (
              <div key={post.Post_id} className="post-card bg-gray-800 p-5 rounded-xl">
                <div className="flex-between">
                  <div className="flex items-center gap-3">
                    {/* Placeholder for profile pic */}
                    <div className="w-12 h-12 rounded-full bg-gray-600"></div>
                    <p className="font-semibold">{post.User_username}</p>
                  </div>
                </div>
                <div className="py-5">
                  <p>{post.Post_caption}</p>
                </div>
                <img
                  src={`http://localhost:5000${post.Post_imageurl}`}
                  alt="post image"
                  className="post-card_img rounded-lg"
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;