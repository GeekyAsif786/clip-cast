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
        console.log("File is uploaded in cloudinary", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //removes the locally saved temporary file as the upload operation got failed
        return null;
    }
}


export {uploadOnCloudinary};



