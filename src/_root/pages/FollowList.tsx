import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

// A simple interface for the user data in the list
interface FollowUser {
  User_account_id: number;
  User_username: string;
  User_name: string;
  User_image: string | null;
}

const FollowList = () => {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  
  // Determine if we're showing followers or following based on the URL
  const listType = location.pathname.includes('/followers') ? 'followers' : 'following';

  const [users, setUsers] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      if (!username) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/users/${username}/${listType}`);
        setUsers(response.data);
      } catch (err) {
        setError(`Failed to fetch ${listType}.`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchList();
  }, [username, listType]);

  if (isLoading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="common-container p-4 md:p-8">
      <h2 className="h3-bold md:h2-bold text-left w-full capitalize">
        {listType}
      </h2>
      <div className="mt-8 flex flex-col gap-6">
        {users.length > 0 ? (
          users.map((user) => (
            <Link to={`/profile/${user.User_username}`} key={user.User_account_id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-800">
              <img 
                src={user.User_image ? `http://localhost:5000${user.User_image}` : '/assets/icons/profile-placeholder.svg'}
                alt="profile"
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">{user.User_username}</p>
                <p className="text-sm text-gray-400">@{user.User_name}</p>
              </div>
            </Link>
          ))
        ) : (
          <p>No users to display.</p>
        )}
      </div>
    </div>
  );
};

export default FollowList;