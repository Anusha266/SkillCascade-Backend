const customError = require('../Utils/customError');
const user=require('./../models/userModel');
const asyncErrorHandler=require('./../Utils/asyncErrorHandler');
const jwt=require('jsonwebtoken');
const util=require('util');

const { response } = require('../app');

const crypto=require('crypto');
const signToken=(id)=>{
        return jwt.sign({id:id},process.env.SECRET_STR,{
                expiresIn:process.env.LOGIN_EXPIRES

        });
}

const createSendResponse=(User,statuscode,res)=>{
        const  token=signToken(User._id);

        const options={
                maxAge:process.env.LOGIN_EXPIRES,
                //secure:true,
                httpOnly:true
        }
        if(process.env.NODE_ENV === 'production'){
                options.secure=true;
        }
        res.cookie('jwt',token,options);
        res.status(statuscode).json({
                status:"success",
                token,
                data:{
                        User
                }
        })
}


exports.signup=asyncErrorHandler(async(req,res,next)=>{
        const newUser=await user.create(req.body);
        createSendResponse(newUser,201,res);

})


exports.login=asyncErrorHandler(async(req,res,next)=>{
        const {email,password}=req.body;
        if(!email || !password){
                const error=new customError("please provide email and password for login",400);
                return next(error);
        }
        const User=await user.findOne({ email }).select('+password');
        if(!User){
                const error=new customError("No user exists");
                return next(error);
        }
        const isMatch=await User.comparePassword(password,User.password);

        if(!isMatch){
                const error=new customError("Incorrect password");
                return next(error);
        }

        createSendResponse(User,200,res);

})



exports.protect=asyncErrorHandler(async(req,res,next)=>{
        //1.read the token & check if it exists

        const testToken=req.headers.authorization;

        let token;
        if(testToken && testToken.startsWith('Bearer')){
                token=testToken.split(' ')[1];
        }

        if(!token){
                return next(new customError("you are not logged in"));
        }
        //2.validate te the token
        const decodedToken=await util.promisify(jwt.verify)(token,process.env.SECRET_STR);
        console.log(decodedToken);



        //3.user is logged in or not
        const User=await user.findById(decodedToken.id);

        console.log(User);
        if(!User){
                const error=new customError(`user not exists with this id::${decodedToken.id}`,401);
                next(error);
        }


        //4.if password changed after token issued
        const changed=await User.isPasswordChanged(decodedToken.iat);
        if(changed){
                return next(new customError("password has been changed recently pleas elogin again",401));
        };

        req.user=User;

        next();

})




exports.restrict=(role)=>{
        return (req,res,next)=>{
                if(req.user.role === role){
                        return next(new customError("you don't have persmission to delete",403));
                }
                next();
        }
}



exports.forgotPassword=asyncErrorHandler(async(req,res,next)=>{
        //1) get user based on posted email
        const User=await user.findOne({email:req.body.email});
        if(!User){
                return next(new customError("user not exists"),404);
        }

        //2) Generate a random request
        const resetToken=User.createResetPasswordToken();

        await User.save({validateBeforeSave:false});



        //3) send token back to suer email
        const resetUrl=`${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        const message=`we have a received a password request . please use below link to reset password\n\n${resetUrl}\n\nthis url is valid only for ten minutes`;
        try{
                await sendEmail({
                email:User.email,
                subject:'password change request received',
                message:message
                });
                res.status(200).json({
                        status:"success",
                        message:`password link send to ${User.email}`
                })
        }
        catch(err){
                User.passwordResetToken=undefined;
                User.passwordResetTokenExpires=undefined;
                User.save({validateBeforeSave:false});

                return next( new customError("failed in sending email",500));
        }


})


exports.passwordReset=asyncErrorHandler(async (req,res,next)=>{
        const token=crypto.createHash('sha256').update(req.params.token).digest('hex');
        const User=await user.findOne({passwordResetToken:token,passwordResetTokenExpires:{$gt:Date.now()}});
        if(!User){
                return next(new customError("Token is invalid or expired",400));
        }

        User.password=req.body.password;
        User.confirmPassword=req.body.confirmPassword;

        User.passwordResetToken=undefined;
        User.passwordResetTokenExpires=undefined;


        User.PasswordChangedAT=Date.now();

        User.save();

        createSendResponse(User,200,res);




})
