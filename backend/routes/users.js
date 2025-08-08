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
router.get('/saved', protect, async (req, res) => {
    try {
        const userId = req.user.id;
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

    // --- CORRECTED SQL QUERY FOR POSTS ---
    // This query now joins the users table to include the username in each post object.
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


export default router;