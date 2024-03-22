// authMiddleware.js

const user =require('../models/user')
const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
      return res.redirect('/api/user/login');
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      
      // Check if the user is blocked
      const userData = await user.findById(decoded.userId);
      if (userData.isBlocked === 'Blocked') {
        res.clearCookie('token');
        return res.redirect('/api/user/login?msg=blocked');
      }
      
      next();
    } catch (error) {
      return res.redirect('/api/user/login');
    }
  };

const isAdmin = (req, res, next) => {
    const token = req.cookies.Authorization;
    console.log('Received Authorization token:', token);

    if (!token) {
        return res.redirect('/adminlogin')
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        console.log('JWT verification:', err ? 'Failed' : 'Successful');
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (decoded && decoded.userId === 'adithyansdev46@gmail.com') {
            console.log('Decoded token:', decoded);
            req.user = decoded; 
            next();
        } else {
            return res.redirect('/adminlogin')

        }
    });
};


module.exports = { verifyToken, isAdmin };
