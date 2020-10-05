const fs=require('fs');
const path=require('path');
const PDFDocument=require('pdfkit');
const stripe=require('stripe')(process.env.STRIPE_KEY)

const Product = require('../models/product');
const Order = require('../models/order');
const order = require('../models/order');
const product = require('../models/product');

const itemsPerPage=2;
let totalItems;

exports.getProducts = (req, res, next) => {
  const page= +req.query.page || 1;

  Product
  .find()
  .countDocuments()
  .then(numProducts=>{
    totalItems= numProducts;
    return Product.find()
    .skip((page-1)*itemsPerPage)
    .limit(itemsPerPage)
  })
  .then(products => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products',
        totalProducts: totalItems,
        hasNextPage : itemsPerPage* page < totalItems,
        hasPreviousPage: page >1,
        nextPage: page+1,
        previousPage: page-1,
        lastPage: Math.ceil(totalItems/itemsPerPage),
        currentPage: page
      });
    })
    .catch(err => {
      const myerror=new Error(err);
      myerror.httpStatusCode = 500;
      return  next(myerror);
});
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      const myerror=new Error(err);
      myerror.httpStatusCode = 500;
      return  next(myerror);
});
};

exports.getIndex = (req, res, next) => {
  const page= +req.query.page || 1;

  Product
  .find()
  .countDocuments()
  .then(numProducts=>{
    totalItems= numProducts;
    return Product.find()
    .skip((page-1)*itemsPerPage)
    .limit(itemsPerPage)
  })
  .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        totalProducts: totalItems,
        hasNextPage : itemsPerPage* page < totalItems,
        hasPreviousPage: page >1,
        nextPage: page+1,
        previousPage: page-1,
        lastPage: Math.ceil(totalItems/itemsPerPage),
        currentPage: page
      });
    })
  .catch(err => {
      const myerror=new Error(err);
      myerror.httpStatusCode = 500;
      return  next(myerror);
});
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => {
      const myerror=new Error(err);
      myerror.httpStatusCode = 500;
      return  next(myerror);
});
};

exports.getCheckout=(req,res,next)=>{
  let products;
  let total=0;
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      products = user.cart.items;
      total = 0;
      products.forEach(e=>{
        total+= e.quantity * e.productId.price;
      })

      return stripe.checkout.sessions.create({
        payment_method_types:['card'],
        line_items: products.map(p=>{
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: p.productId.price *100,
            currency:'inr',
            quantity:p.quantity
          }
        }),
        success_url: req.protocol+'://'+req.get('host')+'/checkout/success', // http://localhost:3000/checkout/success
        cancel_url:req.protocol+'://'+req.get('host')+'/checkout/cancel'
      })
    })
    .then(session=>{
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total,
        sessionId: session.id 
      });
    })
    .catch(err => {
      const myerror=new Error(err);
      myerror.httpStatusCode = 500;
      return  next(myerror);
});
}

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const myerror=new Error(err);
      myerror.httpStatusCode = 500;
      return  next(myerror);
});
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const myerror=new Error(err);
      myerror.httpStatusCode = 500;
      return  next(myerror);
});
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const myerror=new Error(err);
      myerror.httpStatusCode = 500;
      return  next(myerror);
});
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => {
      const myerror=new Error(err);
      myerror.httpStatusCode = 500;
      return  next(myerror);
});
};

exports.getInvoice=(req,res,next)=>{

  const orderId=req.params.orderId;
 
  Order.findById(orderId)
  .then(order=>{
    if(!order){
      return next(new Error('No order found!'))
    }
    if(order.user.userId.toString() !== req.user._id.toString()){
      return next(new Error('Unauthorized'));
    }
    const invoiceName= 'invoice-'+orderId+'.pdf';
    const p=path.join('data','invoice',invoiceName);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition','inline; filename="'+invoiceName+'"')// use inline instead of attachment to open pdf in browser
        
    const pdfdoc=new PDFDocument();
    pdfdoc.pipe(fs.createWriteStream(p));
    pdfdoc.pipe(res);

    pdfdoc.fontSize(26).fillColor("black").text("Invoice",{
      underline: true
    });
    pdfdoc.fillColor("darkgrey").text("------------------------------")

    let totalPrice=0;
    order.products.forEach(e => {
      totalPrice+= e.quantity * e.product.price;
      pdfdoc.fontSize(15).fillColor("black").text(e.product.title + " - " + e.quantity + "X $"+ e.product.price )
    });
    pdfdoc.fillColor("darkgrey").text("----");
    pdfdoc.fontSize(20).fillColor("black").text("Total price = $"+totalPrice)

    pdfdoc.end();
    // fs.readFile(p,(err,data)=>{
    
    //   if(err){
    //     return next(err);
    //   }
    //   res.setHeader('Content-Type', 'application/pdf');
    //   res.setHeader('Content-Disposition','attachment; filename="'+invoiceName+'"')// use inline instead of attachment to open pdf in browser
    //   res.send(data)
    // })

    // const file=fs.createReadStream(p);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition','inline; filename="'+invoiceName+'"')
    // file.pipe(res);
  })
  .catch(err=>next(err))

 

}