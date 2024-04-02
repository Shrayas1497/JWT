const express = require('express');
const dotenv = require('dotenv').config();
const axios = require('axios');
const auth = require('./middleware/auth');
const User = require('./models/user');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

require('./models/database/database').connect();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send("<h1> server is working </h1>");
});

app.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email || !password) {
            res.status(422).send("All fields are compulsory");
            return;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(401).send("User already exists with this email");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        const token = jwt.sign(
            { id: user._id, email },
            'sshh',
            { expiresIn: "2h" }
        );

        user.token = token;
        user.password = undefined;

        res.status(201).json(user);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!(email && password)) {
            res.status(400).send('Send all data');
            return;
        }

        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { id: user._id },
                'sshh',
                { expiresIn: "2h" }
            );

            user.token = token;
            user.password = undefined;

            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true
            };

            res.status(201).cookie("token", token, options).json({
                success: true,
                token,
                user
            });
        } else {
            res.status(401).send("Invalid email or password");
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/dashboard', auth, (req, res) => {
    res.send("welcome to my dashboard ");
});

// Route to fetch data from a public API with filtering options
/**
 * @swagger
 * /api/data:
 *   get:
 *     summary: Retrieve data from a public API with filtering options
 *     description: Fetch data from a public API (https://api.publicapis.org/entries) with filtering options based on category and result limit.
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter data by category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit the number of results
 *     responses:
 *       '200':
 *         description: Successful response with data from the public API
 *       '500':
 *         description: Internal Server Error
 */
app.get('/api/data', async (req, res) => {
    try {
        const { category, limit } = req.query;
        const apiUrl = 'https://api.publicapis.org/entries';

        const url = new URL(apiUrl);
        if (category) url.searchParams.append('category', category);
        if (limit) url.searchParams.append('limit', limit);

        const response = await axios.get(url.toString());
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Swagger setup
const options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Your API Documentation',
            version: '1.0.0',
            description: 'API endpoints documentation',
        },
        servers: [
            {
                url: 'http://localhost:4000',
                description: 'Development server',
            },
        ],
    },
    apis: ['./api/data'],
};

const specs = swaggerJsdoc(options);


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

module.exports = app;
