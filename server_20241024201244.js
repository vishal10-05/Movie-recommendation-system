const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'frontend')));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/moviesDB', { useNewUrlParser: true, useUnifiedTopology: true });

// User model
const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    password: String,
}));

// Movie model
const Movie = mongoose.model('Movie', new mongoose.Schema({
    title: String,
    description: String,
    poster: String,
    reviews: [{ username: String, review: String }],
}));

// Review model (optional if storing reviews separately)
const Review = mongoose.model('Review', new mongoose.Schema({
    username: String,
    content: String
}));

// Populate movies (run this once)
app.get('/api/populateMovies', async (req, res) => {
    const sampleMovies = [
        { title: "Inception", description: "A thief who steals corporate secrets through the use of dream-sharing technology.", poster: "./images/inception.jpg", reviews: [] },
        { title: "The Dark Knight", description: "Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.", poster: "./images/dark_knight.jpg", reviews: [] },
        { title: "Interstellar", description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", poster: "./images/interstellar.jpg", reviews: [] },
        { title: "The Matrix", description: "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.", poster: "./images/matrix.jpg", reviews: [] },
        { title: "Fight Club", description: "An insomniac office worker and a devil-may-care soap maker form an underground fight club.", poster: "./images/fight_club.jpg", reviews: [] }
    ];

    await Movie.insertMany(sampleMovies);
    res.send('Sample movies populated!');
});

// Fetch all movies
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await Movie.find({});
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a review to a specific movie
app.post('/api/movies/:id/reviews', async (req, res) => {
    const { id } = req.params;
    const { username, review } = req.body;

    try {
        const movie = await Movie.findById(id);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found.' });
        }
        movie.reviews.push({ username, review });
        await movie.save();
        res.status(201).json({ success: true, message: 'Review added successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// User Registration
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully!' });
});

// User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        res.json({ success: true, message: 'Login successful!' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }
});

// Get all reviews (optional, if you want to display all reviews separately)
app.get('/api/reviews', async (req, res) => {
    const reviews = await Review.find({});
    res.json(reviews);
});

// Serve HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/login.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
