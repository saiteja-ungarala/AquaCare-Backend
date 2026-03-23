import https from 'https';
import { env } from '../config/env';

const SMS_PROVIDER_TIMEOUT_MS = 5000;

const createAppError = (message: string, statusCode: number, code: string) => ({
    type: 'AppError',
    message,
    statusCode,
    code,
});

const postJson = (url: string, body: string, headers: Record<string, string>): Promise<{ statusCode: number; body: string }> =>
    new Promise((resolve, reject) => {
        const requestUrl = new URL(url);
        const request = https.request(
            {
                protocol: requestUrl.protocol,
                hostname: requestUrl.hostname,
                port: requestUrl.port || undefined,
                path: `${requestUrl.pathname}${requestUrl.search}`,
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Length': Buffer.byteLength(body).toString(),
                },
            },
            (response) => {
                let responseBody = '';
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    responseBody += chunk;
                });
                response.on('end', () => {
                    resolve({
                        statusCode: response.statusCode || 500,
                        body: responseBody,
                    });
                });
            }
        );

        request.setTimeout(SMS_PROVIDER_TIMEOUT_MS, () => {
            request.destroy(new Error(`Fast2SMS request timed out after ${SMS_PROVIDER_TIMEOUT_MS}ms`));
        });
        request.on('error', reject);
        request.write(body);
        request.end();
    });

export const SmsService = {
    async sendOTP(phone: string, otp: string): Promise<void> {
        if (!env.FAST2SMS_API_KEY) {
            throw createAppError(
                'SMS OTP is temporarily unavailable. Please try again later.',
                503,
                'SMS_OTP_UNAVAILABLE'
            );
        }

        const payload = JSON.stringify({
            variables_values: otp,
            route: 'otp',
            numbers: phone,
        });

        try {
            const response = await postJson('https://www.fast2sms.com/dev/bulkV2', payload, {
                authorization: env.FAST2SMS_API_KEY,
                'Content-Type': 'application/json',
            });

            if (response.statusCode < 200 || response.statusCode >= 300) {
                console.error('[SmsService] Fast2SMS non-2xx response:', {
                    statusCode: response.statusCode,
                    body: response.body,
                });
                throw createAppError('Unable to send OTP right now. Please try again later.', 502, 'OTP_DELIVERY_FAILED');
            }

            let parsed: any = null;
            try {
                parsed = JSON.parse(response.body);
            } catch {
                parsed = null;
            }

            if (parsed?.return === false || parsed?.status_code === 0) {
                console.error('[SmsService] Fast2SMS rejected OTP request:', parsed);
                throw createAppError('Unable to send OTP right now. Please try again later.', 502, 'OTP_DELIVERY_FAILED');
            }
        } catch (error) {
            if ((error as any)?.type === 'AppError') {
                throw error;
            }

            console.error('[SmsService] OTP delivery failed:', error);
            throw createAppError('Unable to send OTP right now. Please try again later.', 502, 'OTP_DELIVERY_FAILED');
        }
    },
};
