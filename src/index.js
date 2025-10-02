//importing mongoose to connect to mongodb
import dotenv from "dotenv"
import connectDB from "./db/db.js";
import express from "express"
import {app} from './app.js'


dotenv.config({
    path:'./env'
});

connectDB()
.then( () => {
    app.on("error", () => {
        console.log("Error while connecting to MongoDB...", error);
        throw error;   
       })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at Port: ${process.env.PORT}`);
    } )
})
.catch((err) => {
    console.log("Failed connecting to MongoDB !!! ", err)
})



















/*
//Alternative approact to place codes in index.js file and connect to mongoDB and start server but we dont
//generally do this way, rather we create separate files for different functionalities to keep our code clean and

import express from "express";
import dotenv from "dotenv";
const app = express();
dotenv.config();
( async () =>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error", () => {
        console.log("Error while connecting to mongoDB", error);
        throw error;   
       })
       app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
       })
    }
    catch (error){
        console.log("Error while connecting to mongoDB", error);
        throw error;
    }
})()
    */