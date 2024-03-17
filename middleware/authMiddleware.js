// authMiddleware.js

const user =require('../models/user')
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
      return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      next();
  } catch (error) {
      return res.status(401).json({ message: 'Unauthorized' });
  }
};

const isAdmin = (req, res, next) => {
    const token = req.cookies.Authorization;
    console.log('Received Authorization token:', token);

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
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
            res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
    });
};


module.exports = { verifyToken, isAdmin };
