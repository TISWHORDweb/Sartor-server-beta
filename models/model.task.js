const mongoose = require('mongoose')

const taskSchema=new mongoose.Schema({
    taskName:{
        type:String,
    },
    task:{
        type:String, 
    },
    status:{
        type:String, 
        default: "Pending"
    },
    salesAgentID:{type:String},
    adminID:{type:String},
    taskFor:{type:Number, default:0}, // single agent = 1 | all agent =  2
    quantity:{type:Number, default:0},
    createBy:{type:Number, default:0}, // admin = 2 | agent =  1
    creationDateTime:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelTask=mongoose.model("model-task", taskSchema)

module.exports=ModelTask