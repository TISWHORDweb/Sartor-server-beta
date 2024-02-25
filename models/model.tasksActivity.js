const mongoose = require('mongoose')

const taskActivitySchema=new mongoose.Schema({
    userID:{
        type:String,
    },
    taskID:{
        type:String, 
    },
    percent:{type:Number, default:1}, 
    creationDateTime:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelTaskAtivity=mongoose.model("model-task", taskActivitySchema)

module.exports=ModelTaskAtivity