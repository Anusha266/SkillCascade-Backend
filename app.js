//import package
const express= require('express');


const morgan=require('morgan');

const authRouter=require('./Routes/authroutes');


const customError=require('./Utils/customError');

const GlobalErrorHandler= require('./controllers/errorController');

let app=express();


app.use(express.json());

app.use(cors());

if(process.env.NODE_ENV === 'development')
{
        app.use(morgan('dev'));
}





//*******************************Routes*************** 

app.use('/api/v1/auth',authRouter);


app.all('*',(req,res,next)=>{
        const err=new customError(`can't find this url${req.originalUrl}`,404);
        next(err);
})

app.use(GlobalErrorHandler);

module.exports=app;

