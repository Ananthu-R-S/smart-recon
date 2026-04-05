import jwt from "jsonwebtoken";

/*export default function authMiddleware(roles = []) {
  if (typeof roles === "string") roles = [roles];
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      next();
    } catch {
      res.status(401).json({ message: "Invalid token" });
    }
  };
}*/
const authMiddleware = (roles = []) => {
  return (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ THIS IS IMPORTANT
      req.user = decoded;

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();

    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};

export default authMiddleware;