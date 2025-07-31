import express from 'express';
import bcrypt from 'bcrypt';
import db from '../database.js'; // Import the database connection pool
import jwt from 'jsonwebtoken'; // Add this import to the top of the file

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, username, email, password } = req.body;

  // Basic validation
  if (!name || !username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // 1. Check if user already exists
    const [userExists] = await db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (userExists.length > 0) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insert the new user into the database
    const sql = "INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)";
    const values = [name, username, email, hashedPassword];
    
    await db.query(sql, values);

    res.status(201).json({ message: "User registered successfully!" });

  } catch (error) {
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
    // 1. Find user by their email
    const sqlFindUser = "SELECT * FROM users WHERE User_email = ?";
    const [users] = await db.query(sqlFindUser, [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    // 2. Compare the submitted password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. Create a JSON Web Token (JWT) for the session
    const payload = {
      user: {
        id: user.User_account_id,
        username: user.User_username
      }
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

export default router;