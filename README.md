# E-Commerce

This is a proper functional website with a basic ui. I have used node.js , express.js and many more 3rd party packages to complete this project.<br/>
Visit my Website: https://manwinder-shop.herokuapp.com/ <br/>
You can also see my resume at https://manwindersingh1712.github.io/portfolio.os/

## Setup

You have to use replace some variables with the value

Go to the mongodb atlas and create a cluster in which you will find a uri and change the following in app.js.
- ${process.env.MONGO_USER}: your username
- ${process.env.MONGO_PASS}: your password
- ${process.env.MONGO_DATABASE}: the name of your database

Now go to Stripe and create an account and go to the shop.js in controllers.
- process.env.STRIPE_KEY: You will find a key there

You are all set to run this code.

## Available Scripts

In this project you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.<br/>
