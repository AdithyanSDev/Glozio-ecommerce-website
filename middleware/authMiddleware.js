// authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const token =  req.cookies.Authorization;
    console.log('Received Authorization token:', token);

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, `${process.env.JWT_SECRET}`, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        console.log("jwt verify user : ",user);
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    const token = req.cookies.Authorization; // Check for token in cookies instead of headers
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
            req.user = decoded; // Store decoded user info for further use
            next();
        } else {
            res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
    });
};


module.exports = { authenticateJWT, isAdmin };
