import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext'; // Import useAuth to get the current user

// Update the Post type to include like information
interface Post {
  Post_id: number;
  Post_caption: string;
  Post_imageurl: string;
  created_at: string;
  User_username: string;
  like_count: number;
  user_has_liked: boolean;
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Get the currently logged-in user

  // This function will be passed to the LikeButton
  const handleLikeToggle = (postId: number, newLikedStatus: boolean, newLikeCount: number) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.Post_id === postId
          ? { ...p, user_has_liked: newLikedStatus, like_count: newLikeCount }
          : p
      )
    );
  };

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return; // Don't fetch if the user isn't loaded yet

      try {
        // We now send the user's ID to the backend to check if they've liked each post
        const response = await axios.get(`http://localhost:5000/api/posts?userId=${user.id}`);
        setPosts(response.data);
      } catch (err) {
        setError('Failed to fetch posts.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [user]); // Re-fetch posts if the user changes

  if (isLoading) return <div>Loading posts...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

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
                {/* Like Button and Count */}
                <div className="flex items-center gap-2 mt-4">
                  <LikeButton
                    post={post}
                    onLikeToggle={handleLikeToggle}
                  />
                  <span>{post.like_count} {post.like_count === 1 ? 'like' : 'likes'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- LikeButton Component ---
// A separate component to manage the state and API calls for a single like button.
interface LikeButtonProps {
  post: Post;
  onLikeToggle: (postId: number, newLikedStatus: boolean, newLikeCount: number) => void;
}

const LikeButton = ({ post, onLikeToggle }: LikeButtonProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem('token');

  const handleLike = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (post.user_has_liked) {
        // --- Unlike the post ---
        await axios.delete(`http://localhost:5000/api/posts/${post.Post_id}/like`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        onLikeToggle(post.Post_id, false, post.like_count - 1);
      } else {
        // --- Like the post ---
        await axios.post(`http://localhost:5000/api/posts/${post.Post_id}/like`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        onLikeToggle(post.Post_id, true, post.like_count + 1);
      }
    } catch (error) {
      console.error("Failed to update like status", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button onClick={handleLike} disabled={isSubmitting}>
      <img
        src={`/assets/icons/${post.user_has_liked ? 'liked.svg' : 'like.svg'}`}
        alt="like"
        width={24}
        height={24}
      />
    </button>
  );
};

export default Home;