import sgMail from '@sendgrid/mail';
import { env } from '../config/env';

const isEmailConfigured = Boolean(env.SENDGRID_API_KEY && env.FROM_EMAIL);

if (isEmailConfigured) {
    sgMail.setApiKey(env.SENDGRID_API_KEY);
}

const createAppError = (message: string, statusCode: number, code: string) => ({
    type: 'AppError',
    message,
    statusCode,
    code,
});

const sendEmail = async (message: Record<string, unknown>, options?: { required?: boolean; logLabel?: string; userMessage?: string }) => {
    if (!isEmailConfigured) {
        if (options?.required) {
            throw createAppError(
                options.userMessage || 'Email service is temporarily unavailable.',
                503,
                'EMAIL_NOT_CONFIGURED'
            );
        }
        return;
    }

    try {
        await sgMail.send(message as any);
    } catch (error) {
        console.error(`[EmailService] ${options?.logLabel || 'send'} failed:`, error);
        if (options?.required) {
            throw createAppError(
                options.userMessage || 'Unable to send email right now. Please try again later.',
                502,
                'EMAIL_DELIVERY_FAILED'
            );
        }
    }
};

export const EmailService = {
    async sendPasswordReset(to: string, resetLink: string): Promise<void> {
        await sendEmail(
            {
                to,
                from: env.FROM_EMAIL,
                subject: 'Reset your IonCare password',
                text: `Click the link below to reset your password. This link expires in 15 minutes.\n\n${resetLink}\n\nIf you did not request a password reset, please ignore this email.`,
                html: `<p>Click the link below to reset your password. This link expires in <strong>15 minutes</strong>.</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request a password reset, please ignore this email.</p>`,
            },
            {
                required: true,
                logLabel: 'password reset',
                userMessage: 'Password reset is temporarily unavailable. Please contact support.',
            }
        );
    },

    sendBookingConfirmation(to: string, data: { bookingId: number; serviceName: string; scheduledDate: string; address: string }): void {
        void sendEmail(
            {
                to,
                from: env.FROM_EMAIL,
                subject: `Booking Confirmed - #${data.bookingId}`,
                text: `Your booking has been confirmed.\n\nService: ${data.serviceName}\nDate: ${data.scheduledDate}\nAddress: ${data.address}\nBooking ID: #${data.bookingId}`,
                html: `<p>Your booking has been confirmed.</p><ul><li><strong>Service:</strong> ${data.serviceName}</li><li><strong>Date:</strong> ${data.scheduledDate}</li><li><strong>Address:</strong> ${data.address}</li><li><strong>Booking ID:</strong> #${data.bookingId}</li></ul>`,
            },
            { logLabel: 'booking confirmation' }
        );
    },

    sendBookingAssigned(to: string, data: { bookingId: number; agentName: string }): void {
        void sendEmail(
            {
                to,
                from: env.FROM_EMAIL,
                subject: `Technician Assigned - Booking #${data.bookingId}`,
                text: `A technician has been assigned to your booking #${data.bookingId}.\n\nTechnician: ${data.agentName}\n\nThey will contact you shortly.`,
                html: `<p>A technician has been assigned to your booking <strong>#${data.bookingId}</strong>.</p><p><strong>Technician:</strong> ${data.agentName}</p><p>They will contact you shortly.</p>`,
            },
            { logLabel: 'booking assigned' }
        );
    },

    sendBookingCompleted(to: string, data: { bookingId: number; amount: number }): void {
        void sendEmail(
            {
                to,
                from: env.FROM_EMAIL,
                subject: `Service Completed - Booking #${data.bookingId}`,
                text: `Your service for booking #${data.bookingId} has been completed.\n\nAmount: Rs.${data.amount}\n\nThank you for choosing IonCare.`,
                html: `<p>Your service for booking <strong>#${data.bookingId}</strong> has been completed.</p><p><strong>Amount:</strong> Rs.${data.amount}</p><p>Thank you for choosing IonCare.</p>`,
            },
            { logLabel: 'booking completed' }
        );
    },
};
