const mongoose = require('mongoose')

const CVHobbySchema=new mongoose.Schema({
    personId:{
        type:String,
    },
    name:{
        type:String, 
    }, 
    proficiency:{
        type:String, 
    }, 
    time_created:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelHobby=mongoose.model("model-hobby", CVHobbySchema)

module.exports=ModelHobby