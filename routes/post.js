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

// Middleware to check if user is an admin
function isAdmin(req, res, next) {
    if (req.user && req.user.UserType === 'admin') {
        next();  // If user is admin, allow the request to proceed
    } else {
        return res.status(403).json({ error: 'Forbidden: Only admins can perform this action' });
    }
}

// Fetch all events
router.get('/get-events', (req, res) => {
    const query = 'SELECT EventID, EventName, EventDate, Description, MediaURL FROM EVENTS';
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching events' });
        }
        res.json(results);  // Return the list of events as a response
    });
});


router.post('/create-event', upload.single('media'), (req, res) => {
    const { eventName, eventDate, description } = req.body;
    const mediaFile = req.file ? path.join('uploads', req.file.filename) : null;

    const query = 'INSERT INTO EVENTS (EventName, EventDate, Description, MediaURL) VALUES (?, ?, ?, ?)';
    connection.query(query, [eventName, eventDate, description, mediaFile], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            message: 'Event created successfully',
            eventID: results.insertId,
            eventName,
            eventDate,
            description,
            mediaFile,
        });
    });
});

// Update an existing event (admin only)
router.put('/update-event/:eventID', upload.single('media'), (req, res) => {
    const { eventID } = req.params;
    const { eventName, eventDate, description } = req.body;
    const mediaFile = req.file ? path.join('uploads', req.file.filename) : null;

    const query = 'UPDATE EVENTS SET EventName = ?, EventDate = ?, Description = ?, MediaURL = ? WHERE EventID = ?';
    connection.query(query, [eventName, eventDate, description, mediaFile, eventID], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.status(200).json({
            message: 'Event updated successfully',
            eventID,
            eventName,
            eventDate,
            description,
            mediaFile,
        });
    });
});

// Delete an event by EventID (admin only)
router.delete('/delete-event/:eventID', (req, res) => {
    const { eventID } = req.params;

    const query = 'DELETE FROM EVENTS WHERE EventID = ?';
    connection.query(query, [eventID], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.status(200).json({ message: 'Event deleted successfully' });
    });
});

module.exports = router;