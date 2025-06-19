const{Schema,model}=require("mongoose")



const postSchema=new Schema({
    creator: {type: Schema.Types.ObjectId, ref: "User", required: true},
    body: {type: String, required:true},
    image: {type: String},
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }]
},{timestamps: true})
module.exports=model('Post',postSchema);