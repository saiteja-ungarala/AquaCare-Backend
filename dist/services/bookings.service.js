"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const booking_model_1 = require("../models/booking.model");
const service_model_1 = require("../models/service.model");
const address_model_1 = require("../models/address.model");
exports.BookingService = {
    getBookings(userId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.pageSize) || 20;
            const offset = (page - 1) * limit;
            const { bookings, total } = yield booking_model_1.BookingModel.findByUser(userId, limit, offset);
            return {
                data: bookings,
                pagination: {
                    page,
                    pageSize: limit,
                    totalItems: total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },
    createBooking(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = yield service_model_1.ServiceModel.findById(data.service_id);
            if (!service)
                throw { type: 'AppError', message: 'Service not found', statusCode: 404 };
            if (data.address_id) {
                const address = yield address_model_1.AddressModel.findById(data.address_id);
                if (!address || address.user_id !== userId)
                    throw { type: 'AppError', message: 'Invalid address', statusCode: 400 };
            }
            const bookingId = yield booking_model_1.BookingModel.create({
                user_id: userId,
                service_id: data.service_id,
                address_id: data.address_id,
                scheduled_date: data.scheduled_date,
                scheduled_time: data.scheduled_time,
                price: service.base_price,
                notes: data.notes,
            });
            return booking_model_1.BookingModel.findById(bookingId);
        });
    },
    cancelBooking(userId, bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            const booking = yield booking_model_1.BookingModel.findById(bookingId);
            if (!booking)
                throw { type: 'AppError', message: 'Booking not found', statusCode: 404 };
            if (booking.user_id !== userId)
                throw { type: 'AppError', message: 'Unauthorized', statusCode: 403 };
            if (booking.status !== 'pending' && booking.status !== 'confirmed') {
                throw { type: 'AppError', message: 'Cannot cancel booking in current status', statusCode: 400 };
            }
            yield booking_model_1.BookingModel.updateStatus(bookingId, 'cancelled');
        });
    }
};
