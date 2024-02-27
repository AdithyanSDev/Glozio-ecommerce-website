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
        
        res.render('address', { addresses: user.addresses,products,categories, token,user});
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
        
        const address = new Address({user:userId,...req.body}); 
        await address.save(); 
        
        user.addresses.push(address); 
        await user.save(); 
        console.log(address)
        
        res.redirect('/api/user/profile')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.addAddressCheckOut=async (req,res)=>{
  try {
    const userId = req.userId; // Extract user ID from request
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    const address = new Address({user:userId,...req.body}); 
    await address.save(); 
    
    user.addresses.push(address); 
    await user.save(); 
    console.log(address)
    
    res.redirect('/checkout')
} catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
}
}

exports.renderUpdateAddress = async (req, res) => {
  try {
      
      const { id } = req.params;
      const userId = req.userId; 
      const user = await User.findById(userId).populate('addresses');
      const products = await Product.find({ isDeleted: false });
      const categories = await Category.find({ isDeleted: false }).populate('products'); 
      const token = req.cookies.token;
      
      const address = await Address.findById(id);

     
      res.render('updateaddress', { address,products,categories, token,user });
  } catch (error) {
      console.error('Error rendering update address form:', error);
      res.status(500).send('An unexpected error occurred');
  }
};

exports.editAddress = async (req, res) => {
  try {
      const { id } = req.params;
      const { name, mobileNumber, pincode, locality, address, city, state, addressType } = req.body;
      const existingAddress = await Address.findById(id);

      if (!existingAddress) {
          return res.status(404).json({ error: 'Address not found' });
      }

      existingAddress.name = name;
      existingAddress.mobileNumber = mobileNumber;
      existingAddress.pincode = pincode;
      existingAddress.locality = locality;
      existingAddress.address = address;
      existingAddress.city = city;
      existingAddress.state = state;
      existingAddress.addressType = addressType;

    
      await existingAddress.save();

      res.redirect('/api/user/address');
  } catch (error) {
      console.error('Error editing address:', error);
      res.status(500).json({ error: 'An unexpected error occurred' });
  }
};
exports.deleteAddress = async (req, res) => {
  console.log("dljfdk")
  try {
      const { id } = req.params;
      await Address.findByIdAndDelete(id);
      res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

exports.editprofile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const userId = req.userId;

        // Update user information in the database using async/await
        const updatedUser = await User.findByIdAndUpdate(userId, { name, email }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Redirect to the user profile page after updating the user
        res.redirect('/api/user/profile');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



exports.renderEdit = async (req, res) => {
    try {
        // Fetch user data from the database based on the user ID
        const user = await User.findById(req.userId);
        const addresses = user.addresses;
        const products = await Product.find({ isDeleted: false });
        const categories = await Category.find({ isDeleted: false }).populate('products'); 
        const token = req.cookies.token;
        // Render the updateprofile.ejs view and pass the user data to it
        res.render('updateprofile', { user: user ,addresses,products,categories,token});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
