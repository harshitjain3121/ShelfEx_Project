const jwt=require('jsonwebtoken')
const HttpError=require('../models/errorModel')

const authMiddleware= async (req,res,next)=>{
    const Authorization= req.headers.Authorization || req.headers.authorization;

    if(Authorization && Authorization.startsWith("Bearer")){
        const token=Authorization.split(' ')[1]
        jwt.verify(token, process.env.JWT_SECRET, (err,info)=>{
            if(err){
                return next(new HttpError("Unauthorized. Invalid token",403))
                // return res.json({ok:false, msg:"yaha par."})
            }
            req.user=info;
            next()
        })
    }
    else{
        return next(new HttpError("Unauthorized. No token",401))
        // return res.json({ok:false, msg:"Unauthorized."})
    }
}
module.exports=authMiddleware;