const express = require('express');
const multer = require('multer');
const session = require('express-session');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dtgyqdz3n',
  api_key: '883451444335193',
  api_secret: 'HCXRIHOWyNbWVoxTvP-2Gy7OZr0'
});

// Multer storage using Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => path.parse(file.originalname).name,
  },
});

const upload = multer({ storage });

// Middleware
app.use(express.static('public')); // serve static files if you have any
app.use(express.json());
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

// In-memory users and image storage (for demo)
const users = [
  { username: 'user', password: 'admin' }
];
const uploadedImages = []; // store uploaded image URLs

// Routes
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.user = user;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.session.user) return res.status(401).send('Unauthorized');

  const imageUrl = req.file.path; // Cloudinary URL
  uploadedImages.push(imageUrl);

  res.json({ success: true, imageUrl });
});

app.get('/images', (req, res) => {
  if (!req.session.user) return res.status(401).send('Unauthorized');

  res.json({ images: uploadedImages });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
