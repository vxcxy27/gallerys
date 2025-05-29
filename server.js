const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

const app = express();
const PORT = 3100;

// Simple user store (for demo)
const users = [{ username: 'user1', password: 'pass1' }];

// Session setup
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.user = username;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

// Auth middleware
function authMiddleware(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
}

// Upload route
app.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  res.json({ success: true, filename: req.file.filename });
});

// Get list of images
app.get('/images', authMiddleware, (req, res) => {
  fs.readdir('uploads/', (err, files) => {
    if (err) return res.status(500).json({ message: 'Error reading files' });
    res.json({ images: files });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
