import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../database.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [userExists] = await db.query(
      "SELECT * FROM users WHERE User_username = ? OR User_email = ?",
      [username, email]
    );

    if (userExists.length > 0) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // query to insert a new user into the database
    const sql = "INSERT INTO users (User_name, User_username, User_email, password) VALUES (?, ?, ?, ?)";
    const values = [name, username, email, hashedPassword];
    
    await db.query(sql, values);

    res.status(201).json({ message: "User registered successfully!" });

  } catch (error) {
    // logs data base errors to the terminal
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const sqlFindUser = "SELECT * FROM users WHERE User_email = ?";
    const [users] = await db.query(sqlFindUser, [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = {
      user: {
        id: user.User_account_id,
        username: user.User_username
      }
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token });

  } catch (error) {
    // logs data base errors to the terminal
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

export default router;