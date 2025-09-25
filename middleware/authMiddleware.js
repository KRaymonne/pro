const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "Accès refusé. Token manquant." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "Token invalide." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide." });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Accès refusé." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Permissions insuffisantes." });
    }

    next();
  };
};

module.exports = { auth, authorize };

