import * as seatService from "./seat.service.js";
import ApiResponse from "../../common/utils/api-response.js";

const getSeats = async (req, res, next) => {
  try {
    const seats = await seatService.getSeats();

    res.json(seats);
  } catch (err) {
    next(err);
  }
};

const bookSeat = async (req, res, next) => {
  try {
    const seatId = parseInt(req.params.id);
    const userId = req.user.id;
    const userName = req.user.name;

    const result = await seatService.bookSeatById(seatId, userId, userName);
    ApiResponse.ok(res, "Seat booked successfully", result);
  } catch (err) {
    next(err);
  }
};

export { getSeats, bookSeat };
