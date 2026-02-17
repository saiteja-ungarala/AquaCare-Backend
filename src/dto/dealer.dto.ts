import { z } from 'zod';

const DealerKycDocTypeSchema = z.enum([
    // preferred dealer KYC values
    'gst_certificate',
    'shop_license',
    'pan',
    'aadhaar',
    'bank_proof',
    'selfie',
    'other',
    // accepted aliases
    'gst',
    'registration',
    'license',
    'business_registration',
    'bank_statement',
    'address_proof',
]);

export const DealerKycSchema = z.object({
    body: z.object({
        doc_type: z.preprocess(
            (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
            DealerKycDocTypeSchema
        ).optional(),
    }),
});

export const DealerStatusPatchSchema = z.object({
    body: z.object({
        business_name: z.string().trim().min(2).max(120).optional(),
        gst_number: z.string().trim().max(30).optional(),
        address_text: z.string().trim().max(500).optional(),
        base_lat: z.coerce.number().min(-90).max(90).optional(),
        base_lng: z.coerce.number().min(-180).max(180).optional(),
    }).refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field is required',
    }),
});

export const DealerPricingProductSchema = z.object({
    params: z.object({
        productId: z.coerce.number().int().positive(),
    }),
});
