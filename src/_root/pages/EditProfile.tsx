import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

const EditProfile = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    User_name: '',
    User_bio: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current profile data to pre-fill the form
  useEffect(() => {
    const fetchCurrentProfile = async () => {
      if (!currentUser) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/users/${currentUser.username}`);
        const profile = response.data.profile;
        setFormData({
          User_name: profile.User_name || '',
          User_bio: profile.User_bio || '',
        });
      } catch (err) {
        console.error("Failed to fetch profile data", err);
      }
    };
    fetchCurrentProfile();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const data = new FormData();
    data.append('User_name', formData.User_name);
    data.append('User_bio', formData.User_bio);
    if (file) {
      data.append('image', file);
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/users/profile', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      // On success, navigate back to the profile page
      navigate(`/profile/${currentUser?.username}`);
    } catch (err) {
      setError('Failed to update profile.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="common-container p-4 md:p-8">
      <h2 className="h3-bold md:h2-bold text-left w-full">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full mt-4">
        <div>
          <label htmlFor="User_name" className="block mb-2">Name</label>
          <input
            type="text"
            name="User_name"
            id="User_name"
            value={formData.User_name}
            onChange={handleChange}
            className="shad-input"
          />
        </div>
        <div>
          <label htmlFor="User_bio" className="block mb-2">Bio</label>
          <textarea
            name="User_bio"
            id="User_bio"
            value={formData.User_bio}
            onChange={handleChange}
            className="shad-textarea"
            rows={4}
          />
        </div>
        <div>
          <label htmlFor="file-upload" className="block mb-2">Profile Picture</label>
          <input
            id="file-upload"
            type="file"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200"
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" className="shad-button_primary mt-4" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default EditProfile;