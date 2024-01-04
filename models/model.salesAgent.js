const mongoose = require('mongoose')

const salesAgentSchema=new mongoose.Schema({
    fullName:{
        type:String,
    },
    address:{
        type:String, 
    },
    email:{
        type:String, 
    },
    phone:{
        type:String, 
    },
    image:{
        type:String,
    },
    password:{
        type:String,    
    },
    token:{
        type:String,
    },
    lastLogin:{
        type:String,
    },
    isverified:{
        type:Boolean,
        default: false,
    },
    blocked:{
        type:Boolean,
        default: false,
    },
    lastLogin:{
        type:String,
    },
    agentType:{type:Number, default:0,},
    adminID:{ type:String},
    creationDateTime:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelSalesAgent=mongoose.model("model-sales-agent", salesAgentSchema)

module.exports=ModelSalesAgent