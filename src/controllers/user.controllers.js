import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import validator from "validator";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from '../utils/ApiResponse.js'
import mongoose from "mongoose";

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
            $unset:{
                refreshToken: 1
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

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, {}, "Password Changed Successfully"
        )
    )
})

const getCurrentUser = asyncHandler( async (req,res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, req.user, "Current user fetched successfully" )
    )
})

const updateAccountDetails = asyncHandler( async (req,res) => {
    const {fullName,email} = req.body

    //! if(!fullName || !email){} -->this is the code needed when both field need to be updated compulsorily
    if(!fullName && !email){
        throw new ApiError(400, "Any one field is required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName,
                email,
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, user, "User details updated successfully"
        )
    )
})

const updateUserAvatar = asyncHandler ( async (req,res)  => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar File Missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(500, "Avatar file failed to upload")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")
    return res
    .statu(200)
    .json(
        new ApiResponse(200,user,"Avatar Image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler ( async (req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(500,"Cover Image Uploading failed")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar Image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler ( async (req,res) => { // handler wrapped by asyncHandler to auto-catch errors and forward to next()
    const username = req.params // NOTE: this assigns the whole params object to `username` (likely a bug). You probably meant `req.params.username` or `const { username } = req.params`.

    if(!username?.trim()) { // check that username exists and is non-empty (but this will throw if username is an object that doesn't have .trim())
        throw new ApiError(400, "Username is missing") // throw a 400 ApiError when username is missing/empty
    }

    const channel = await User.aggregate([ // run an aggregation pipeline on the User collection; returns an array of documents
        {
            $match:{
                username: username?.toLowerCase() // match users by username (converted to lowercase) — will throw if username is not a string
            }
        },
        {
            $lookup:{
                from:"subscriptions", // join the `subscriptions` collection
                localField:"_id", // match User._id
                foreignField:"channel", // with subscriptions.channel
                as:"subscribers"    // store matched subscription docs in `subscribers` array
            }
        },
        {
            $lookup:{
                from:"subscriptions", // another lookup into `subscriptions`
                localField:"_id", // match User._id
                foreignField:"subscriber", // with subscriptions.subscriber
                as:"subscribedTo" // store those in `subscribedTo` array (channels this user has subscribed to)
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers" // compute number of subscribers by taking array length of `subscribers`
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo" // compute number of channels the user has subscribed to
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                email:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1
            }
        }
    ])
    console.log(channel)
    if (!channel?.length){
        throw new ApiError(404, "channel doest not exist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User Channel fetched successfully")
    )
}) // function ends here

const getWatchHistory = asyncHandler (async (req,res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos", // The collection name you want to join with
                localField:"watchHistory", //The field in the current document (in this case, from the User collection) that we want to match with the foreign collection.
                                            //Here: "watchHistory" → means we’ll use the watchHistory field inside the User document
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                },
                                {
                                    $addFields:{
                                        owner:{
                                            $first:"$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch History Fetched Successfully")
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}   