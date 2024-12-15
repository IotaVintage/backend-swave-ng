require('dotenv').config();
const http = require('http');
const app = require('./index');

const cors = require('cors');
app.use(cors());

const server = http.createServer(app);
const port = process.env.PORT;


server.listen(port, () => {
    console.log('Server is running on Port: ' + port);
});