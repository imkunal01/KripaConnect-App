const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// configure cloudinary from env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer (from multer memoryStorage) to Cloudinary.
 * Returns { url, public_id } on success.
 */
function uploadBuffer(buffer, folder = "ecom_products") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function deleteById(public_id) {
  try {
    const res = await cloudinary.uploader.destroy(public_id, { resource_type: "image" });
    return res;
  } catch (err) {
    throw err;
  }
}

module.exports = { uploadBuffer, deleteById };
