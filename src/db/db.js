import mongoose, { connect } from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect
        (`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB Connected to DB HOST: ${connectionInstance.connection.host}`)
    }
    catch (error){
        console.log("Error while connecting to mongoDB", error);
        process.exit(1);
    }
}

export default connectDB;