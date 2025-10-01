
//(In this middleware) This is a higher order function which can accept other functions as parameter
const asyncHandler = (requestHandler) => async (req,res,next) => {
    try{
        await requestHandler(req,res,next)
    }
    catch(error){
        res.status(error.code || 500).json({
            success:false,
            message: error.message
        })
    }
}


export {asyncHandler} 