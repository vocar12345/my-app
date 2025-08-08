import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

// Reusing the Post interface from Home.tsx
interface Post {
  Post_id: number;
  Post_caption: string;
  Post_imageurl: string;
  created_at: string;
  User_username: string;
  User_image: string | null;
  like_count: number;
  user_has_liked: boolean;
  user_has_saved: boolean;
}

const PostDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // We need to redefine these handlers here or move them to a shared utility file
  const handleLikeToggle = (newLikedStatus: boolean, newLikeCount: number) => {
    if (!post) return;
    setPost({ ...post, user_has_liked: newLikedStatus, like_count: newLikeCount });
  };

  const handleSaveToggle = (newSavedStatus: boolean) => {
    if (!post) return;
    setPost({ ...post, user_has_saved: newSavedStatus });
  };

  useEffect(() => {
    const fetchPost = async () => {
      if (!id || !user) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/posts/${id}?userId=${user.id}`);
        setPost(response.data);
      } catch (err) {
        setError('Failed to fetch post details.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [id, user]);

  if (isLoading) return <div className="p-4 text-center">Loading post...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!post) return <div className="p-4 text-center">Post not found.</div>;

  return (
    <div className="post-details-container w-full max-w-4xl p-4 md:p-8">
      <div className="post-card bg-gray-800 p-5 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <img 
            src={post.User_image ? `http://localhost:5000${post.User_image}` : '/assets/icons/profile-placeholder.svg'}
            alt="creator"
            className="w-12 h-12 rounded-full object-cover"
          />
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
          className="post-card_img rounded-lg w-full object-cover"
        />
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <LikeButton post={post} onLikeToggle={handleLikeToggle} />
            <span>{post.like_count} {post.like_count === 1 ? 'like' : 'likes'}</span>
          </div>
          <SaveButton post={post} onSaveToggle={handleSaveToggle} />
        </div>
      </div>
    </div>
  );
};

// --- Child Components ---
// Note: It's better practice to move these into their own files to avoid duplication.
interface LikeButtonProps { post: Post; onLikeToggle: (newLikedStatus: boolean, newLikeCount: number) => void; }
const LikeButton = ({ post, onLikeToggle }: LikeButtonProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem('token');
  const handleLike = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (post.user_has_liked) {
        await axios.delete(`http://localhost:5000/api/posts/${post.Post_id}/like`, { headers: { 'Authorization': `Bearer ${token}` } });
        onLikeToggle(false, post.like_count - 1);
      } else {
        await axios.post(`http://localhost:5000/api/posts/${post.Post_id}/like`, {}, { headers: { 'Authorization': `Bearer ${token}` } });
        onLikeToggle(true, post.like_count + 1);
      }
    } catch (error) { console.error("Failed to update like status", error); }
    finally { setIsSubmitting(false); }
  };
  return ( <button onClick={handleLike} disabled={isSubmitting}> <img src={`/assets/icons/${post.user_has_liked ? 'liked.svg' : 'like.svg'}`} alt="like" width={24} height={24} /> </button> );
};

interface SaveButtonProps { post: Post; onSaveToggle: (newSavedStatus: boolean) => void; }
const SaveButton = ({ post, onSaveToggle }: SaveButtonProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem('token');
  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (post.user_has_saved) {
        await axios.delete(`http://localhost:5000/api/posts/${post.Post_id}/save`, { headers: { 'Authorization': `Bearer ${token}` } });
        onSaveToggle(false);
      } else {
        await axios.post(`http://localhost:5000/api/posts/${post.Post_id}/save`, {}, { headers: { 'Authorization': `Bearer ${token}` } });
        onSaveToggle(true);
      }
    } catch (error) { console.error("Failed to update save status", error); }
    finally { setIsSubmitting(false); }
  };
  return ( <button onClick={handleSave} disabled={isSubmitting}> <img src={`/assets/icons/${post.user_has_saved ? 'saved.svg' : 'save.svg'}`} alt="save" width={20} height={20} /> </button> );
};

export default PostDetails;