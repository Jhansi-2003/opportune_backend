import express from "express";
import mysql from "mysql2";
import cors from "cors";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ✅ MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.stack);
    } else {
        console.log("✅ Connected to MySQL database");
    }
});

// ✅ OAuth2 Setup for Nodemailer
const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const sendEmail = async (email, token) => {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        const mailOptions = {
            from: `Your App <${process.env.EMAIL}>`,
            to: email,
            subject: "Password Reset Request",
            html: `
                <p>Click the link below to reset your password:</p>
                <a href="http://localhost:5173/reset-password?token=${token}">Reset Password</a>
                <p>This link expires in 15 minutes.</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Reset email sent");
    } catch (error) {
        console.error("❌ Email sending failed:", error);
    }
};

// ✅ Fetch User Profile
app.get("/api/profile/:userId", (req, res) => {
    const userId = req.params.userId;
    db.query("SELECT * FROM registration WHERE id = ?", [userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Error fetching profile" });
        if (result.length === 0) return res.status(404).json({ message: "User not found" });

        res.json(result[0]);
    });
});

// ✅ Apply to Job/Internship/Workshop
app.post("/api/apply", (req, res) => {
    const { userId, jobId, title, company, category, appliedDate } = req.body;

    if (!userId || !jobId || !title || !company || !category || !appliedDate) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const sql = `
        INSERT INTO applications (user_id, job_id, title, company, category, applied_date)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [userId, jobId, title, company, category, appliedDate], (err) => {
        if (err) return res.status(500).json({ message: "Failed to save application" });

        res.status(201).json({ message: "Application submitted successfully" });
    });
});

// ✅ Get Applied Jobs
app.get("/api/applied/:userId", (req, res) => {
    const userId = req.params.userId;

    db.query("SELECT * FROM applications WHERE user_id = ? ORDER BY applied_date DESC", [userId], (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to fetch applications" });

        res.json(results);
    });
});

// ✅ Forgot Password
app.post("/api/forgot-password", (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // Check if user exists and update reset_token
    db.query("SELECT * FROM registration WHERE email = ?", [email], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length === 0) return res.status(404).json({ message: "Email not registered" });

        db.query("UPDATE registration SET reset_token = ? WHERE email = ?", [token, email], (err) => {
            if (err) return res.status(500).json({ message: "Failed to store reset token" });

            sendEmail(email, token);
            res.json({ message: "Reset email sent" });
        });
    });
});

// ✅ Reset Password
app.post("/api/reset-password", (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;

        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ message: "Password hashing failed" });

            db.query(
                "UPDATE registration SET password = ?, reset_token = NULL WHERE email = ?",
                [hashedPassword, email],
                (err) => {
                    if (err) return res.status(500).json({ message: "Failed to update password" });

                    res.json({ message: "Password reset successful" });
                }
            );
        });
    } catch (error) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }
});

// ✅ Registration Route
app.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ message: "Password hashing failed" });

        db.query(
            "INSERT INTO registration (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword],
            (err) => {
                if (err) return res.status(500).json({ message: "User already exists or DB error" });

                res.status(201).json({ message: "Registration successful" });
            }
        );
    });
});

// ✅ Login Route
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    db.query("SELECT * FROM registration WHERE email = ?", [email], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });

        if (result.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = result[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ message: "Error comparing passwords" });

            if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

            res.status(200).json({
                message: "Login successful",
                user: { id: user.id, username: user.username, email: user.email },
            });
        });
    });
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
