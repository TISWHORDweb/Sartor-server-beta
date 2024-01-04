const mongoose = require('mongoose')

const companySchema=new mongoose.Schema({
    companyName:{
        type:String,
    },
    typeOfCompany:{
        type:String,
    },
    typeOfCompanyID:{
        type:String, 
    },
    address:{
        type:String, 
    },
    phone:{
        type:String, 
    },
    email:{
        type:String,
    },
    managerName:{
        type:String,    
    },
    managerEmail:{
        type:String,
    },
    managerPhone:{
        type:String,
    },
    image:{
        type:String,
    },
    location:{
        type:String,
    },
    salesAgentID:{type:String},
    checkType:{type:Number, default:0},
    creationDateTime:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelCompany=mongoose.model("model-company", companySchema)

module.exports=ModelCompany