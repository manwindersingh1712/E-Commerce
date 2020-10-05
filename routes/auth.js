const express = require('express');
const { check , body}= require('express-validator/check');
const User=require('../models/user');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login' ,
[ 
    check('email')
    .isEmail()
    .normalizeEmail()
    .trim()  
    .withMessage('Enter a valid email')
    .custom((value,{req})=>{

        return User.findOne({email: value})
        .then( user => {
        if(!user){
            return Promise.reject('User not Found')
        }
        })
    })
    ,
    body('password','Please enter a password with only numbers and text and atleast 5 characters')
    .trim()
    .isLength({min: 5})
    .isAlphanumeric()
]
, authController.postLogin);

router.get('/signup', authController.getSignup);

router.post('/signup',
    [check('email')
    .isEmail()
    .withMessage('Please enter a valid email!')
    .normalizeEmail()
    .trim()
    .custom((value,{req})=>{
        return User.findOne({email: value})
        .then(userDoc=>{
          if(userDoc){
           return Promise.reject(
               'User with same email already exists'
               );
           }   
        })
    })
    
    ,
    
    body('password','Please enter a password with only numbers and text and atleast 5 characters')
    .trim()
    .isLength({min:5 })
    .isAlphanumeric()
    
    ,

    body('confirmPassword')
    .trim()
    .custom((value,{req})=>{
        if(value !== req.body.password){
            throw new Error('Passwords have to match')
        }
        return true;
    })
    

    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset',authController.getReset);

router.post('/reset',authController.postReset);

router.get('/reset/:token',authController.getNewPassword);

router.post('/new-password',authController.postNewPassword);


module.exports = router;