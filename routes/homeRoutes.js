// homeRoutes.js

const express = require('express');
const router = express.Router();
const { renderHomePage } = require('../controllers/authController');
 const { renderDetailPage } = require('../controllers/detailController');

// Home route
router.get('/', renderHomePage);

// GET request to render detail page
router.get('/detail', (req, res) => {
    // Render the detail page
    res.render('detail'); // Assuming your detail page is named 'detail.ejs'
  });
    
  router.get('/detail/:productId',renderDetailPage)

module.exports = router;
