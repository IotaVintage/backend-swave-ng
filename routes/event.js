const express = require('express');
const bodyParser = require('body-parser');

const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');

const connection = require('../connection');
const router = express.Router();

router.use(bodyParser.json());

// Fetch all events
router.get('/get-events', (req, res) => {
    const query = 'SELECT EventID, EventName, EventDate, Description FROM EVENTS';
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching events' });
        }
        res.json(results);  // Return the list of events as a response
    });
});

// Fetch events for today
router.get('/get-today-events', (req, res) => {
    const query = `
        SELECT EventID, EventName, EventDate, Description 
        FROM EVENTS
        WHERE DATE(EventDate) = CURDATE()
    `;
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching today\'s events' });
        }
        res.json(results); // Return the list of today’s events as a response
    });
});

// Fetch events for this month
router.get('/get-month-events', (req, res) => {
    const query = `
        SELECT EventID, EventName, EventDate, Description 
        FROM EVENTS
        WHERE DATE(EventDate) != CURDATE()
    `;
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching this month events' });
        }
        res.json(results); // Return the list of events not for today as a response
    });
});

router.post('/create-event', (req, res) => {
    const { eventName, eventDate, description } = req.body;

    const query = 'INSERT INTO EVENTS (EventName, EventDate, Description) VALUES (?, ?, ?)';
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
        });
    });
});

// Configure multer for handling form-data
const upload = multer(); // In-memory storage or disk storage can be configured

// Update an existing event (admin only)
router.put('/update-event/:eventID', upload.none(),(req, res) => {
    const { eventID } = req.params;
    const { title, date, description } = req.body;

    const query = 'UPDATE EVENTS SET EventName = ?, EventDate = ?, Description = ? WHERE EventID = ?';
    connection.query(query, [title, date, description, eventID], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.status(200).json({
            message: 'Event updated successfully',
            eventID,
            title,
            date,
            description,
        });
    });
});

// Delete an event by EventID (admin only)
router.delete('/delete-event/:eventID', upload.none(),(req, res) => {
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