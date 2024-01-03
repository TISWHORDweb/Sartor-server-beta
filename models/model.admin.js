const mongoose = require('mongoose')

const adminSchema=new mongoose.Schema({
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
    adminType:{type:Number, default:1,},
    creationDateTime:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelAdmin=mongoose.model("model-admin", adminSchema)

module.exports=ModelAdmin