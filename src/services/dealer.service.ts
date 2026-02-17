import { DealerModel, DealerPricingRuleRow, DealerProductPricingRow, ProductBasePricingRow } from '../models/dealer.model';

const DEALER_KYC_DOC_TYPE_ALIASES: Record<string, string> = {
    gst: 'gst_certificate',
    gst_certificate: 'gst_certificate',
    shop_license: 'shop_license',
    registration: 'shop_license',
    license: 'shop_license',
    business_registration: 'shop_license',
    address_proof: 'other',
    bank_proof: 'bank_proof',
    bank_statement: 'bank_proof',
    pan: 'pan',
    aadhaar: 'aadhaar',
    selfie: 'selfie',
    other: 'other',
};

const normalizeKycDocType = (value?: string): string => {
    const key = String(value || '').trim().toLowerCase();
    return DEALER_KYC_DOC_TYPE_ALIASES[key] || 'other';
};

const normalizeMarginType = (value: unknown): 'flat' | 'percent' | null => {
    const v = String(value || '').toLowerCase();
    if (v === 'flat' || v === 'percent') return v;
    return null;
};

const calculateDealerPrice = (
    retailPrice: number,
    marginType: 'flat' | 'percent' | null,
    marginValue: number | null
): { dealerPrice: number; marginAmount: number } => {
    const safeRetailPrice = Number(retailPrice || 0);
    const safeMarginValue = Number(marginValue || 0);

    if (!marginType || safeMarginValue <= 0) {
        return { dealerPrice: safeRetailPrice, marginAmount: 0 };
    }

    const marginAmount = marginType === 'percent'
        ? (safeRetailPrice * safeMarginValue) / 100
        : safeMarginValue;

    const dealerPrice = Math.max(0, safeRetailPrice - marginAmount);
    return {
        dealerPrice,
        marginAmount: Math.max(0, marginAmount),
    };
};

const buildPricingRow = (
    product: ProductBasePricingRow,
    customPricing: DealerProductPricingRow | null,
    fallbackRule: DealerPricingRuleRow | null
) => {
    const retailPrice = Number(product.price || 0);

    if (customPricing) {
        const marginType = normalizeMarginType(customPricing.margin_type);
        const marginValue = customPricing.margin_value !== null ? Number(customPricing.margin_value) : null;
        const marginAmount = marginType && marginValue !== null
            ? calculateDealerPrice(retailPrice, marginType, marginValue).marginAmount
            : Math.max(0, retailPrice - Number(customPricing.dealer_price || retailPrice));

        return {
            product_id: product.id,
            name: product.name,
            image_url: product.image_url || null,
            stock_qty: Number(product.stock_qty || 0),
            retail_price: retailPrice,
            mrp: product.mrp !== null ? Number(product.mrp) : null,
            dealer_price: Number(customPricing.dealer_price || retailPrice),
            margin_type: marginType,
            margin_value: marginValue,
            margin_amount: marginAmount,
            pricing_source: 'custom',
            has_custom_pricing: true,
        };
    }

    const fallbackMarginType = normalizeMarginType(fallbackRule?.margin_type);
    const fallbackMarginValue = fallbackRule?.margin_value !== null && fallbackRule?.margin_value !== undefined
        ? Number(fallbackRule.margin_value)
        : null;

    const fallbackResult = calculateDealerPrice(retailPrice, fallbackMarginType, fallbackMarginValue);

    return {
        product_id: product.id,
        name: product.name,
        image_url: product.image_url || null,
        stock_qty: Number(product.stock_qty || 0),
        retail_price: retailPrice,
        mrp: product.mrp !== null ? Number(product.mrp) : null,
        dealer_price: fallbackResult.dealerPrice,
        margin_type: fallbackMarginType,
        margin_value: fallbackMarginValue,
        margin_amount: fallbackResult.marginAmount,
        pricing_source: fallbackMarginType ? 'rule' : 'base',
        has_custom_pricing: false,
    };
};

const getDealerId = (rawId: number): number => Number(rawId);

