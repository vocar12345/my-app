import express from 'express';
import db from '../database.js';

const router = express.Router();

// GET /api/users/:username - Fetch a user's profile and their posts
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.query.userId; // We'll still need this for the like status

  try {
    // First, get the user's profile information
    const userSql = "SELECT User_account_id, User_username, User_name, User_bio, User_image_url FROM users WHERE User_username = ?";
    const [users] = await db.query(userSql, [username]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userProfile = users[0];

    // Next, get all posts made by that user
    const postsSql = `
      SELECT 
        p.Post_id, 
        p.Post_caption, 
        p.Post_imageurl, 
        p.created_at,
        (SELECT COUNT(*) FROM likes WHERE Post_id = p.Post_id) AS like_count,
        (SELECT COUNT(*) FROM likes WHERE Post_id = p.Post_id AND User_account_id = ?) > 0 AS user_has_liked
      FROM posts AS p
      WHERE p.User_account_id = ?
      ORDER BY p.created_at DESC
    `;
    const [posts] = await db.query(postsSql, [currentUserId, userProfile.User_account_id]);

    // Combine the profile and posts into a single response
    res.status(200).json({ profile: userProfile, posts: posts });

  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error while fetching user profile" });
  }
});

export default router;