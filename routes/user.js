const express = require('express');
const bodyParser = require('body-parser');

const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');

const connection = require('../connection');
const router = express.Router();

router.use(bodyParser.json());

// Authenticate User
router.post('/login', (req, res) => {
    const { unpID, password } = req.body;

    if (!unpID || !password) {
        return res.status(400).json({ error: 'Both unpID and password are required' });
    }

    const query = `
        SELECT UnpID, Fname, Mname, Lname, Email, CollegeID, Program, UserType, Password
        FROM USERS
        WHERE UnpID = ?
    `;

    connection.query(query, [unpID], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid unpID or password' });
        }

        const user = results[0];

        // Compare the provided password with the hashed password
        bcrypt.compare(password, user.Password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).json({ error: 'Invalid unpID or password' });
            }

            // Remove password from response
            delete user.Password;

            res.json({
                message: 'Login successful',
                user: {
                    unpID: user.UnpID,
                    fname: user.Fname,
                    mname: user.Mname,
                    lname: user.Lname,
                    email: user.Email,
                    college: user.CollegeID,
                    program: user.Program,
                    userType: user.UserType
                }
            });
        });
    });
});

// Search unpID and check if the password exists
router.get('/search-user/:unpID', (req, res) => {
    const { unpID } = req.params;

    // Query to retrieve user information and check if the password is set
    const query = `
        SELECT UnpID, Fname, Mname, Lname, Email, Password
        FROM USERS
        WHERE UnpID = ?
    `;

    connection.query(query, [unpID], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'unpID not found' });
        }

        const user = results[0];
        const hasPassword = user.Password !== null && user.Password.trim() !== '';

        res.json({
            unpID: user.UnpID,
            fname: user.Fname,
            mname: user.Mname,
            lname: user.Lname,
            email: user.Email,
            hasPassword // true if password exists, false otherwise
        });
    });
});

// Account Setup
const saltRounds = 10;

router.post('/account-setup', (req, res) => {
    const { unpID, password, barangay, cityTown, province, contactNumber, birthday, age, sex, college, program, section } = req.body;

    if (!unpID || !password) {
        return res.status(400).json({ error: 'Required fields: unpID, password' });
    }

    // Check if unpID exists
    const checkUnpIDQuery = `SELECT UserID, Fname, Mname, Lname, Email FROM USERS WHERE UnpID = ?`;

    connection.query(checkUnpIDQuery, [unpID], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'unpID does not exist' });
        }

        const userInfo = results[0];

        // Hash the password
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: 'Error hashing password' });
            }

            // Update user information
            const updateQuery = `
                UPDATE USERS
                SET Password = ?, Barangay = ?, City = ?, Province = ?, 
                    ContactNumber = ?, Birthdate = ?, Age = ?, Sex = ?, College = ?, 
                    Program = ?, Section = ?, DateJoined = NOW()
                WHERE UnpID = ?
            `;

            const values = [
                hashedPassword, barangay || '', cityTown || '', province || '',
                contactNumber || '', birthday || '2004-01-01', age || 18, sex || '',
                college || '', program || '', section || '', unpID
            ];

            console.log(hashedPassword, barangay || '', cityTown || '', province || '',
                contactNumber || '', birthday || '2004-01-01', age || 18, sex || '',
                college || '', program || '', section || '', unpID);

            connection.query(updateQuery, values, (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                res.json({
                    message: 'Registration completed successfully',
                    userInfo: {
                        fname: userInfo.Fname,
                        mname: userInfo.Mname,
                        lname: userInfo.Lname,
                        email: userInfo.Email
                    }
                });
            });
        });
    });
});

// Fetch Profile Info
router.get('/profile/:unpID', (req, res) => {
    const { unpID } = req.params;

    if (!unpID) {
        return res.status(400).json({ error: 'unpID is required' });
    }

    const query = `
        SELECT UnpID, Fname, Mname, Lname, CollegeID, Program, ProfilePic, CoverPhoto, Bio
        FROM USERS
        WHERE UnpID = ?
    `;

    connection.query(query, [unpID], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Profile not found for the given unpID' });
        }

        res.json(results[0]);
    });
});

// Search Accounts
router.get('/search-accounts', (req, res) => {
    const query = req.query.query;
  
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }
  
    // Fetch all user data from the database, excluding users with no password
    const fetchAllUsersQuery = `
        SELECT UnpID, Fname, Lname, CollegeID, Program, Password
        FROM USERS
        WHERE Password IS NOT NULL AND Password != ''
    `;
    
    connection.query(fetchAllUsersQuery, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching users from the database' });
        }
  
        // Apply Naive String Matching algorithm to filter results
        const searchResults = naiveSearch(results, query);
  
        // Return filtered search results
        res.json(searchResults);
    });
});
  
// Naive String Matching Algorithm
function naiveSearch(users, query) {
    return users.filter(user => {
        // Search both first name and last name for the query
        const fullName = `${user.Fname} ${user.Lname}`.toLowerCase();
        return fullName.includes(query.toLowerCase()) || user.UnpID.includes(query);
    });
}

// Update the bio on profile
router.post('/update-bio', (req, res) => {
    const { unpID, bio } = req.body;

    if (!unpID || bio === undefined) {
        return res.status(400).json({ error: 'unpID and bio are required' });
    }

    const query = `
        UPDATE USERS
        SET Bio = ?
        WHERE UnpID = ?
    `;

    connection.query(query, [bio, unpID], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({ message: 'Bio updated successfully', bio });
    });
});

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Use current timestamp for unique file name
    }
});

const upload = multer({ storage: storage });

// Upload Profile Picture
router.post('/upload-profile-pic', upload.single('profilePic'), (req, res) => {
    const { unpID } = req.body;
    const filePath = req.file.path;

    const query = `
        UPDATE USERS
        SET ProfilePic = ?
        WHERE UnpID = ?
    `;

    connection.query(query, [filePath, unpID], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({ message: 'Profile picture uploaded successfully', filePath });
    });
});

module.exports = router;