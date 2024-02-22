const Address = require('../models/address');
const User = require('../models/user');
const Product=require('../models/product')
const Category=require('../models/category')



exports.renderUserprofile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('addresses');
        if (!user) {
            return res.status(404).send('User not found');
        }
        const addresses = user.addresses;
        const products = await Product.find({ isDeleted: false });
        const categories = await Category.find({ isDeleted: false }).populate('products'); 
        const token = req.cookies.token; // Use req.cookies.token to access the token
        console.log("token from:", token);
        res.render('userprofile', { user, products, addresses, token, categories }); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

  
  
  exports.getProfile = async (req, res) => {
    try {
      // Fetch the user's profile based on the user ID stored in req.user
      const user = await User.findById(req.userId );
      console.log("jasdhbsub", user);
      if (!user) {
        // If user is not found, respond with 404 Not Found
        return res.status(404).send('User not found');
      }
  
      // Pass user data to the template for rendering the profile page
      res.render('userprofile', { user });
    } catch (error) {
      // Handle internal server errors
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };
  exports.renderAddress = async (req, res) => {
    try {
        const userId = req.userId; 
        const user = await User.findById(userId).populate('addresses');
        const products = await Product.find({ isDeleted: false });
        const categories = await Category.find({ isDeleted: false }).populate('products'); 
        const token = req.cookies.token;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.render('address', { addresses: user.addresses,products,categories, token});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
  // Controller function to add a new address for a user
  exports.addAddress = async (req, res) => {
    try {
        const userId = req.userId; // Extract user ID from request
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const address = new Address({user:userId,...req.body}); // Create new address instance
        await address.save(); // Save the address to the database
        
        user.addresses.push(address); // Add address reference to user's addresses
        await user.save(); // Save the user
        console.log(address)
        
        res.redirect('/api/user/profile')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

  