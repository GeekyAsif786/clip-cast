import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import validator from "validator";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from '../utils/ApiResponse.js'
import mongoose from "mongoose";
import { ActivityLog } from "../models/activitylog.global.models.js"

//re-usable method for generating access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    }
    catch(error){
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Tokens")
    }
}


const registerUser = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { fullName, email, username, password } = req.body;

    if (!fullName?.trim()) throw new ApiError(400, "Full name is required");
    if (!email?.trim()) throw new ApiError(400, "Email is required");
    if (!username?.trim()) throw new ApiError(400, "Username is required");
    if (!password?.trim()) throw new ApiError(400, "Password is required");

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    }).session(session);

    if (existingUser) {
      throw new ApiError(409, "Username or Email already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar image is required");
    }

    const [avatar, coverImage] = await Promise.all([
      uploadOnCloudinary(avatarLocalPath),
      uploadOnCloudinary(coverImageLocalPath),
    ]);

    if (!avatar) throw new ApiError(400, "Avatar image failed to upload");

    const user = await User.create(
      [
        {
          fullName,
          avatar: avatar.url,
          coverImage: coverImage?.url || "",
          email,
          password,
          username: username.toLowerCase(),
        },
      ],
      { session }
    );

    const createdUser = await User.findById(user[0]._id)
      .select("-password -refreshToken")
      .session(session);

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user");
    }

    await ActivityLog.create(
      [
        {
          user: createdUser._id,
          action: "REGISTER_USER",
          target: createdUser._id,
          targetModel: "User",
          metadata: { ip: req.ip },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
  finally {
  session.endSession();
}
});


// const loginUser = asyncHandler(async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { email, username, password } = req.body;

//     if (!username && !email) {
//       throw new ApiError(400, "Username or email is required");
//     }
//     const user = await User.findOne({
//       $or: [{ username }, { email }],
//     }).session(session);

//     if (!user) {
//       throw new ApiError(404, "User does not exist");
//     }
//     const isPasswordValid = await user.isPasswordCorrect(password);
//     if (!isPasswordValid) {
//       throw new ApiError(401, "Invalid user credentials");
//     }
//     const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

//     user.refreshToken = refreshToken;
//     await user.save({ validateBeforeSave: false, session });

//     const loggedInUser = await User.findById(user._id)
//       .select("-password -refreshToken")
//       .session(session);

//     await ActivityLog.create(
//       [
//         {
//           user: user._id,
//           action: "LOGIN_USER",
//           target: user._id,
//           targetModel: "User",
//           metadata: {
//             ip: req.ip,
//             userAgent: req.headers["user-agent"],
//             time: new Date(),
//           },
//         },
//       ],
//       { session }
//     );

//     await session.commitTransaction();
//     session.endSession();

//     const options = {
//       httpOnly: true,
//       secure: true,
//       sameSite: "Strict",
//     };

//     return res
//       .status(200)
//       .cookie("accessToken", accessToken, options)
//       .cookie("refreshToken", refreshToken, options)
//       .json(
//         new ApiResponse(
//           200,
//           {
//             user: loggedInUser,
//             accessToken,
//             refreshToken,
//           },
//           "User logged in successfully"
//         )
//       );
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
//   finally {
//     session.endSession();
//   }
// });


const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) throw new ApiError(404, "User does not exist");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  await ActivityLog.create({
    user: user._id,
    action: "LOGIN_USER",
    target: user._id,
    targetModel: "User",
    metadata: {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      time: new Date(),
    },
  });

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: await User.findById(user._id).select("-password -refreshToken"),
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});



const logoutUser = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Unauthorized request");
    }
    await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { refreshToken: 1 } },
      { new: true, session }
    );
    await ActivityLog.create(
      [
        {
          user: req.user._id,
          action: "LOGOUT_USER",
          target: req.user._id,
          targetModel: "User",
          metadata: {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            time: new Date(),
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
  finally {
    session.endSession();
  }
});


const refreshAccessToken = asyncHandler (async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError (401, "Unauthorized Request")
    }
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
        const { accessToken, refreshToken:newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
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

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old and new passwords are required");
  }
  if(oldPassword === newPassword){
    throw new ApiError(403,"old password cannot be used as new password")
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.user?._id).session(session);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false, session });

    await ActivityLog.create(
      [
        {
          user: req.user._id,
          action: "CHANGE_PASSWORD",
          target: req.user._id,
          targetModel: "User",
          metadata: {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            timestamp: new Date(),
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    await session.endSession();
    return res
      .status(200)
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
});

const getCurrentUser = asyncHandler( async (req,res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, req.user, "Current user fetched successfully" )
    )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) {
    throw new ApiError(400, "At least one field (fullName or email) is required");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.user?._id).session(session);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    if (email && await User.exists({ email, _id: { $ne: req.user._id } })) {
      throw new ApiError(409, "Email already in use");
    }
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;

    await user.save({ validateBeforeSave: true, session });

    await ActivityLog.create(
      [
        {
          user: req.user._id,
          action: "UPDATE_ACCOUNT_DETAILS",
          target: req.user._id,
          targetModel: "User",
          metadata: {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            updatedFields: Object.keys(req.body),
            timestamp: new Date(),
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;
    delete sanitizedUser.refreshToken;

    return res
      .status(200)
      .json(new ApiResponse(200, sanitizedUser, "User details updated successfully"));
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
  finally {
    session.endSession();
   }
});


const updateUserAvatar = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar File Missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
      throw new ApiError(500, "Avatar file failed to upload");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      { new: true, session }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found while updating avatar");
    }

    await ActivityLog.create(
      [
        {
          user: req.user._id,
          action: "UPDATE_AVATAR",
          target: req.user._id,
          targetModel: "User",
          metadata: {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            avatarUrl: avatar.url,
            time: new Date(),
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    await session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar Image updated successfully"));
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
  finally {
    session.endSession();
   }
});


const updateUserCoverImage = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover Image missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
      throw new ApiError(500, "Cover Image Uploading failed");
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      { new: true, session }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }
    await ActivityLog.create(
      [
        {
          user: req.user._id,
          action: "UPDATE_COVER_IMAGE",
          target: req.user._id,
          targetModel: "User",
          metadata: {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            newCoverImage: coverImage.url,
            time: new Date(),
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    await session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(200, user, "Cover Image updated successfully")
      );
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
  finally {
    session.endSession();
   }
});

const getUserChannelProfile = asyncHandler ( async (req,res) => { 
    const {username} = req.params 

    if(!username?.trim()) { 
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([ 
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions", 
                localField:"_id", 
                foreignField:"channel",
                as:"subscribers"   
            }
        },
        {
            $lookup:{
                from:"subscriptions", 
                localField:"_id", 
                foreignField:"subscriber", 
                as:"subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers" 
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo" 
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
})

const getWatchHistory = asyncHandler (async (req,res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos", 
                localField:"watchHistory", 
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
                            ],
                        },
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            },
                        },
                    }
                ],
            },
        },
    ]);
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