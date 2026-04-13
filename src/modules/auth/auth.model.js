import { eq } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import { users } from "../../common/config/schema.js";

export const findUserByEmail = async (email) => {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
};

export const findUserById = async (id) => {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id));
  return result[0] || null;
};

export const createUser = async (data) => {
  const result = await db.insert(users).values(data).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  });
  return result[0];
};

export const updateRefreshToken = async (id, token) => {
  await db.update(users).set({ refreshToken: token }).where(eq(users.id, id));
};

export const findUserByRefreshToken = async (token) => {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.refreshToken, token));
  return result[0] || null;
};
