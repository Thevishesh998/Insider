import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';

export const protectCompany = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again' });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.company = await Company.findById(decoded.id).select('-password');

        if (!req.company) {
            return res.status(401).json({ success: false, message: 'Session expired. Please log in again' });
        }

        next();

    } catch (error) {
        res.status(401).json({ success: false, message: 'Session expired. Please log in again' });
    }
};
