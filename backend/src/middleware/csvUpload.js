import multer from 'multer';
import AppError from '../utils/AppError.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024, files: 1 }, fileFilter: (req, file, callback) => { const csvName = file.originalname.toLowerCase().endsWith('.csv'); const csvMime = ['text/csv', 'application/vnd.ms-excel', 'application/csv'].includes(file.mimetype); callback(csvName || csvMime ? null : new AppError('Only CSV files are accepted.', 400, 'INVALID_CSV_FILE'), csvName || csvMime); } });
export const csvUpload = upload.single('file');
