const cloudinary = require("cloudinary");
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    let cld_upload_stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "foo",
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};

module.exports = uploadCloudinary;
