import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/authMiddleware.js';
import db from '../database.js';

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
}).single('image');

// Route to Create a New Post: POST /api/posts
router.post('/', protect, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error uploading file', error: err });
    }

    const { caption } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

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

router.get('/', async (req, res) => {
  // We get the current user's ID from a query parameter
  const currentUserId = req.query.userId;

  try {
    // This is a more complex query that uses subqueries to get the like count
    // and to check if the current user has liked the post.
    const sql = `
      SELECT 
        p.Post_id, 
        p.Post_caption, 
        p.Post_imageurl, 
        p.created_at,
        u.User_username,
        (SELECT COUNT(*) FROM likes WHERE Post_id = p.Post_id) AS like_count,
        (SELECT COUNT(*) FROM likes WHERE Post_id = p.Post_id AND User_account_id = ?) > 0 AS user_has_liked
      FROM posts AS p
      JOIN users AS u ON p.User_account_id = u.User_account_id
      ORDER BY p.created_at DESC
    `;

    const [posts] = await db.query(sql, [currentUserId]);
    res.status(200).json(posts);

  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error while fetching posts" });
  }
});

// POST /api/posts/:id/like - Like a post
router.post('/:id/like', protect, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id; // from our protect middleware

  try {
    const sql = "INSERT INTO likes (User_account_id, Post_id) VALUES (?, ?)";
    await db.query(sql, [userId, postId]);
    res.status(200).json({ message: 'Post liked successfully' });
  } catch (error) {
    // Handle cases where the user has already liked the post
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You have already liked this post' });
    }
    console.error("Error liking post:", error);
    res.status(500).json({ message: 'Server error while liking post' });
  }
});

// DELETE /api/posts/:id/like - Unlike a post
router.delete('/:id/like', protect, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  try {
    const sql = "DELETE FROM likes WHERE User_account_id = ? AND Post_id = ?";
    const [result] = await db.query(sql, [userId, postId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Like not found" });
    }
    res.status(200).json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error("Error unliking post:", error);
    res.status(500).json({ message: 'Server error while unliking post' });
  }
});

export default router;