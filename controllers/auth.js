const crypto=require('crypto');

const User = require('../models/user');
const bcrypt=require('bcryptjs');
const nodemailer= require('nodemailer');
const sendGridTransporter=require('nodemailer-sendgrid-transport');
const { validationResult }=require('express-validator/check')


const transporter=nodemailer.createTransport(sendGridTransporter({
  auth:{
    api_key: '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'
  }
}))


exports.postLogin = (req, res, next) => {
  const email= req.body.email;
  const password= req.body.password;
  const errors= validationResult(req);

  if(!errors.isEmpty()){
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput:{
        email:email,
        password:password
      },
      validationErrors: errors.array()
    })
  }

  User.findOne({email: email})
    .then( user => {
       bcrypt
      .compare(password , user.password)
      .then(match=>{

        if(match){
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(err => {
            console.log(err);
            return res.redirect('/');
        })
        }

      return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: 'Invalid Password',
      oldInput:{
        email:email,
        password:password
      },
      validationErrors: [{param:'password'}]
    })
      })
      .catch(err=>{
        console.log(err);
        req.flash('error','Invalid password');
        res.redirect('/login')
      })
    })
    .catch(err => {
      const myerror=new Error(err);
      myerror.httpStatusCode = 500;
      return  next(myerror);
});
};

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: req.flash('error'),
    oldInput:{
      email:'',
      password:''
    },
    validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: req.flash('error'),
    oldInput:{
      email:'',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};


exports.postSignup = (req, res, next) => {
  const email= req.body.email;
  const password= req.body.password;
  const confirmPassword= req.body.confirmPassword;
  const errors= validationResult(req);
  console.log(errors.array())

  if(!errors.isEmpty()){
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput:{
        email:email,
        password: password ,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    })
  }
  
   bcrypt.hash(password,12)
      .then(hashedPassword=>{
        const user=new User({
          email: email,
          password: hashedPassword
        })
        return user.save();
      })
      .then(result=>{
        res.redirect('/login');
        return transporter.sendMail({
        from: 'manwindersingh1712@gmail.com',
        to : email,
        subject:' Trial of sending mail ',
        html: '<h1> You just signed up on the our site mantej. </h1>'
      })
      })
      .catch(err => {
        const myerror=new Error(err);
        myerror.httpStatusCode = 500;
        return  next(myerror);
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};


exports.getReset=(req,res,next)=>{
  
  res.render('auth/reset',{
    path: '/reset',
    pageTitle: 'Reset',
    errorMessage: req.flash('error')
  })
}


exports.postReset=(req,res,next)=>{
  crypto.randomBytes(32, (err,buffer)=>{
    if(err){
      console.log(err)
      return res.redirect('/reset');
    }

    const token = buffer.toString('hex');

    User.findOne({email: req.body.email})
    .then(user=>{
      if(!user){
        req.flash('error', 'User not found!!')
        return res.redirect('/reset');
      }
    
      user.resetToken= token;
      user.resetTokenExpiration= Date.now() + 3600000;
      return user.save();
    })
    .then(result=>{
      
      transporter.sendMail({
        from: 'manwindersingh1712@gmail.com',
        to : req.body.email,
        subject:'Reset Password!',
        html: `
        <p> You requested a password reset </p>
        <p> click this <a href="http://localhost:3000/reset/${token}">link</a> to reset your password!</p>
        `
      })
      
      return res.redirect('/login')
    })
    .catch(err => {
      const myerror=new Error(err);
      myerror.httpStatusCode = 500;
      return  next(myerror);
});
    
  })
}

exports.getNewPassword=(req,res,next)=>{
  const token=req.params.token;

  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
  .then(user=>{
    // console.log(user)
    res.render('auth/new-password',{
    path: '/new-password',
    pageTitle: 'New Password',
    errorMessage: req.flash('error'),
    userId: user._id.toString(),
    passwordToken: token
    })
  })
  .catch(err => {
    const myerror=new Error(err);
    myerror.httpStatusCode = 500;
    return  next(myerror);
});
}

exports.postNewPassword=(req,res,next)=>{
  const newPassword= req.body.password;
  const userId= req.body.userId;
  const passwordToken= req.body.passwordToken;
  let resetUser;

  // console.log(newPassword, userId , passwordToken)

  User.findOne({
    resetToken: passwordToken , 
    resetTokenExpiration:{$gt:Date.now()}, 
    _id: userId})
  .then(user=>{
    console.log(user);
    resetUser= user;
    return bcrypt.hash(newPassword, 12)
  })
  .then(hashedPassword=>{

    resetUser.password= hashedPassword;
    resetUser.resetToken= undefined;
    resetUser.resetTokenExpiration= undefined;
    return resetUser.save();
  })
  .then(result=>{
    res.redirect('/login');
  })
  .catch(err => {
    const myerror=new Error(err);
    myerror.httpStatusCode = 500;
    return  next(myerror);
});

}