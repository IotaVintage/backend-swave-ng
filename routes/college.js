const express = require('express');
const bodyParser = require('body-parser');

const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');

const connection = require('../connection');
const router = express.Router();

router.use(bodyParser.json());

// searching available colleges
router.get('/search-college', (req, res) => {

    // query to search in the database
    const query = `
        SELECT *
        FROM COLLEGE
    `;

    connection.query(query, (err, results) => {
        // catches the error
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // prints out the results
        res.json(results);
    });
});

router.get('/get-college-page/:collegeID', (req, res) => {
    const { collegeID } = req.params;

    if (!collegeID) {
        return res.status(400).json({ error: 'unpID is required' });
    }

    const query = `
        SELECT *
        FROM PAGES
        WHERE CollegeID = ?
    `;

    connection.query(query, [collegeID], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results[0]);
    });
});

module.exports = router;