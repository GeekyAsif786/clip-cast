import mongoose from "mongoose";
//(In this middleware) This is a higher order function which can accept other functions as parameter
// this is a wrapper class to handle incoming requests (reusable)

// const asyncHandler = (requestHandler) => async (req,res,next) => {
//     try{
//         await requestHandler(req,res,next)
//     }
//     catch(error){
//         res.status(error.code || 500).json({
//             success:false,
//             message: error.message
//         })
//     }
// }


/* 
//?Alternative syntax for asyncHandler

*/
 const asyncHandler = (requestHandler) => {
        return (req,res,next) => {
            Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))    
        }    

    }



export {asyncHandler} 