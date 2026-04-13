import ApiError from "../../common/utils/api-error.js";
import { verifyAccessToken } from "../../common/utils/jwt.utils.js";
import { findUserById } from "./auth.model.js";

const authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) throw ApiError.unauthorized("Not authenticated");

    const decoded = verifyAccessToken(token);
    const user = await findUserById(decoded.id);
    if (!user) throw ApiError.unauthorized("User no longer exists");

    req.user = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (err) {
    next(err);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden("You do not have permission to perform this action"),
      );
    }
    next();
  };
};

export { authenticate, authorize };
