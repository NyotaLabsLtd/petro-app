const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary using your .env keys
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Endpoint to upload an image
router.post('/upload-image', async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(image, {
            folder: 'petro-profiles',       // Creates a folder in your Cloudinary
            resource_type: 'auto',
            transformation: [
                { width: 500, height: 500, crop: 'limit' }, // Resize
                { quality: 'auto:good' }    // Compress
            ]
        });
        
        // Send back the public URL
        res.json({ 
            success: true, 
            url: result.secure_url 
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

module.exports = router;