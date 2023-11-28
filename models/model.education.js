const mongoose = require('mongoose')

const CVEducationSchema=new mongoose.Schema({
    personId:{
        type:String, 
    },
    graduationDate:{
        type:String,  
    },
    school: {
        type: String,
    },
    faculty:{
        type:String,
    },
    department:{
        type:String, 
    },
    level:{
        type:String,  
    },
    notes: {
        type: String,
    },
    time_created:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelEducation=mongoose.model("model-education", CVEducationSchema)

module.exports=ModelEducation