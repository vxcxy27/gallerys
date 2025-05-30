import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer with limits and file filter
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Supabase Client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Upload route with improved filename handling
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Improved filename sanitization
    const originalName = req.file.originalname;
    const fileExt = path.extname(originalName);
    const baseName = path.basename(originalName, fileExt)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .substring(0, 50); // Limit base name length

    const fileName = `${Date.now()}_${baseName}${fileExt}`;

    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: error.message });
    }

    const { publicURL } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    res.json({
      message: 'Upload successful',
      url: publicURL,
      name: fileName,
      originalName: originalName
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List images with better data handling
app.get('/images', async (req, res) => {
  try {
    const { data, error } = await supabase.storage.from('images').list();

    if (error) {
      console.error('List error:', error);
      return res.status(500).json({ error: error.message });
    }

    const images = data.map(file => {
      const { publicURL } = supabase.storage.from('images').getPublicUrl(file.name);
      
      // Extract original name from stored filename
      const originalName = file.name.split('_').slice(1).join('_');
      
      return {
        name: file.name,
        url: publicURL,
        originalName: originalName
      };
    });

    res.json(images);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
