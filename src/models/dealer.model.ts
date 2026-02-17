import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

const tableExistsCache = new Map<string, boolean>();
const tableColumnsCache = new Map<string, Set<string>>();

export interface DealerProfileRow extends RowDataPacket {
    user_id: number;
    verification_status: string;
    business_name: string | null;
    gst_number: string | null;
    address_text: string | null;
    base_lat: number | null;
    base_lng: number | null;
    full_name: string;
    phone: string | null;
}

export interface DealerKycDocumentInput {
    doc_type: string;
    file_url: string;
}

export interface DealerProductPricingRow extends RowDataPacket {
    dealer_id: number;
    product_id: number;
    dealer_price: number;
    margin_type: 'flat' | 'percent' | null;
    margin_value: number | null;
}

export interface DealerPricingRuleRow extends RowDataPacket {
    dealer_id?: number | null;
    product_id?: number | null;
    category_id?: number | null;
    margin_type: 'flat' | 'percent' | null;
    margin_value: number | null;
}

export interface ProductBasePricingRow extends RowDataPacket {
    id: number;
    name: string;
    price: number;
    mrp: number | null;
    image_url: string | null;
    stock_qty: number;
}

export const DealerModel = {
    async hasTable(tableName: string): Promise<boolean> {
        if (tableExistsCache.has(tableName)) {
            return Boolean(tableExistsCache.get(tableName));
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS total
             FROM information_schema.tables
             WHERE table_schema = DATABASE()
               AND table_name = ?`,
            [tableName]
        );

        const exists = Number(rows[0]?.total || 0) > 0;
        tableExistsCache.set(tableName, exists);
        return exists;
    },

    async ensureProfile(userId: number): Promise<void> {
        await pool.query(
            `INSERT INTO dealer_profiles (user_id, verification_status)
             VALUES (?, 'pending')
             ON DUPLICATE KEY UPDATE user_id = user_id`,
            [userId]
        );
    },

    async getTableColumns(tableName: string): Promise<Set<string>> {
        const cached = tableColumnsCache.get(tableName);
        if (cached) {
            return cached;
        }

        const [rows] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM ${tableName}`);
        const columns = new Set(rows.map((row) => String(row.Field)));
        tableColumnsCache.set(tableName, columns);
        return columns;
    },

    async ensureKycDocumentsTable(): Promise<boolean> {
        const alreadyExists = await this.hasTable('dealer_kyc_documents');
        if (alreadyExists) {
            return true;
        }

        try {
            await pool.query(
                `CREATE TABLE IF NOT EXISTS dealer_kyc_documents (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    dealer_id INT NOT NULL,
                    doc_type VARCHAR(50) NOT NULL,
                    file_url VARCHAR(500) NOT NULL,
                    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
                    review_notes TEXT NULL,
                    reviewed_by INT NULL,
                    reviewed_at DATETIME NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_dealer_kyc_dealer_id (dealer_id),
                    INDEX idx_dealer_kyc_status (status),
                    CONSTRAINT fk_dealer_kyc_dealer
                        FOREIGN KEY (dealer_id) REFERENCES users(id) ON DELETE CASCADE,
                    CONSTRAINT fk_dealer_kyc_reviewer
                        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
                )`
            );

            tableExistsCache.set('dealer_kyc_documents', true);
            return true;
        } catch (error) {
            tableExistsCache.set('dealer_kyc_documents', false);
            return false;
        }
    },

    async getProfile(userId: number): Promise<DealerProfileRow | null> {
        const [rows] = await pool.query<DealerProfileRow[]>(
            `SELECT dp.*, u.full_name, u.phone
             FROM dealer_profiles dp
             JOIN users u ON u.id = dp.user_id
             WHERE dp.user_id = ?`,
            [userId]
        );
        return rows[0] || null;
    },

    async updateProfile(
        userId: number,
        payload: {
            business_name?: string;
            gst_number?: string;
            address_text?: string;
            base_lat?: number;
            base_lng?: number;
        }
    ): Promise<void> {
        const updateEntries = Object.entries(payload).filter(([, value]) => value !== undefined);
        if (updateEntries.length === 0) return;

        const fields = updateEntries.map(([key]) => `${key} = ?`).join(', ');
        const values = updateEntries.map(([, value]) => value);

        await pool.query(
            `UPDATE dealer_profiles
             SET ${fields}
             WHERE user_id = ?`,
            [...values, userId]
        );
    },

    async getLatestKyc(userId: number): Promise<RowDataPacket | null> {
        const hasKycTable = await this.ensureKycDocumentsTable();
        if (!hasKycTable) {
            return null;
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, doc_type, file_url, status, review_notes, reviewed_by, reviewed_at
             FROM dealer_kyc_documents
             WHERE dealer_id = ?
             ORDER BY id DESC
             LIMIT 1`,
            [userId]
        );
        return rows[0] || null;
    },

    async getKycCounts(userId: number): Promise<Record<string, number>> {
        const counts: Record<string, number> = {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
        };

        const hasKycTable = await this.ensureKycDocumentsTable();
        if (!hasKycTable) {
            return counts;
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT status, COUNT(*) as total
             FROM dealer_kyc_documents
             WHERE dealer_id = ?
             GROUP BY status`,
            [userId]
        );

        for (const row of rows) {
            const status = String(row.status || '').toLowerCase();
            const total = Number(row.total || 0);
            counts[status] = (counts[status] || 0) + total;
            counts.total += total;
        }
        return counts;
    },

    async insertKycDocuments(userId: number, documents: DealerKycDocumentInput[]): Promise<void> {
        if (documents.length === 0) return;

        const hasKycTable = await this.ensureKycDocumentsTable();
        if (!hasKycTable) {
            throw {
                type: 'AppError',
                message: 'Dealer KYC table is missing. Please run dealer KYC migrations.',
                statusCode: 500,
            };
        }

        const values = documents.map((doc) => [userId, doc.doc_type, doc.file_url, 'pending']);
        await pool.query(
            `INSERT INTO dealer_kyc_documents (dealer_id, doc_type, file_url, status) VALUES ?`,
            [values]
        );
    },

    async setVerificationStatus(userId: number, status: string): Promise<void> {
        await pool.query(
            `UPDATE dealer_profiles SET verification_status = ? WHERE user_id = ?`,
            [status, userId]
        );
    },

    async hasDealerPricingRulesTable(): Promise<boolean> {
        return this.hasTable('dealer_pricing_rules');
    },

    async getDealerFallbackRule(userId: number): Promise<DealerPricingRuleRow | null> {
        const hasTable = await this.hasDealerPricingRulesTable();
        if (!hasTable) return null;

        const columns = await this.getTableColumns('dealer_pricing_rules');
        let rows: DealerPricingRuleRow[] = [];

        if (columns.has('dealer_id')) {
            const whereActive = columns.has('is_active') ? ' AND is_active = 1' : '';
            const [result] = await pool.query<DealerPricingRuleRow[]>(
                `SELECT dealer_id, margin_type, margin_value
                 FROM dealer_pricing_rules
                 WHERE dealer_id = ?${whereActive}
                 ORDER BY id DESC
                 LIMIT 1`,
                [userId]
            );
            rows = result;
        } else {
            const whereActive = columns.has('is_active') ? ' AND is_active = 1' : '';
            const hasProduct = columns.has('product_id');
            const hasCategory = columns.has('category_id');
            const nullProduct = hasProduct ? 'product_id IS NULL' : '1=1';
            const nullCategory = hasCategory ? 'category_id IS NULL' : '1=1';
            const [result] = await pool.query<DealerPricingRuleRow[]>(
                `SELECT margin_type, margin_value
                 FROM dealer_pricing_rules
                 WHERE ${nullProduct} AND ${nullCategory}${whereActive}
                 ORDER BY id DESC
                 LIMIT 1`
            );
            rows = result;
        }

        return rows[0] || null;
    },

    async getDealerProductPricingRows(userId: number): Promise<DealerProductPricingRow[]> {
        const hasPricingTable = await this.hasTable('dealer_product_pricing');
        if (!hasPricingTable) {
            return [];
        }

        const columns = await this.getTableColumns('dealer_product_pricing');
        const whereActive = columns.has('is_active') ? ' AND is_active = 1' : '';
        const [rows] = await pool.query<DealerProductPricingRow[]>(
            `SELECT dealer_id, product_id, dealer_price, margin_type, margin_value
             FROM dealer_product_pricing
             WHERE dealer_id = ?${whereActive}`,
            [userId]
        );
        return rows;
    },

    async getAllProductBasePricing(): Promise<ProductBasePricingRow[]> {
        const [rows] = await pool.query<ProductBasePricingRow[]>(
            `SELECT id, name, price, mrp, image_url, stock_qty
             FROM products
             WHERE is_active = 1
             ORDER BY created_at DESC`
        );
        return rows;
    },

    async getProductBasePricingById(productId: number): Promise<ProductBasePricingRow | null> {
        const [rows] = await pool.query<ProductBasePricingRow[]>(
            `SELECT id, name, price, mrp, image_url, stock_qty
             FROM products
             WHERE id = ? AND is_active = 1`,
            [productId]
        );
        return rows[0] || null;
    },

    async getDealerProductPricingByProductId(userId: number, productId: number): Promise<DealerProductPricingRow | null> {
        const hasPricingTable = await this.hasTable('dealer_product_pricing');
        if (!hasPricingTable) {
            return null;
        }

        const columns = await this.getTableColumns('dealer_product_pricing');
        const whereActive = columns.has('is_active') ? ' AND is_active = 1' : '';
        const [rows] = await pool.query<DealerProductPricingRow[]>(
            `SELECT dealer_id, product_id, dealer_price, margin_type, margin_value
             FROM dealer_product_pricing
             WHERE dealer_id = ? AND product_id = ?${whereActive}
             LIMIT 1`,
            [userId, productId]
        );
        return rows[0] || null;
    },

    async reviewDealerVerification(
        dealerId: number,
        status: 'approved' | 'rejected',
        reviewNotes?: string
    ): Promise<void> {
        await pool.query(
            `UPDATE dealer_profiles
             SET verification_status = ?
             WHERE user_id = ?`,
            [status, dealerId]
        );

        if (reviewNotes) {
            const hasKycTable = await this.ensureKycDocumentsTable();
            if (!hasKycTable) {
                return;
            }

            await pool.query(
                `UPDATE dealer_kyc_documents
                 SET review_notes = ?, reviewed_at = NOW()
                 WHERE dealer_id = ? AND status = 'pending'`,
                [reviewNotes, dealerId]
            );
        }
    },

    async reviewDealerKycDocument(
        dealerId: number,
        docId: number,
        status: 'approved' | 'rejected',
        reviewNotes?: string,
        reviewedBy?: number
    ): Promise<void> {
        const hasKycTable = await this.ensureKycDocumentsTable();
        if (!hasKycTable) {
            throw {
                type: 'AppError',
                message: 'Dealer KYC table is missing. Please run dealer KYC migrations.',
                statusCode: 500,
            };
        }

        await pool.query(
            `UPDATE dealer_kyc_documents
             SET status = ?, review_notes = ?, reviewed_by = ?, reviewed_at = NOW()
             WHERE id = ? AND dealer_id = ?`,
            [status, reviewNotes || null, reviewedBy || null, docId, dealerId]
        );
    },
};
