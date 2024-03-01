const User = require('../models/user');
const Coupon = require('../models/coupen');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');


const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};


// Admin authentication
exports.adminLogin = async (req, res) => {
  if (req.cookies.token) {
    res.redirect('/admin/adminhome');
    return; // Return after sending the response
  }
  try {
   
    
    const { email, password } = req.body;
    console.log(req.body);
    const predefinedAdminEmail = 'adithyansdev46@gmail.com';
    const predefinedAdminPassword = '971919'; 

    if (email === predefinedAdminEmail) {
      const predefinedAdminPasswordHash = await hashPassword(predefinedAdminPassword);
      const match = await bcrypt.compare(password, predefinedAdminPasswordHash);
      
      if (match) {
        const token = jwt.sign({ userId: predefinedAdminEmail }, process.env.JWT_SECRET);
        res.cookie('Authorization', token); 
        console.log('Generated token:', token);
        res.redirect('/admin/adminhome');
        return; // Return after sending the response
      }
    }

    res.redirect('/adminlogin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


// admin home
exports.adminhome = async (req, res) => {
  try {
    const token = req.cookies.Authorization;
    console.log("login token", token);
    if (token) {
      // Token exists, render admin home page
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '-1');
      res.render('adminhome');
    } else {
      // Token doesn't exist, render admin login page
      res.render('adminlogin');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// List users
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.render('usermanagement', { users });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.userstatus = async (req, res) => {
  try{
    const id = req.params.id;
    console.log(id)
    const user = await User.findById(id)
    if(user.isBlocked === "Unblocked"){
      user.isBlocked = "Blocked";
    }else{
      user.isBlocked = "Unblocked";
    }
    await user.save();
    res.status(200).json({ isBlocked: user.isBlocked }); 
  }catch(e){
    console.log(e);
    res.send("Internal Error");
  }
}

exports.adminlogout = async (req, res) => {
  try {
    req.session.destroy(); // Clear the session, including the token
    res.clearCookie('Authorization'); // Clear the cookie containing the token
    res.redirect('/adminlogin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};


exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};