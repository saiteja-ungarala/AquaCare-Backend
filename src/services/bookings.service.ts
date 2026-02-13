import { BookingModel } from '../models/booking.model';
import { ServiceModel } from '../models/service.model';
import { AddressModel } from '../models/address.model';
import { BOOKING_STATUS } from '../config/constants';

// Map status query param to actual DB status values
const STATUS_MAP: Record<string, string[]> = {
    active: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.IN_PROGRESS],
    completed: [BOOKING_STATUS.COMPLETED],
    cancelled: [BOOKING_STATUS.CANCELLED],
};

export const BookingService = {
    async getBookings(userId: number, query: any) {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.pageSize as string) || 20;
        const offset = (page - 1) * limit;

        // Resolve status filter
        const statusParam = (query.status as string || '').toLowerCase();
        const statusList = STATUS_MAP[statusParam] || undefined;

        const { bookings, total } = await BookingModel.findByUser(userId, limit, offset, statusList);

        return {
            data: bookings,
            pagination: {
                page,
                pageSize: limit,
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async createBooking(userId: number, data: any) {
        const service = await ServiceModel.findById(data.service_id);
        if (!service) throw { type: 'AppError', message: 'Service not found', statusCode: 404 };

        if (data.address_id) {
            const address = await AddressModel.findById(data.address_id);
            if (!address || address.user_id !== userId) throw { type: 'AppError', message: 'Invalid address', statusCode: 400 };
        }

        const bookingId = await BookingModel.create({
            user_id: userId,
            service_id: data.service_id,
            address_id: data.address_id,
            scheduled_date: data.scheduled_date,
            scheduled_time: data.scheduled_time,
            price: service.base_price,
            notes: data.notes,
        });

        return BookingModel.findById(bookingId);
    },

    async cancelBooking(userId: number, bookingId: number) {
        const booking = await BookingModel.findById(bookingId);
        if (!booking) throw { type: 'AppError', message: 'Booking not found', statusCode: 404 };
        if (booking.user_id !== userId) throw { type: 'AppError', message: 'Unauthorized', statusCode: 403 };
        if (booking.status !== 'pending' && booking.status !== 'confirmed') {
            throw { type: 'AppError', message: 'Cannot cancel booking in current status', statusCode: 400 };
        }

        await BookingModel.updateStatus(bookingId, 'cancelled');
    }
};