export const DealerService = {
    async getMe(rawDealerId: number) {
        const dealerId = getDealerId(rawDealerId);
        await DealerModel.ensureProfile(dealerId);

        const profile = await DealerModel.getProfile(dealerId);
        if (!profile) {
            throw { type: 'AppError', message: 'Dealer profile not found', statusCode: 404 };
        }

        const latestKyc = await DealerModel.getLatestKyc(dealerId);
        const kycCounts = await DealerModel.getKycCounts(dealerId);
        const effectiveVerificationStatus =
            profile.verification_status === 'pending' && Number(kycCounts.total || 0) === 0
                ? 'unverified'
                : profile.verification_status;

        return {
            profile: {
                user_id: profile.user_id,
                full_name: profile.full_name,
                phone: profile.phone,
                verification_status: effectiveVerificationStatus,
                business_name: profile.business_name,
                gst_number: profile.gst_number,
                address_text: profile.address_text,
                base_lat: profile.base_lat,
                base_lng: profile.base_lng,
            },
            kyc: {
                verification_status: effectiveVerificationStatus,
                latest_document: latestKyc,
                counts: kycCounts,
            },
        };
    },

    async submitKyc(rawDealerId: number, payload: { docType?: string; fileUrls: string[] }) {
        const dealerId = getDealerId(rawDealerId);
        await DealerModel.ensureProfile(dealerId);

        if (!payload.fileUrls.length) {
            throw { type: 'AppError', message: 'At least one document is required', statusCode: 400 };
        }

        const normalizedDocType = normalizeKycDocType(payload.docType);
        await DealerModel.insertKycDocuments(
            dealerId,
            payload.fileUrls.map((fileUrl) => ({
                doc_type: normalizedDocType,
                file_url: fileUrl,
            }))
        );

        await DealerModel.setVerificationStatus(dealerId, 'pending');

        return {
            uploaded: payload.fileUrls.length,
            verification_status: 'pending',
        };
    },

    async patchStatus(
        rawDealerId: number,
        payload: {
            business_name?: string;
            gst_number?: string;
            address_text?: string;
            base_lat?: number;
            base_lng?: number;
        }
    ) {
        const dealerId = getDealerId(rawDealerId);
        await DealerModel.ensureProfile(dealerId);

        const normalizedPayload = {
            business_name: payload.business_name?.trim(),
            gst_number: payload.gst_number?.trim().toUpperCase(),
            address_text: payload.address_text?.trim(),
            base_lat: payload.base_lat,
            base_lng: payload.base_lng,
        };

        await DealerModel.updateProfile(dealerId, normalizedPayload);
        const profile = await DealerModel.getProfile(dealerId);
        const kycCounts = await DealerModel.getKycCounts(dealerId);
        const effectiveVerificationStatus =
            profile?.verification_status === 'pending' && Number(kycCounts.total || 0) === 0
                ? 'unverified'
                : profile?.verification_status;

        return {
            user_id: profile?.user_id,
            full_name: profile?.full_name || null,
            phone: profile?.phone || null,
            verification_status: effectiveVerificationStatus || 'unverified',
            business_name: profile?.business_name || null,
            gst_number: profile?.gst_number || null,
            address_text: profile?.address_text || null,
            base_lat: profile?.base_lat ?? null,
            base_lng: profile?.base_lng ?? null,
        };
    },

    async getPricingProducts(rawDealerId: number) {
        const dealerId = getDealerId(rawDealerId);
        await DealerModel.ensureProfile(dealerId);
        const profile = await DealerModel.getProfile(dealerId);

        if (!profile) {
            throw { type: 'AppError', message: 'Dealer profile not found', statusCode: 404 };
        }
        if (profile.verification_status !== 'approved') {
            throw { type: 'AppError', message: 'Dealer is not approved for pricing access', statusCode: 403 };
        }

        const [products, pricingRows, fallbackRule] = await Promise.all([
            DealerModel.getAllProductBasePricing(),
            DealerModel.getDealerProductPricingRows(dealerId),
            DealerModel.getDealerFallbackRule(dealerId),
        ]);

        const pricingMap = new Map<number, DealerProductPricingRow>();
        for (const row of pricingRows) {
            pricingMap.set(Number(row.product_id), row);
        }

        return {
            verification_status: profile.verification_status,
            fallback_rule: fallbackRule ? {
                margin_type: normalizeMarginType(fallbackRule.margin_type),
                margin_value: fallbackRule.margin_value !== null ? Number(fallbackRule.margin_value) : null,
            } : null,
            products: products.map((product) => {
                const customPricing = pricingMap.get(Number(product.id)) || null;
                return buildPricingRow(product, customPricing, fallbackRule);
            }),
        };
    },

    async getPricingByProductId(rawDealerId: number, productId: number) {
        const dealerId = getDealerId(rawDealerId);
        await DealerModel.ensureProfile(dealerId);
        const profile = await DealerModel.getProfile(dealerId);

        if (!profile) {
            throw { type: 'AppError', message: 'Dealer profile not found', statusCode: 404 };
        }
        if (profile.verification_status !== 'approved') {
            throw { type: 'AppError', message: 'Dealer is not approved for pricing access', statusCode: 403 };
        }

        const [product, customPricing, fallbackRule] = await Promise.all([
            DealerModel.getProductBasePricingById(productId),
            DealerModel.getDealerProductPricingByProductId(dealerId, productId),
            DealerModel.getDealerFallbackRule(dealerId),
        ]);

        if (!product) {
            throw { type: 'AppError', message: 'Product not found', statusCode: 404 };
        }

        return {
            verification_status: profile.verification_status,
            pricing: buildPricingRow(product, customPricing, fallbackRule),
        };
    },

    // Optional admin review helpers (no routes wired in current backend).
    async reviewDealerVerification(dealerId: number, status: 'approved' | 'rejected', reviewNotes?: string) {
        await DealerModel.reviewDealerVerification(dealerId, status, reviewNotes);
        return { dealer_id: dealerId, verification_status: status };
    },

    async reviewDealerKycDocument(
        dealerId: number,
        docId: number,
        status: 'approved' | 'rejected',
        reviewNotes?: string,
        reviewedBy?: number
    ) {
        await DealerModel.reviewDealerKycDocument(dealerId, docId, status, reviewNotes, reviewedBy);
        return { dealer_id: dealerId, doc_id: docId, status };
    },
};
