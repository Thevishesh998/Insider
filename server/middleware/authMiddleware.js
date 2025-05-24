import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';

export const protectCompany = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.json({ success: false, message: 'Not authorized, Login Again' });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded);

        req.company = await Company.findById(decoded.id).select('-password');
        console.log("Company Found:", req.company);

        if (!req.company) {
            return res.json({ success: false, message: 'Company not found, Login Again' });
        }

        next();

    } catch (error) {
        console.error("JWT Error:", error);
        res.json({ success: false, message: error.message });
    }
};
