import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'; //file management library by NodeJs

// Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });


const uploadOnCloudinary = async (localFilePath) => {
    try{
        if (!localFilePath) return `could not find the specified file path`
        //upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        })
        // file has been uploaded successfully
        // console.log("File is uploaded in cloudinary", response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //removes the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteImageFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error("Public ID is required to delete a file from Cloudinary");
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image", // change to "video" or "raw" if needed
    });

    if (result.result !== "ok") {
      console.warn("Cloudinary deletion warning:", result);
    }

    return result;
  } catch (error) {
    console.error("Cloudinary deletion failed:", error.message);
    throw new Error("Failed to delete file from Cloudinary");
  }
};

const deleteVideoFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error("Public ID is required to delete a file from Cloudinary");
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video", // change to "video" or "raw" if needed
    });

    if (result.result !== "ok") {
      console.warn("Cloudinary deletion warning:", result);
    }

    return result;
  } catch (error) {
    console.error("Cloudinary deletion failed:", error.message);
    throw new Error("Failed to delete file from Cloudinary");
  }
};

export {uploadOnCloudinary , deleteImageFromCloudinary , deleteVideoFromCloudinary};



