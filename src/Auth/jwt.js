const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token is missing or invalid' });
    }

    try {
        const decoded = jwt.verify(token, 'YourSecretKey');
        req.user = decoded; // Attach user information to the request
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Token is not valid' });
    }
};

module.exports = authenticateJWT;
