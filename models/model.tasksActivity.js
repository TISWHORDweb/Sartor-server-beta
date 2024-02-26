const mongoose = require('mongoose')

const taskActivitySchema=new mongoose.Schema({
    salesAgentID:{
        type:String,
    },
    taskID:{
        type:String, 
    },
    quantity:{type:Number, default:1}, 
    creationDateTime:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelTaskAtivity=mongoose.model("model-task-activity", taskActivitySchema)

module.exports=ModelTaskAtivity