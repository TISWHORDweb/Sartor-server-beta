const mongoose = require('mongoose')

const CVCertificateSchema=new mongoose.Schema({
    personId:{
        type:String, 
    },
    name:{
        type:String,  
    },
    date: {
        type: String,
    },
    issuedBy: {
        type: String,
    },
    time_created:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelCertificate=mongoose.model("model-certificate", CVCertificateSchema)

module.exports=ModelCertificate