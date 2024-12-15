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

module.exports = router;