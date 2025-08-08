import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

// Interface for the Post data, now including save status
interface Post {
  Post_id: number;
  Post_caption: string;
  Post_imageurl: string;
  created_at: string;
  User_username: string;
  like_count: number;
  user_has_liked: boolean;
  user_has_saved: boolean;
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Handler to update the UI instantly when a post is liked/unliked
  const handleLikeToggle = (postId: number, newLikedStatus: boolean, newLikeCount: number) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.Post_id === postId
          ? { ...p, user_has_liked: newLikedStatus, like_count: newLikeCount }
          : p
      )
    );
  };

  // Handler to update the UI instantly when a post is saved/unsaved
  const handleSaveToggle = (postId: number, newSavedStatus: boolean) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.Post_id === postId ? { ...p, user_has_saved: newSavedStatus } : p
      )
    );
  };

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;
      try {
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
  }, [user]);

  if (isLoading) return <div>Loading posts...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className='flex flex-1'>
      <div className='home-container p-4 md:p-8'>
        <h2 className="h3-bold md:h2-bold text-left w-full">Home Feed</h2>
        <div className="mt-8 flex flex-col gap-9">
          {posts.length === 0 ? (
            <p>No posts yet. Be the first to create one!</p>
          ) : (
            posts.map((post) => (
              <div key={post.Post_id} className="post-card bg-gray-800 p-5 rounded-xl max-w-screen-sm mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-600"></div>
                  <Link to={`/profile/${post.User_username}`} className="font-semibold hover:underline">
                    {post.User_username}
                  </Link>
                </div>
                <div className="py-5">
                  <p>{post.Post_caption}</p>
                </div>
                <img
                  src={`http://localhost:5000${post.Post_imageurl}`}
                  alt="post image"
                  className="post-card_img rounded-lg"
                />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2">
                    <LikeButton post={post} onLikeToggle={handleLikeToggle} />
                    <span>{post.like_count} {post.like_count === 1 ? 'like' : 'likes'}</span>
                  </div>
                  <SaveButton post={post} onSaveToggle={handleSaveToggle} />
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
        await axios.delete(`http://localhost:5000/api/posts/${post.Post_id}/like`, { headers: { 'Authorization': `Bearer ${token}` } });
        onLikeToggle(post.Post_id, false, post.like_count - 1);
      } else {
        await axios.post(`http://localhost:5000/api/posts/${post.Post_id}/like`, {}, { headers: { 'Authorization': `Bearer ${token}` } });
        onLikeToggle(post.Post_id, true, post.like_count + 1);
      }
    } catch (error) { console.error("Failed to update like status", error); }
    finally { setIsSubmitting(false); }
  };
  return (
    <button onClick={handleLike} disabled={isSubmitting}>
      <img src={`/assets/icons/${post.user_has_liked ? 'liked.svg' : 'like.svg'}`} alt="like" width={24} height={24} />
    </button>
  );
};

// --- SaveButton Component ---
interface SaveButtonProps {
  post: Post;
  onSaveToggle: (postId: number, newSavedStatus: boolean) => void;
}
const SaveButton = ({ post, onSaveToggle }: SaveButtonProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem('token');
  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (post.user_has_saved) {
        await axios.delete(`http://localhost:5000/api/posts/${post.Post_id}/save`, { headers: { 'Authorization': `Bearer ${token}` } });
        onSaveToggle(post.Post_id, false);
      } else {
        await axios.post(`http://localhost:5000/api/posts/${post.Post_id}/save`, {}, { headers: { 'Authorization': `Bearer ${token}` } });
        onSaveToggle(post.Post_id, true);
      }
    } catch (error) { console.error("Failed to update save status", error); }
    finally { setIsSubmitting(false); }
  };
  return (
    <button onClick={handleSave} disabled={isSubmitting}>
      <img src={`/assets/icons/${post.user_has_saved ? 'saved.svg' : 'save.svg'}`} alt="save" width={20} height={20} />
    </button>
  );
};

export default Home;