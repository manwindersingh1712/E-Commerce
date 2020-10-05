const Product = require('../models/product');
const {validationResult}=require('express-validator')
const mongoose=require('mongoose');

const file=require("../util/file");


exports.getAddProduct = (req, res, next) => {
  
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: [],
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  
if(!image){
  return res.status(422).render('admin/edit-product', {
    pageTitle: 'Add product',
    path: '/admin/add-product',
    editing: false,
    hasError:true,
    product: {
      title: title,
      price: price,
      description: description
    },
    errorMessage: "Attatched file is not an image file",
    validationErrors: []
  });
}

  const imageUrl=image.path;
  const errors=validationResult(req);

  if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add product',
      path: '/admin/add-product',
      editing: false,
      hasError:true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  
      const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user
      });
      product
        .save()
        .then(result => {
          // console.log(result);
          console.log('Created Product');
          res.redirect('/admin/products');
        })
        .catch(err => {
          // return res.render('admin/edit-product', {
          //   pageTitle: 'Add product',
          //   path: '/admin/add-product',
          //   editing: false,
          //   hasError:true,
          //   product: {
          //     title: title,
          //     price: price,
          //     description: description,
          //     imageUrl: imageUrl
          //   },
          //   errorMessage: 'Database error occured , please try again in some time!',
          //   validationErrors: []
          // });
          // return res.status(500).redirect('/500');
          const myerror =new Error(err);
          myerror.httpStatusCode = 500;
          return  next(myerror);
        });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: [],
        validationErrors: []
      });
    })
    .catch(err => {
          const myerror=new Error(err);
          myerror.httpStatusCode = 500;
          return  next(myerror);
    });
};

exports.postEditProduct = (req, res, next) => {
  
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;
  const image = req.file;
  const errors=validationResult(req);

  if(!errors.isEmpty()){
    return res.render('admin/edit-product', {
      pageTitle: 'Edit product',
      path: '/admin/edit-product',
      editing: true,
      hasError:true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
    .then(product => {
      if(product.userId.toString() !== req.user._id.toString()){
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if(image){
        file.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save()
        .then(result => {
          console.log('UPDATED PRODUCT!');
          res.redirect('/admin/products');
         })
    })
    .catch(err => {
      const myerror=new Error(err);
      myerror.httpStatusCode = 500;
      return  next(myerror);
});
};

exports.getProducts = (req, res, next) => {
  Product.find({userId: req.user._id})
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      console.log(products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      const myerror=new Error(err);
      myerror.httpStatusCode = 500;
      return  next(myerror);
});
};

// exports.postDeleteProduct = (req, res, next) => {
//   const prodId = req.body.productId;
//   // Product.findByIdAndRemove(prodId)

//   Product.findById(prodId).then(product=>{
//     if(!product){
//       return next(new Error("No product Found!!"))
//     }
//     file.deleteFile(product.imageUrl);
//     return Product.deleteOne({userId: req.user._id , _id: prodId})
//     })
//     .then(() => {
//       console.log('DESTROYED PRODUCT');
//       res.redirect('/admin/products');
//     })
//     .catch(err => {
//       const myerror=new Error(err);
//       myerror.httpStatusCode = 500;
//       return  next(myerror);
// });
// };
exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  // Product.findByIdAndRemove(prodId)

  Product.findById(prodId).then(product=>{
    if(!product){
      return next(new Error("No product Found!!"))
    }
    file.deleteFile(product.imageUrl);
    return Product.deleteOne({userId: req.user._id , _id: prodId})
    })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.status(200).json({message:'Deleted the product!'})
    })
    .catch(err => {
      res.status(500).json({message:'There was an error deleting the product'})
});
};
