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

// GET /api/posts - Fetch all posts for the feed
router.get('/', async (req, res) => {
  try {
    // The SQL query joins posts with users to get the username
    // and orders by the latest post first.
    const sql = `
      SELECT 
        p.Post_id, 
        p.Post_caption, 
        p.Post_imageurl, 
        p.created_at,
        u.User_username 
      FROM posts AS p
      JOIN users AS u ON p.User_account_id = u.User_account_id
      ORDER BY p.created_at DESC
    `;

    const [posts] = await db.query(sql);
    res.status(200).json(posts);

  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error while fetching posts" });
  }
});
export default router;