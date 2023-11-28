const mongoose = require('mongoose')

const CVWorkSchema=new mongoose.Schema({
    personId:{
        type:String,
    },
    jobTitle:{
        type:String, 
    },
    company:{
        type:String,
    },
    department:{
        type:String, 
    },
    jobStatus:{
        type:String, 
    },
    city:{
        type:String, 
    },
    startDate:{
        type:String,
    },
    endDate:{
        type:String,
    },
    notes:{
        type:String, 
    },
    time_created:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelWork=mongoose.model("model-work", CVWorkSchema)

module.exports=ModelWork
