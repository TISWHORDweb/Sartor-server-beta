const mongoose = require('mongoose')

const CVLanguageSchema=new mongoose.Schema({
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


const ModelLanguage=mongoose.model("model-language", CVLanguageSchema)

module.exports=ModelLanguage