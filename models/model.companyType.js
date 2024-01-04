const { boolean } = require('joi')
const mongoose = require('mongoose')

const companyTypeSchema=new mongoose.Schema({
    typeOfCompany:{
        type:String,
    },
    disabled:{type:Boolean, default:false},
    creationDateTime:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelCompanyType=mongoose.model("model-company-type", companyTypeSchema)

module.exports=ModelCompanyType