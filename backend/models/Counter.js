const mongoose=require('mongoose');

//Counter Şeması
const counterSchema=new mongoose.Schema({
    name:{type:String, required:true,unique:true}, //Sayaç adı (userId,roleId)
    value:{type:Number,required:true,default:0} //Sayaç değer
})

module.exports=mongoose.model('Counter',counterSchema);