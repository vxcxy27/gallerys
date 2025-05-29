const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudinary Config
cloudinary.config({
  cloud_name: 'dtgyqdz3n',
  api_key: '883451444335193',
  api_secret: 'HCXRIHOWyNbWVoxTvP-2Gy7OZr0'
});

// Use Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => file.originalname.split('.')[0],
  },
});

const upload = multer({ storage });

app.use(express.static('public'));
app.use(express.json());
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

const users = [
  { username: 'user', password: 'admin' }
];

const uploadedImages = []; // Will store Cloudinary URLs

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
  const imageUrl = req.file.path; // Cloudinary hosted image URL
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
