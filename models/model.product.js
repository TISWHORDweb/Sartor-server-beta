const mongoose = require('mongoose')

const productSchema=new mongoose.Schema({
    productName:{
        type:String,
    },
    productID:{
        type:String, 
    },
    category:{
        type:String, 
    },
    buyingPrice:{
        type:String, 
    },
    quantity:{
        type:String,
    },
    unit:{
        type:String,    
    },
    expiryDate:{
        type:String,
    },
    sellingPrice:{
        type:String,
    },
    productImage:{
        type:String,
    },
    adminID:{type:String},
    creationDateTime:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelProduct=mongoose.model("model-product", productSchema)

module.exports=ModelProduct