import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

// Interfaces (Post remains the same)
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
// UPDATED UserProfile interface
interface UserProfile {
  User_account_id: number; // We need the ID for the follow button
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

  // Handler to update the UI instantly for likes
  const handleLikeToggle = (postId: number, newLikedStatus: boolean, newLikeCount: number) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.Post_id === postId
          ? { ...p, user_has_liked: newLikedStatus, like_count: newLikeCount }
          : p
      )
    );
  };

  // Handler to update the UI instantly for follows
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
    <div className="profile-container p-4 md:p-8 w-full">
      <div className="profile-inner_container flex flex-col sm:flex-row items-center sm:items-start gap-8">
        <img 
          src={profile.User_image ? `http://localhost:5000${profile.User_image}` : '/assets/icons/profile-placeholder.svg'}
          alt="profile"
          className="w-28 h-28 lg:w-36 lg:h-36 rounded-full bg-gray-700 object-cover flex-shrink-0"
        />
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-center sm:text-left">{profile.User_username}</h1>
            {/* --- ACTION BUTTONS (EDIT OR FOLLOW) --- */}
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
            <p><span className="font-bold">{profile.follower_count}</span> followers</p>
            <p><span className="font-bold">{profile.following_count}</span> following</p>
          </div>
          <p className="mt-2 text-center sm:text-left">{profile.User_bio || "No bio yet."}</p>
        </div>
      </div>

      <h3 className="font-bold text-xl w-full my-10 border-t border-gray-600 pt-6">Posts</h3>
      {/* Post grid remains the same */}
    </div>
  );
};


// --- FollowButton Component ---
interface FollowButtonProps {
  profile: UserProfile;
  onFollowToggle: (newFollowStatus: boolean) => void;
}
const FollowButton = ({ profile, onFollowToggle }: FollowButtonProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem('token');

  const handleFollow = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (profile.is_following) {
        // --- Unfollow the user ---
        await axios.delete(`http://localhost:5000/api/users/${profile.User_account_id}/follow`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        onFollowToggle(false);
      } else {
        // --- Follow the user ---
        await axios.post(`http://localhost:5000/api/users/${profile.User_account_id}/follow`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        onFollowToggle(true);
      }
    } catch (error) {
      console.error("Failed to update follow status", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button 
      onClick={handleFollow} 
      disabled={isSubmitting}
      className={`p-2 rounded text-white ${profile.is_following ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
      {profile.is_following ? 'Unfollow' : 'Follow'}
    </button>
  );
};

// LikeButton and SaveButton components would also be here...

export default Profile;