import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateRefreshToken,
  findUserByRefreshToken,
} from "./auth.model.js";
import ApiError from "../../common/utils/api-error.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.utils.js";

export const register = async ({ name, email, password, role }) => {
  const existing = await findUserByEmail(email);
  if (existing) throw ApiError.conflict("Email already registered");

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await createUser({
    name,
    email,
    password: hashedPassword,
    role,
  });

  return user;
};

export const login = async ({ email, password }) => {
  // Need password field for comparison
  const user = await findUserByEmail(email);
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw ApiError.unauthorized("Invalid email or password");

  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  // Store refresh token in DB so it can be invalidated on logout
  await updateRefreshToken(user.id, refreshToken);

  const { password: _, refreshToken: __, ...safeUser } = user;

  return { user: safeUser, accessToken, refreshToken };
};
export const refresh = async (token) => {
  if (!token) throw ApiError.unauthorized("Refresh token missing");

  const decoded = verifyRefreshToken(token);

  const user = await findUserByRefreshToken(token);
  if (!user || user.id !== decoded.id) {
    throw ApiError.unauthorized("Invalid refresh token — please log in again");
  }

  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  return { accessToken };
};

export const logout = async (userId) => {
  await updateRefreshToken(userId, null);
};
