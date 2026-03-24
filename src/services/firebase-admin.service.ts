import fs from 'fs';
import path from 'path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from '../config/env';

type FirebaseServiceAccount = {
    project_id?: string;
    client_email?: string;
    private_key?: string;
};

const getServiceAccountFromFile = (): FirebaseServiceAccount | null => {
    if (!env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        return null;
    }

    const resolvedPath = path.resolve(__dirname, '../../', env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (!fs.existsSync(resolvedPath)) {
        throw {
            type: 'AppError',
            message: 'Firebase service account file path is invalid.',
            statusCode: 500,
            details: [
                {
                    field: 'firebase',
                    message: 'Firebase service account file path is invalid.',
                },
            ],
        };
    }

    return JSON.parse(fs.readFileSync(resolvedPath, 'utf8')) as FirebaseServiceAccount;
};

const getFirebaseCredentialConfig = () => {
    const fileConfig = getServiceAccountFromFile();

    return {
        projectId: env.FIREBASE_PROJECT_ID || fileConfig?.project_id || '',
        clientEmail: env.FIREBASE_CLIENT_EMAIL || fileConfig?.client_email || '',
        privateKey: env.FIREBASE_PRIVATE_KEY || fileConfig?.private_key || '',
    };
};

const isConfigured = (): boolean => {
    const config = getFirebaseCredentialConfig();
    return Boolean(config.projectId && config.clientEmail && config.privateKey);
};

const getFirebaseAuth = () => {
    const config = getFirebaseCredentialConfig();

    if (!isConfigured()) {
        throw {
            type: 'AppError',
            message: 'Firebase signup SMS verification is not configured on the server.',
            statusCode: 503,
            details: [
                {
                    field: 'firebase',
                    message: 'Firebase signup SMS verification is not configured on the server.',
                },
            ],
        };
    }

    if (!getApps().length) {
        initializeApp({
            credential: cert({
                projectId: config.projectId,
                clientEmail: config.clientEmail,
                privateKey: config.privateKey.replace(/\\n/g, '\n'),
            }),
        });
    }

    return getAuth();
};

export const FirebaseAdminService = {
    isConfigured,
    async verifyPhoneIdToken(idToken: string): Promise<{ phoneNumber: string; uid: string }> {
        const decodedToken = await getFirebaseAuth().verifyIdToken(idToken);

        if (!decodedToken.phone_number) {
            throw {
                type: 'AppError',
                message: 'Firebase phone verification did not include a phone number.',
                statusCode: 400,
                details: [
                    {
                        field: 'firebaseIdToken',
                        message: 'Firebase phone verification did not include a phone number.',
                    },
                ],
            };
        }

        return {
            phoneNumber: decodedToken.phone_number,
            uid: decodedToken.uid,
        };
    },
};
