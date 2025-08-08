import express from 'express';
import db from '../database.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// --- Multer Configuration for profile pictures ---
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function (req, file, cb) {
    // Create a unique filename for the profile picture
    // Note: req.user is available here because 'protect' middleware runs first
    cb(null, 'profile-' + req.user.id + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage }).single('image');


// --- GET /api/users/:username ---
// Fetches a user's profile and all of their posts.
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.query.userId;
  try {
    const userSql = "SELECT User_account_id, User_username, User_name, User_bio, User_image FROM users WHERE User_username = ?";
    const [users] = await db.query(userSql, [username]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userProfile = users[0];
    const postsSql = `
      SELECT 
        p.Post_id, p.Post_caption, p.Post_imageurl, p.created_at,
        (SELECT COUNT(*) FROM likes WHERE Post_id = p.Post_id) AS like_count,
        (SELECT COUNT(*) FROM saves WHERE Post_id = p.Post_id) AS save_count,
        (SELECT COUNT(*) FROM likes WHERE Post_id = p.Post_id AND User_account_id = ?) > 0 AS user_has_liked,
        (SELECT COUNT(*) FROM saves WHERE Post_id = p.Post_id AND User_account_id = ?) > 0 AS user_has_saved
      FROM posts AS p
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
    const userId = req.user.id; // from protect middleware
    let imageUrl = null;

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    try {
      // Build the query dynamically based on what the user provides
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
        // Using User_image to match your database schema
        sql += 'User_image = ?, ';
        values.push(imageUrl);
      }
      
      if (values.length === 1) { // Only userId is in values if nothing was provided
        return res.status(400).json({ message: "No fields to update provided." });
      }

      // Remove trailing comma and space
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


export default router;
