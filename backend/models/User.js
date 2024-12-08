const mongoose=require('mongoose');
// Kullanıcı şeması

const userSchema=new mongoose.Schema({
    userId:{type:Number,required:true,unique:true},// Custom ID
    firstName:{type:String, required:true},
    lastName:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    phone:{type:String, default:null},
    roleId:{type:Number,required:true},// Kullanıcıya bir roleId atanmalı
    password:{type:String, required:true},
},
{timestamps:true});// Otomatik olarak createdAt ve updatedAt alanları ekler

module.exports=mongoose.model('User',userSchema);