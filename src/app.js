import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()

//cors is 3rd party middleware and not included in express
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit: "16kb"})) //middleware to allow json requests and also a custom limit is set to accept limited json in order to avoid server crashouts
app.use(express.urlencoded({extended: true, limit:"16kb"})) // uses encoder to encode URLs
app.use(express.static("public")) //*middleware to store static stuff like images,favicon in backend itself stored in public folder

//*cookie-parser similar to cors is 3rd party middleware and not included in express
app.use(cookieParser())

//routes import
import videoRouter from './routes/video.routes.js'
import userRouter from './routes/user.routes.js'
import likeRouter from './routes/like.routes.js'
import commentRouter from './routes/comment.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import playlistRouter from './routes/playlist.routes.js'
//routes declaration
//*since we have separated routes and controllers folders,so we need to use middleware to use routes
app.use("/api/v1/users", userRouter ) //? http://localhost:<port>/api/v1/users/<route>
app.use("/api/v1/videos", videoRouter) //? http://localhost:<port>/api/v1/videos/<route>
app.use("/api/v1/likes",likeRouter) //? http://localhost:<port>/api/v1/likes/<route>
app.use("/api/v1/comments",commentRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/playlist",playlistRouter)
export { app } 