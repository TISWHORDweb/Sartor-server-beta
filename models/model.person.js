const mongoose = require('mongoose')

const CVPersonSchema=new mongoose.Schema({
    firstName:{
        type:String,
    },
    surname:{
        type:String, 
    },
    title:{
        type:String, 
    },
    aboutMe:{
        type:String, 
    },
    dob:{
        type:String, 
    },
    photo:{
        type:String,
    },
    nationality:{
        type:String,    
    },
    jobtitle:{
        type:String,    
    },
    birthday:{
        type:String,    
    },
    country:{
        type:String,    
    },
    city:{
        type:String,
    },
    password:{
        type:String,
    },
    phone:{
        type:String,
    },
    email:{
        type:String,
    },
    workemail:{
        type:String,
    },
    address: {
        type:String,
    },
    linkedin:{
        type:String,
    },
    facebook:{
        type:String,
    },
    github:{
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
    creationDateTime:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelPerson=mongoose.model("model-person", CVPersonSchema)

module.exports=ModelPerson