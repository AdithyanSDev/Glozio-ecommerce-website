const mongoose=require('mongoose')
// const connectDB=async()=>{
//     try{
// // //mongodb connection string
// // const con=await mongoose.connect('mongodb://localhost:27017',{
// //     // useNewUrlParser:true,
// //     // useUnifiedTopology:true,
// //     // useFindAndModify:false,
// //     // useCreateInde:true
// // })

// // console.log(`MongoDB connected :${con.connection.host}`)
// //     }catch(err){
// // console.log(err);
// // process.exit(1)
// //     }
// // }

// module.exports=connectDB
 function connectDB(){
    mongoose.connect('mongodb://localhost:27017').then((res)=>{
    console.log("mongodb connected")
    })
}
   
module.exports=connectDB;