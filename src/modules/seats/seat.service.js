import { getAllSeats, bookSeat } from "./seat.model.js";
import ApiError from "../../common/utils/api-error.js";

export const getSeats = async () => {
  return await getAllSeats();
};

export const bookSeatById = async (seatId, userId, userName) => {
  const result = await bookSeat(seatId, userId, userName);
  if (result.error) throw ApiError.conflict(result.error);
  return result;
};
