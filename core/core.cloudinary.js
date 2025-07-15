const cloudinary = require('cloudinary').v2;

const uploadToCloudinary = async (imagePath) => {
  try {
    // Test configuration
    const testConfig = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    };
    
    console.log('Using config:',"in progress");

    cloudinary.config({
      ...testConfig,
      secure: true
    });

    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'modified',
      quality: 'auto:best',
      resource_type: 'image',
      unique_filename: true,
      overwrite: false
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Full Cloudinary error:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

module.exports = { uploadToCloudinary };