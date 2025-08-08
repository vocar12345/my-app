import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

// Interface for Post data
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

// Interface for User Profile data
interface UserProfile {
  User_account_id: number;
  User_username: string;
  User_name: string;
  User_bio: string | null;
  User_image: string | null;
  follower_count: number;
  following_count: number;
  is_following: boolean;
}

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- UI Update Handlers ---
  const handleLikeToggle = (postId: number, newLikedStatus: boolean, newLikeCount: number) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.Post_id === postId
          ? { ...p, user_has_liked: newLikedStatus, like_count: newLikeCount }
          : p
      )
    );
  };

  const handleSaveToggle = (postId: number, newSavedStatus: boolean) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.Post_id === postId ? { ...p, user_has_saved: newSavedStatus } : p
      )
    );
  };

  const handleFollowToggle = (newFollowStatus: boolean) => {
    if (!profile) return;
    setProfile({
      ...profile,
      is_following: newFollowStatus,
      follower_count: newFollowStatus
        ? profile.follower_count + 1
        : profile.follower_count - 1,
    });
  };

  // --- Data Fetching ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (!username || !currentUser) return;
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/users/${username}?userId=${currentUser.id}`);
        setProfile(response.data.profile);
        setPosts(response.data.posts);
      } catch (err) {
        setError('Failed to load profile.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [username, currentUser]);

  if (isLoading) return <div className="p-4 text-center">Loading profile...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!profile) return <div className="p-4 text-center">User not found.</div>;

  return (
    <div className="profile-container w-full max-w-5xl p-4 md:p-8">
      <div className="profile-inner_container flex flex-col sm:flex-row items-center sm:items-start gap-8">
        <img 
          src={profile.User_image ? `http://localhost:5000${profile.User_image}` : '/assets/icons/profile-placeholder.svg'}
          alt="profile"
          className="w-28 h-28 lg:w-36 lg:h-36 rounded-full bg-gray-700 object-cover flex-shrink-0"
        />
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-center sm:text-left">{profile.User_username}</h1>
            {currentUser && currentUser.username === profile.User_username ? (
              <Link to="/edit-profile" className="p-2 bg-gray-600 text-white rounded text-center hover:bg-gray-700">
                Edit Profile
              </Link>
            ) : (
              <FollowButton profile={profile} onFollowToggle={handleFollowToggle} />
            )}
          </div>
          <div className="flex gap-8 items-center">
            <p><span className="font-bold">{posts.length}</span> posts</p>
            <Link to={`/profile/${username}/followers`} className="hover:underline">
              <span className="font-bold">{profile.follower_count}</span> followers
            </Link>
            <Link to={`/profile/${username}/following`} className="hover:underline">
              <span className="font-bold">{profile.following_count}</span> following
            </Link>
          </div>
          <p className="mt-2 text-center sm:text-left">{profile.User_bio || "No bio yet."}</p>
        </div>
      </div>

      <h3 className="font-bold text-xl w-full my-10 border-t border-gray-600 pt-6">Posts</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {posts.map((post) => (
          <div key={post.Post_id} className="relative group bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col gap-2">
            <Link to={`/posts/${post.Post_id}`}>
              <img src={`http://localhost:5000${post.Post_imageurl}`} alt="post" className="w-full h-48 object-cover rounded-lg" />
            </Link>
            <p className="text-white mt-2 truncate">{post.Post_caption}</p>
            <div className="flex justify-between items-center mt-auto">
              <div className="flex items-center gap-2">
                <LikeButton post={post} onLikeToggle={handleLikeToggle} />
                <span>{post.like_count} likes</span>
              </div>
              <SaveButton post={post} onSaveToggle={handleSaveToggle} />
            </div>
          </div>
        ))}
         {posts.length === 0 && <p>This user hasn't posted anything yet.</p>}
      </div>
    </div>
  );
};

// --- Child Components ---
interface FollowButtonProps { profile: UserProfile; onFollowToggle: (newFollowStatus: boolean) => void; }
const FollowButton = ({ profile, onFollowToggle }: FollowButtonProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem('token');
  const handleFollow = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (profile.is_following) {
        await axios.delete(`http://localhost:5000/api/users/${profile.User_account_id}/follow`, { headers: { 'Authorization': `Bearer ${token}` } });
        onFollowToggle(false);
      } else {
        await axios.post(`http://localhost:5000/api/users/${profile.User_account_id}/follow`, {}, { headers: { 'Authorization': `Bearer ${token}` } });
        onFollowToggle(true);
      }
    } catch (error) { console.error("Failed to update follow status", error); }
    finally { setIsSubmitting(false); }
  };
  return ( <button onClick={handleFollow} disabled={isSubmitting} className={`p-2 rounded text-white ${profile.is_following ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'}`}> {profile.is_following ? 'Unfollow' : 'Follow'} </button> );
};

interface LikeButtonProps { post: Post; onLikeToggle: (postId: number, newLikedStatus: boolean, newLikeCount: number) => void; }
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
  return ( <button onClick={handleLike} disabled={isSubmitting}> <img src={`/assets/icons/${post.user_has_liked ? 'liked.svg' : 'like.svg'}`} alt="like" width={20} height={20} /> </button> );
};

interface SaveButtonProps { post: Post; onSaveToggle: (postId: number, newSavedStatus: boolean) => void; }
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
  return ( <button onClick={handleSave} disabled={isSubmitting}> <img src={`/assets/icons/${post.user_has_saved ? 'saved.svg' : 'save.svg'}`} alt="save" width={20} height={20} /> </button> );
};

export default Profile;