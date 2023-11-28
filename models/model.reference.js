const mongoose = require('mongoose')

const CVReferenceSchema=new mongoose.Schema({
    personId:{
        type:String, 
    }, 
    company:{
        type:String, 
    },
    jobTitle:{
        type:String,  
    },
    email:{
        type:String, 
    },
    phone:{
        type:String,  
    },
    time_created:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelReference=mongoose.model("model-reference", CVReferenceSchema)

module.exports=ModelReference