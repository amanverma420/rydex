import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
dotenv.config()
const port = process.env.PORT || 5000
const mongodbUrl=process.env.MONGODB_URL
import http from "http"
import { Server } from "socket.io"
import User from "./models/user.model.js"
const connectDb=async () => {
    try {
        await mongoose.connect(mongodbUrl)
        console.log("db connected")
    } catch (error) {
        console.log("db error")
    }
}

const app=express()
app.use(express.json())
const server=http.createServer(app)

const allowedOrigins = [
    process.env.NEXT_BASE_URL,
    process.env.NEXT_PUBLIC_SOCKET_SERVER_URL,
    process.env.ALLOWED_ORIGIN,
    process.env.ALLOWED_ORIGINS,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003"
].filter(Boolean);

const corsOrigins = allowedOrigins.flatMap((origin) => {
    if (!origin) return [];
    return origin.split(',').map((item) => item.trim()).filter(Boolean);
});

const io=new Server(server,{
    cors:{
        origin: corsOrigins
    }
})


app.post("/emit",async (req,res)=>{
const {event,userId,data}=req.body
try {
    const user=await User.findById(userId)
    if(user.socketId){
io.to(user.socketId).emit(event,data)
    }
    
    return res.json({success:true})
} catch (error) {
    return res.json({success:false})
}
})

io.on("connection",(socket)=>{
  
   socket.on("identity",async (userId)=>{
      socket.userId=userId
      await User.findByIdAndUpdate(userId,{
        socketId:socket.id,
        isOnline:true
      })

   })


   socket.on("update-location",async ({userId,latitude,longitude})=>{
    await User.findByIdAndUpdate(userId,{
        location:{
            type:"Point",
            coordinates:[longitude,latitude]
        }
    })
   })

   socket.on("join-ride",(bookingId)=>{
    console.log("join ride",bookingId)
    socket.join(`ride-${bookingId}`)
   })

   socket.on("driver-location-update",({bookingId,latitude,longitude,status})=>{
    io.to(`ride-${bookingId}`).emit("driver-location",{
        latitude,
        longitude
    })
   })

   socket.on("chat-message",(data)=>{
    io.to(`ride-${data.bookingId}`).emit("chat-message",data)
   })


   socket.on("disconnect",async ()=>{
    if(!socket.userId)return;
await User.findByIdAndUpdate(socket.userId,{
        socketId:null,
        isOnline:false
      })
   })

})




server.listen(port,()=>{
    console.log("server started")
    connectDb()
})
