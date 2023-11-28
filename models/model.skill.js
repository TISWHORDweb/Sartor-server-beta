const mongoose = require('mongoose')

const CVSkillSchema=new mongoose.Schema({
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


const ModelSkill=mongoose.model("model-skill", CVSkillSchema)

module.exports=ModelSkill