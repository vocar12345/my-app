
import express from 'express';
import db from '../database.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function (req, file, cb) {
    cb(null, 'profile-' + req.user.id + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage }).single('image');


// --- GET /api/users/saved ---
// Fetches all posts saved by the logged-in user.
router.get('/saved', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        // THIS QUERY IS THE FIX: It uses `AS` to rename the columns
        // from `Post_id` to `post_id`, which is what the frontend expects.
        const sql = `
            SELECT 
                p.Post_id AS post_id,
                p.Post_caption AS post_caption,
                p.Post_imageurl AS post_imageurl,
                u.User_username AS user_username 
            FROM posts AS p
            JOIN saves AS s ON p.Post_id = s.Post_id
            JOIN users AS u ON p.User_account_id = u.User_account_id
            WHERE s.User_account_id = ?
            ORDER BY s.created_at DESC
        `;
        const [posts] = await db.query(sql, [userId]);
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching saved posts:", error);
        res.status(500).json({ message: "Server error while fetching saved posts" });
    }
});


// --- GET /api/users/:username ---
// Fetches a user's profile and all of their posts.
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.query.userId; 

  try {
    // UPDATED SQL QUERY: This now includes follower/following counts and an is_following check
    const userSql = `
      SELECT 
        u.User_account_id, u.User_username, u.User_name, u.User_bio, u.User_image,
        (SELECT COUNT(*) FROM follows WHERE Following_id = u.User_account_id) AS follower_count,
        (SELECT COUNT(*) FROM follows WHERE Followed_by_id = u.User_account_id) AS following_count,
        (SELECT COUNT(*) FROM follows WHERE Following_id = u.User_account_id AND Followed_by_id = ?) > 0 AS is_following
      FROM users AS u 
      WHERE u.User_username = ?
    `;
    const [users] = await db.query(userSql, [currentUserId, username]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userProfile = users[0];

    const postsSql = `
      SELECT 
        p.Post_id, p.Post_caption, p.Post_imageurl, p.created_at,
        u.User_username,
        (SELECT COUNT(*) FROM likes WHERE Post_id = p.Post_id) AS like_count,
        (SELECT COUNT(*) FROM saves WHERE Post_id = p.Post_id) AS save_count,
        (SELECT COUNT(*) FROM likes WHERE Post_id = p.Post_id AND User_account_id = ?) > 0 AS user_has_liked,
        (SELECT COUNT(*) FROM saves WHERE Post_id = p.Post_id AND User_account_id = ?) > 0 AS user_has_saved
      FROM posts AS p
      JOIN users AS u ON p.User_account_id = u.User_account_id
      WHERE p.User_account_id = ?
      ORDER BY p.created_at DESC
    `;
    const [posts] = await db.query(postsSql, [currentUserId, currentUserId, userProfile.User_account_id]);
    res.status(200).json({ profile: userProfile, posts: posts });

  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error while fetching user profile" });
  }
});


// --- PUT /api/users/profile ---
// Updates the profile of the currently logged-in user.
router.put('/profile', protect, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error uploading file', error: err });
    }
    const { User_name, User_bio } = req.body;
    const userId = req.user.id;
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    try {
      let sql = 'UPDATE users SET ';
      const values = [];
      if (User_name) {
        sql += 'User_name = ?, ';
        values.push(User_name);
      }
      if (User_bio) {
        sql += 'User_bio = ?, ';
        values.push(User_bio);
      }
      if (imageUrl) {
        sql += 'User_image = ?, ';
        values.push(imageUrl);
      }
      if (values.length === 0) {
        return res.status(400).json({ message: "No fields to update provided." });
      }
      sql = sql.slice(0, -2);
      sql += ' WHERE User_account_id = ?';
      values.push(userId);
      await db.query(sql, values);
      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (dbError) {
      console.error("Database error while updating profile:", dbError);
      res.status(500).json({ message: 'Database error while updating profile' });
    }
  });
});


// Add these two routes to the bottom of backend/routes/users.js

// POST /api/users/:id/follow - Follow a user
router.post('/:id/follow', protect, async (req, res) => {
  const userToFollowId = req.params.id;
  const currentUserId = req.user.id; // from protect middleware

  // Prevent user from following themselves
  if (userToFollowId == currentUserId) {
    return res.status(400).json({ message: "You cannot follow yourself." });
  }

  try {
    const sql = "INSERT INTO follows (Followed_by_id, Following_id) VALUES (?, ?)";
    await db.query(sql, [currentUserId, userToFollowId]);
    res.status(200).json({ message: 'User followed successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You are already following this user' });
    }
    console.error("Error following user:", error);
    res.status(500).json({ message: 'Server error while following user' });
  }
});


// DELETE /api/users/:id/follow - Unfollow a user
router.delete('/:id/follow', protect, async (req, res) => {
  const userToUnfollowId = req.params.id;
  const currentUserId = req.user.id;

  try {
    const sql = "DELETE FROM follows WHERE Followed_by_id = ? AND Following_id = ?";
    const [result] = await db.query(sql, [currentUserId, userToUnfollowId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "You are not following this user." });
    }
    res.status(200).json({ message: 'User unfollowed successfully' });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ message: 'Server error while unfollowing user' });
  }
});


router.get('/:username/followers', async (req, res) => {
  try {
    const { username } = req.params;
    const sql = `
      SELECT u.User_account_id, u.User_username, u.User_name, u.User_image
      FROM users u
      JOIN follows f ON u.User_account_id = f.Followed_by_id
      WHERE f.Following_id = (SELECT User_account_id FROM users WHERE User_username = ?)
    `;
    const [followers] = await db.query(sql, [username]);
    res.status(200).json(followers);
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// GET /api/users/:username/following - Get users a user is following
router.get('/:username/following', async (req, res) => {
  try {
    const { username } = req.params;
    const sql = `
      SELECT u.User_account_id, u.User_username, u.User_name, u.User_image
      FROM users u
      JOIN follows f ON u.User_account_id = f.Following_id
      WHERE f.Followed_by_id = (SELECT User_account_id FROM users WHERE User_username = ?)
    `;
    const [following] = await db.query(sql, [username]);
    res.status(200).json(following);
  } catch (error) {
    console.error("Error fetching following list:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;