import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import validator from "validator";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from '../utils/ApiResponse.js'

//declaring a separate re-usable method for generating access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken //saving the generated refresh token in our Database
        await user.save({validateBeforeSave: false}) // validateBeforeSave function saves the database without validating anything else (we did this so that password field is not needed to be modified )

        return {accessToken, refreshToken}
    }
    catch(error){
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Tokens")
    }
}


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
    // console.log("email: ", email)

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
    // if (!(validator.isEmail("email"))){
    //     throw new ApiError(400, "Invalid Email entered!") //?adding a custom error for invalid email format
    // }
    //checking if username or email already exists using $ operator
    const existingUsername = await User.findOne({
        $or: [{ username }]
    })
    const existingEmail = await User.findOne({
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


const loginUser = asyncHandler (async (req,res) => {
    //extract data from req body
    //check username and email in database
    //find the user
    //check for correct password
    //access and refresh token
    //send cookie

    const {email,username,password} = req.body
    console.log(email);


    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    //checking for match with database
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    //if user is not found
    if(!user){
        throw new ApiError(404, "User doest not exist")
    }
    //if user is found(check the password)
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid User Credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id) // On running this method we need to pass the userId from Database and in return we get two values: {Access Token and Refresh Token}

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //securing the cookies and making sure they are modifiable only from server-side
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,{
            user: loggedInUser,
            accessToken,
            refreshToken
        },
        "User Logged in Successfully"
    )
    )
})


const logoutUser = asyncHandler (async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )
    const options= {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"))
})


const refreshAccessToken = asyncHandler (async (req,res) => {
    //fetching refresh token from cookies
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError (401, "Unauthorized Request")
    }
    //now decoding the incoming refresh token since an encrypted version of refresh token comes from client-side 
    //so we need to decode it to raw format using jwt.verify and match it with our database and perform operations

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
        const options ={
            httpOnly:true,
            secure:true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed Successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}   