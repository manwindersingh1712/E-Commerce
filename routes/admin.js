const path = require('path');

const express = require('express');
const {check}= require('express-validator/check')

const adminController = require('../controllers/admin');
const isAuth=require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product',isAuth,adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product',[
    check('title','Invalid title')
    .isString()
    .isLength({min:3, max:26})
    .trim(),
    // check('imgUrl','Invalid imgUrl').isURL(),
    check('price','Invalid price').isFloat(),
    check('description','Invalid description')
    .isLength({min:10 , max:400})
    .isString()
] , isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product',[
    check('title','Invalid title')
    .isString()
    .isLength({min:3, max:26})
    .trim(),
    // check('imgUrl','Invalid imgUrl').isURL(),
    check('price','Invalid price').isFloat(),
    check('description','Invalid description')
    .isLength({min:10 , max:400})
    .isString()
] , isAuth, adminController.postEditProduct);

// router.post('/delete-product', isAuth, adminController.postDeleteProduct);
router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
