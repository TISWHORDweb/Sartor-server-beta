const mongoose = require('mongoose')

const dealSchema=new mongoose.Schema({
    dealName:{
        type:String,
    },
    productID:{
        type:String, 
    },
    companyID:{
        type:String, 
    },
    salesAgentID:{type:String},
    adminID:{type:String},
    status:{type:String, default:"Pending"},
    totalPrice:{type:Number},
    creationDateTime:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelDeal=mongoose.model("model-deal", dealSchema)

module.exports=ModelDeal