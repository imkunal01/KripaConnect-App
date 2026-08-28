const multer = require('multer');

const storage = multer.memoryStorage();

const uploadCsv = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const isCsvMime = [
      'text/csv',
      'text/plain',
      'application/vnd.ms-excel',
      'application/csv',
      'text/x-csv',
      'application/x-csv',
      'text/comma-separated-values',
      'text/x-comma-separated-values'
    ].includes(file.mimetype);

    const isCsvExt = file.originalname && file.originalname.toLowerCase().endsWith('.csv');

    if (isCsvMime || isCsvExt) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files (.csv) are allowed!'), false);
    }
  }
});

module.exports = uploadCsv;
