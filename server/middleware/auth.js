const jwt = require('jsonwebtoken');

// Use the exact same secret key you used in authRoutes.js
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_retail_key_123";

const verifyAdmin = (req, res, next) => {
  // 1. Look for the token in the request headers
  const token = req.header('Authorization');
  
  // 2. If there is no token, immediately reject the request
  if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

  try {
    // 3. Verify the token is real and hasn't been tampered with
    // We replace "Bearer " because tokens are usually sent as "Bearer eyJhb..."
    const verified = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    
    // 4. Check if the user is actually an admin
    if (verified.role !== 'admin') {
      return res.status(403).json({ message: "Access Denied. Admin privileges required." });
    }

    // 5. If everything is good, let them pass!
    req.user = verified;
    next(); 
    
  } catch (err) {
    res.status(400).json({ message: "Invalid or Expired Token." });
  }
};

module.exports = { verifyAdmin };