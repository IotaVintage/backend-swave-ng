const express = require('express');
const bodyParser = require('body-parser');

const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');

const connection = require('../connection');
const router = express.Router();

router.use(bodyParser.json());

// Search Posts
router.get('/get-posts', (req, res) => {

    // Fetch all posts along with user details (Full name and AvatarUrl)
    const query = `
        SELECT 
            POST.UserID, 
            POST.PostContent AS content, 
            POST.PostDate AS timestamp, 
            POST.CommentCount AS commentCount, 
            POST.LikeCount AS likeCount, 
            CONCAT(USERS.Fname, ' ', USERS.Mname, ' ', USERS.Lname) AS username, 
            USERS.ProfilePic AS avatarUrl
        FROM POST
        JOIN USERS ON POST.UserID = USERS.UserID
    `;

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching posts from the database' });
        }

        // Return posts
        res.json(results);
    });
});

router.post('/create-post', upload.single('media'), (req, res) => {
    const userID = req.body.userID; // Get userID from the request body
    const content = req.body.caption; // Get content from the request body
    const mediaFile = req.file ? path.join('uploads', req.file.filename) : null; // Handle media file

    const query = `INSERT INTO Posts (User ID, PostContent, PostDate, MediaFiles, CommentCount, LikeCount) VALUES (?, ?, NOW(), ?, 0, 0)`;
    connection.query(query, [userID, content, JSON.stringify(mediaFile)], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
            message: 'Post created successfully',
            postID: results.insertId,
            content,
            mediaFile,
            timestamp: new Date(), // Include timestamp for consistency
            commentCount: 0, // Initialize comment count
            likeCount: 0 // Initialize like count
        });
    });
});
module.exports = router;