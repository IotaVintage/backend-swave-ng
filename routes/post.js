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

// Configure multer for handling form-data
const upload = multer(); // In-memory storage or disk storage can be configured

router.post('/create-post', upload.none(),(req, res) => {
    const unpID = req.body.unpID; // Get unpID from the request body
    const content = req.body.caption; // Get content from the request body

    const findUserIDQuery = 'SELECT USERS.UserID FROM USERS WHERE UnpID = ?';

    connection.query(findUserIDQuery, [unpID], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const userID = results[0]?.UserID;

        if (!userID) {
            return res.status(404).json({ error: 'User not found' });
        }

        const query = `INSERT INTO POST (UserID, PostContent, PostDate, CommentCount, LikeCount) VALUES (?, ?, NOW(), 0, 0)`;

        connection.query(query, [userID, content], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
                message: 'Post created successfully',
                postID: results.insertId,
                content,
                timestamp: new Date(), // Include timestamp for consistency
                commentCount: 0, // Initialize comment count
                likeCount: 0 // Initialize like count
            });
        });
    });
});

module.exports = router;