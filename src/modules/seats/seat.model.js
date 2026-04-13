import { db } from "../../common/config/db.js";
import { seats } from "../../common/config/schema.js";
import pg from "pg";

// Separate pool for raw transactions (needed for SELECT ... FOR UPDATE)
const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

export const getAllSeats = async () => {
  return await db.select().from(seats).orderBy(seats.id);
};

// Uses raw pg transaction with SELECT FOR UPDATE to prevent duplicate bookings
export const bookSeat = async (seatId, userId, userName) => {
  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");

    // Lock the row — prevents race conditions / double bookings
    const result = await conn.query(
      "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE",
      [seatId],
    );

    if (result.rowCount === 0) {
      await conn.query("ROLLBACK");
      return { error: "Seat already booked" };
    }

    await conn.query(
      "UPDATE seats SET isbooked = 1, name = $2, user_id = $3 WHERE id = $1",
      [seatId, userName, userId],
    );

    await conn.query("COMMIT");
    return { success: true, seatId, bookedBy: userName };
  } catch (err) {
    await conn.query("ROLLBACK");
    throw err;
  } finally {
    conn.release();
  }
};
