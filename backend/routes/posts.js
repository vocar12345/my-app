import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/authMiddleware.js';
import db from '../database.js';

const router = express.Router();

// --- Multer Storage Configuration ---
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage }).single('image');


// --- GET all posts for the feed ---
router.get('/', async (req, res) => {
  const currentUserId = req.query.userId;
  try {
    // UPDATED: Now includes p.User_account_id
    const sql = `
      SELECT 
        p.Post_id, p.Post_caption, p.Post_imageurl, p.created_at, p.User_account_id,
        u.User_username, u.User_image,
        (SELECT COUNT(*) FROM likes WHERE Post_id = p.Post_id) AS like_count,
        (SELECT COUNT(*) FROM saves WHERE Post_id = p.Post_id) AS save_count,
        (SELECT COUNT(*) FROM likes WHERE Post_id = p.Post_id AND User_account_id = ?) > 0 AS user_has_liked,
        (SELECT COUNT(*) FROM saves WHERE Post_id = p.Post_id AND User_account_id = ?) > 0 AS user_has_saved
      FROM posts AS p
      JOIN users AS u ON p.User_account_id = u.User_account_id
      ORDER BY p.created_at DESC
    `;
    const [posts] = await db.query(sql, [currentUserId, currentUserId]);
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error while fetching posts" });
  }
});


// --- GET a single post by its ID ---
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.query.userId;
  try {
    // UPDATED: Now includes p.User_account_id
    const sql = `
      SELECT 
        p.Post_id, p.Post_caption, p.Post_imageurl, p.created_at, p.User_account_id,
        u.User_username, u.User_image,
        (SELECT COUNT(*) FROM likes WHERE Post_id = p.Post_id) AS like_count,
        (SELECT COUNT(*) FROM saves WHERE Post_id = p.Post_id) AS save_count,
        (SELECT COUNT(*) FROM likes WHERE Post_id = p.Post_id AND User_account_id = ?) > 0 AS user_has_liked,
        (SELECT COUNT(*) FROM saves WHERE Post_id = p.Post_id AND User_account_id = ?) > 0 AS user_has_saved
      FROM posts AS p
      JOIN users AS u ON p.User_account_id = u.User_account_id
      WHERE p.Post_id = ?
    `;
    const [posts] = await db.query(sql, [currentUserId, currentUserId, id]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json(posts[0]);
  } catch (error) {
    console.error("Error fetching single post:", error);
    res.status(500).json({ message: "Server error while fetching post" });
  }
});


// --- NEW: DELETE a post by its ID ---
router.delete('/:id', protect, async (req, res) => {
  const postId = req.params.id;
  const currentUserId = req.user.id; // from protect middleware

  try {
    // 1. Verify the user owns the post
    const findPostSql = "SELECT User_account_id FROM posts WHERE Post_id = ?";
    const [posts] = await db.query(findPostSql, [postId]);

    if (posts.length === 0) {
      return res.status(404).json({ message: "Post not found." });
    }

    const postOwnerId = posts[0].User_account_id;
    if (postOwnerId !== currentUserId) {
      return res.status(403).json({ message: "Forbidden: You can only delete your own posts." });
    }

    // 2. If they own it, delete it
    const deleteSql = "DELETE FROM posts WHERE Post_id = ?";
    await db.query(deleteSql, [postId]);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error while deleting post" });
  }
});


// --- Other routes (create, like, save) remain the same ---
router.post('/', protect, (req, res) => {
  upload(req, res, async (err) => {
    if (err) { return res.status(500).json({ message: 'Error uploading file', error: err }); }
    const { caption } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;
    const userId = req.user.id;
    if (!req.file) { return res.status(400).json({ message: 'Image file is required' }); }
    try {
      const sql = "INSERT INTO posts (Post_caption, Post_imageurl, User_account_id) VALUES (?, ?, ?)";
      await db.query(sql, [caption, imageUrl, userId]);
      res.status(201).json({ message: 'Post created successfully' });
    } catch (dbError) {
      console.error("Database error:", dbError);
      res.status(500).json({ message: 'Database error while creating post' });
    }
  });
});

router.post('/:id/like', protect, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    const sql = "INSERT INTO likes (User_account_id, Post_id) VALUES (?, ?)";
    await db.query(sql, [userId, postId]);
    res.status(200).json({ message: 'Post liked successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') { return res.status(409).json({ message: 'You have already liked this post' }); }
    console.error("Error liking post:", error);
    res.status(500).json({ message: 'Server error while liking post' });
  }
});

router.delete('/:id/like', protect, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    const sql = "DELETE FROM likes WHERE User_account_id = ? AND Post_id = ?";
    const [result] = await db.query(sql, [userId, postId]);
    if (result.affectedRows === 0) { return res.status(404).json({ message: "Like not found" }); }
    res.status(200).json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error("Error unliking post:", error);
    res.status(500).json({ message: 'Server error while unliking post' });
  }
});

router.post('/:id/save', protect, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    const sql = "INSERT INTO saves (User_account_id, Post_id) VALUES (?, ?)";
    await db.query(sql, [userId, postId]);
    res.status(200).json({ message: 'Post saved successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') { return res.status(409).json({ message: 'You have already saved this post' }); }
    console.error("Error saving post:", error);
    res.status(500).json({ message: 'Server error while saving post' });
  }
});

router.delete('/:id/save', protect, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    const sql = "DELETE FROM saves WHERE User_account_id = ? AND Post_id = ?";
    const [result] = await db.query(sql, [userId, postId]);
    if (result.affectedRows === 0) { return res.status(404).json({ message: "Saved post not found" }); }
    res.status(200).json({ message: 'Post unsaved successfully' });
  } catch (error) {
    console.error("Error unsaving post:", error);
    res.status(500).json({ message: 'Server error while unsaving post' });
  }
});

export default router;