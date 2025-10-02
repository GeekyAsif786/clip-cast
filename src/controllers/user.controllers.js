import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import validator from "validator";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from '../utils/ApiResponse.js'

const registerUser = asyncHandler ( async (req,res) => {
    // get user details from frontend
    // validation - fields not empty
    // check if user already exists - via username and email validation with DataBase
    // check for images and for avatar
    // upload them to cloudinary
    // create user object - create entry in DataBase
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const {fullName, email, username, password} = req.body
    console.log("email: ", email)

    if (fullName === ""){
        throw new ApiError(400, "Fullname is required") //?adding a custom error for empty fullname to the ApiError class defined in utils
    }
    if (email === ""){
        throw new ApiError(400, "email is required") //?adding a custom error for empty email to the ApiError class defined in utils
    }
    if (username === ""){
        throw new ApiError(400, "username is required") //?adding a custom error for empty username to the ApiError class defined in utils
    }
    if (password === ""){
        throw new ApiError(400, "Password is required") //?adding a custom error for empty password to the ApiError class defined in utils
    }
    if (validator.isEmail("email")) {
        console.log("Valid email ✅");
    }
    else if (!validator.isEmail("email")){
        throw new ApiError(400, "Invalid Email entered!") //?adding a custom error for invalid email format
    }
    //checking if username or email already exists using $ operator
    const existingUsername = User.findOne({
        $or: [{ username }]
    })
    const existingEmail = User.findOne({
        $or: [{ email }]
    })
    if (existingUsername) {
        throw new ApiError(409, "Username already exists") //?adding a custom error for already existing username
    }
    if (existingEmail) {
        throw new ApiError(409, "Email already exists") //?adding a custom error for already existing Email
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path; // tracing the local path of the uploaded file before uploading it to cloudinary (? --> checking if file exists or not)
    //?check if avatar is uploaded (compulsory entity)
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is reqeuired")
    }

    //Uploading the file from local server to Cloudinary via cloudinary method created and stored in utils
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(400, "Avatar image failed to upload")
    }
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", //? since cover image was not mandatory, so we check if cover image is uploaded then only fetch the Url otherwise return an empty field
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select( //using .select to fetch the user by id and perform actions on it a follows
        "-password -refreshToken" //these are the fields that we dont want in response field(with prefix -)
    )

    if (!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})


export {
    registerUser,

}   