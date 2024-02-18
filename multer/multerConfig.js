const multer = require('multer');
const path = require('path');

// Use a disk storage configuration that appends an index to filenames:
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

// Modify the upload configuration to handle multiple files correctly:
const upload = multer({
  storage: storage,
  // No need for fileFilter as file types are already restricted in the form's accept attribute
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5 MB
}).array('images', 3);

module.exports = upload;
