import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import multer from "multer";
import cors from 'cors';
import http from "http";
import {Server} from "socket.io";

const app=express();


app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true // include this only if you're using cookies/sessions
}));

const server=http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://hostelbuddie-mh6z.vercel.app"
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman, server-side, etc.
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS (Socket.IO)"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  }
});


dotenv.config();//to load the environment variables

// const PORT=process.env.PORT;
//to access port
const PORT = process.env.PORT || 4200;


app.use(express.json());

const users = {};

io.on("connection", (socket) => {
  console.log(`🔌 New socket connected: ${socket.id}`);

  // Register the user's email on connection
  socket.on("register_user", (email) => {
    users[email] = socket.id;
    console.log(`✅ Registered: ${email} with socket ${socket.id}`);
  });

  // Handle message sending
  socket.on("send_message", (data) => {
    const { to, from, message } = data;
    console.log(`📨 Message from ${from} to ${to}: ${message}`);

    const recipientSocket = users[to];

    if (recipientSocket) {
      io.to(recipientSocket).emit("receive_message", data);
    }

    // Also emit back to sender for their local display
    socket.emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    // Remove user from map when disconnected
    for (const [email, id] of Object.entries(users)) {
      if (id === socket.id) {
        delete users[email];
        console.log(`❌ Disconnected: ${email}`);
        break;
      }
    }
  });
});

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts_lost_found.js";
import buySellRoutes from "./routes/posts_buy_sell.js"; 

import {verify} from "./middlewares/auth.js";
// import { uploadFile } from "./middlewares/upload.js"; 
import { cloudinaryFile,upload } from "./middlewares/cloudinary.js";


app.use("/auth",authRoutes);
app.use("/users",userRoutes);
app.use("/posts/lost-found", postRoutes);
app.use("/posts/buy-sell", buySellRoutes);

// app.get("/protected",verify,(req,resp)=>{  //working fine(verification waala)
//     resp.json({message:req.user})
// });

// app.post("/upload",uploadFile,(req,resp)=>{ //uploading files- working fine
//     try{
//         resp.status(200).json({message:"File uploaded successfully!"});
//     }
//     catch(error){
//         resp.status(500).json({error:error.message});
//     }
// })

// app.post("/cloudUpload",upload.single("file"),cloudinaryFile,(req,res)=>{ //uploading files- to check
//     try{
//         return res.status(200).json({message:"File uploaded successfully!"});
//     }
//     catch(error){
//         return res.status(500).json({error:error.message});
//     }
// })

mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    console.log("Database Connected successfully!");
    server.listen(PORT,()=>console.log(`Running on port ${PORT}`));
})
.catch((error)=>{
    console.error("Database connection failed ",error.message);
    process.exit(1);//exit if the database is not connected
});

//to run db   
// mongoose.connect("mongodb+srv://your username:password here@learning.cim4t.mongodb.net/?retryWrites=true&w=majority&appName=learning")
// .then(()=>{
//     console.log("Database Connected successfully!");
//     app.listen(PORT,()=>console.log(`Running on port ${PORT}`));
// })
// .catch((error)=>{
//     console.error("Database connection failed ",error.message);
//     process.exit(1);//exit if the database is not connected
// });