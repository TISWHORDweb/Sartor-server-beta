const mongoose = require('mongoose')

const dealProductSchema=new mongoose.Schema({
    productName:{
        type:String,
    },
    productID:{
        type:String, 
    },
    dealID:{
        type:String,
    },
    quantity:{
        type:Number,
        default: 0
    },
    unitPrice:{
        type:Number, 
        default: 0,   
    },
    totalPrice:{
        type:Number,
        default: 0,
    },
    discount:{
        type:Number,
        default: 0,
    },
    creationDateTime:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelDealProduct=mongoose.model("model-deal-product", dealProductSchema)

module.exports=ModelDealProduct