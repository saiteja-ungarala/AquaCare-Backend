import pool from '../config/db';
import { RowDataPacket } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { AgentModel } from '../models/agent.model';

const REFERRAL_CODE_REGEX = /^[A-Z0-9]{3,32}$/;

type CategoryValue = string | number | null;

interface CampaignRow extends RowDataPacket {
    id: number;
    name?: string;
    start_at: Date;
    end_at: Date;
    is_active: number;
}

interface CommissionRuleRow extends RowDataPacket {
    id: number;
    campaign_id: number | null;
    product_id: number | null;
    category_id: string | number | null;
    commission_type: 'flat' | 'percent';
    commission_value: number;
}

interface CommissionTierRow extends RowDataPacket {
    threshold_qty: number;
    bonus_amount: number;
}

interface OrderItemCommissionRow extends RowDataPacket {
    order_item_id: number;
    product_id: number;
    qty: number;
    unit_price: number;
    line_total: number;
    product_category: CategoryValue;
}

interface CategoryColumns {
    productCategoryColumn: 'category_id' | 'category' | null;
    ruleCategoryColumn: 'category_id' | 'category' | null;
}

let cachedCategoryColumns: CategoryColumns | null = null;

const toNumber = (value: unknown): number => {
    const numeric = Number(value || 0);
    return Number.isFinite(numeric) ? numeric : 0;
};

const buildStatusTotals = (rows: RowDataPacket[], amountField: string): Record<'pending' | 'approved' | 'paid', number> => {
    const totals = {
        pending: 0,
        approved: 0,
        paid: 0,
    };

    for (const row of rows) {
        const status = String(row.status || '').toLowerCase();
        if (status === 'pending' || status === 'approved' || status === 'paid') {
            totals[status] = toNumber(row[amountField]);
        }
    }

    return totals;
};

export const ReferralCommissionService = {
    normalizeReferralCode(input?: string | null): string | null {
        if (typeof input !== 'string') return null;
        const normalized = input.trim().toUpperCase();
        return normalized.length > 0 ? normalized : null;
    },

    isValidReferralCodeFormat(referralCode?: string | null): boolean {
        if (!referralCode) return false;
        return REFERRAL_CODE_REGEX.test(referralCode);
    },

    async findAgentIdByReferralCode(connection: PoolConnection, referralCode?: string | null): Promise<number | null> {
        if (!referralCode || !this.isValidReferralCodeFormat(referralCode)) {
            return null;
        }

        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT id
             FROM users
             WHERE referral_code = ? AND role = 'agent'
             LIMIT 1`,
            [referralCode]
        );

        if (rows.length === 0) {
            return null;
        }

        return Number(rows[0].id);
    },

    async generateCommissionsForOrder(connection: PoolConnection, params: { orderId: number; agentId: number | null }): Promise<void> {
        const { orderId, agentId } = params;
        if (!agentId) return;

        const activeCampaign = await this.getActiveCampaign(connection);
        const orderItems = await this.getOrderItemsForCommission(connection, orderId);

        if (orderItems.length === 0) {
            return;
        }

        for (const item of orderItems) {
            const matchedRule = await this.resolveCommissionRule(connection, {
                campaignId: activeCampaign?.id ?? null,
                productId: item.product_id,
                categoryValue: item.product_category,
            });

            const grossAmount = toNumber(item.line_total || toNumber(item.unit_price) * toNumber(item.qty));
            const commissionAmount = matchedRule
                ? this.calculateCommissionAmount(matchedRule.commission_type, toNumber(matchedRule.commission_value), toNumber(item.qty), toNumber(item.unit_price))
                : 0;

            const campaignIdForRow = matchedRule?.campaign_id ?? activeCampaign?.id ?? null;

            await connection.query(
                `INSERT INTO agent_commissions
                    (agent_id, order_id, order_item_id, product_id, qty, gross_amount, commission_amount, campaign_id, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                 ON DUPLICATE KEY UPDATE
                    gross_amount = VALUES(gross_amount),
                    commission_amount = VALUES(commission_amount),
                    campaign_id = VALUES(campaign_id),
                    status = VALUES(status)`,
                [
                    agentId,
                    orderId,
                    item.order_item_id,
                    item.product_id,
                    item.qty,
                    grossAmount,
                    commissionAmount,
                    campaignIdForRow,
                ]
            );
        }

        if (activeCampaign) {
            await this.applyTierBonuses(connection, {
                agentId,
                campaignId: activeCampaign.id,
                startAt: activeCampaign.start_at,
                endAt: activeCampaign.end_at,
            });
        }
    },

    async getAgentReferralCode(agentId: number): Promise<string> {
        return AgentModel.ensureReferralCode(agentId);
    },

    async getAgentEarningsSummary(agentId: number): Promise<any> {
        const connection = await pool.getConnection();
        try {
            const [commissionRows] = await connection.query<RowDataPacket[]>(
                `SELECT status, COALESCE(SUM(commission_amount), 0) AS total
                 FROM agent_commissions
                 WHERE agent_id = ?
                 GROUP BY status`,
                [agentId]
            );

            const [bonusRows] = await connection.query<RowDataPacket[]>(
                `SELECT status, COALESCE(SUM(bonus_amount), 0) AS total
                 FROM agent_commission_bonuses
                 WHERE agent_id = ?
                 GROUP BY status`,
                [agentId]
            );

            const commissionTotals = buildStatusTotals(commissionRows, 'total');
            const bonusTotals = buildStatusTotals(bonusRows, 'total');

            const combinedTotals = {
                pending: commissionTotals.pending + bonusTotals.pending,
                approved: commissionTotals.approved + bonusTotals.approved,
                paid: commissionTotals.paid + bonusTotals.paid,
            };

            const activeCampaign = await this.getActiveCampaign(connection);
            let campaignProgress: any = null;

            if (activeCampaign) {
                const progress = await this.getCampaignProgressInternal(connection, agentId, activeCampaign.id, activeCampaign);
                campaignProgress = {
                    campaign_id: activeCampaign.id,
                    sold_qty: progress.sold_qty,
                    next_threshold: progress.next_threshold,
                    bonuses_earned: progress.bonuses_earned,
                };
            }

            return {
                totals: {
                    commissions: commissionTotals,
                    bonuses: bonusTotals,
                    combined: combinedTotals,
                },
                campaign_progress: campaignProgress,
            };
        } finally {
            connection.release();
        }
    },

    async getActiveCampaignsWithTiers(): Promise<any[]> {
        const connection = await pool.getConnection();
        try {
            const [campaignRows] = await connection.query<RowDataPacket[]>(
                `SELECT id, start_at, end_at
                 FROM commission_campaigns
                 WHERE is_active = 1 AND start_at <= NOW() AND end_at >= NOW()
                 ORDER BY start_at ASC`
            );

            if (campaignRows.length === 0) {
                return [];
            }

            const campaignIds = campaignRows.map((row) => Number(row.id));
            const placeholders = campaignIds.map(() => '?').join(', ');

            const [tierRows] = await connection.query<RowDataPacket[]>(
                `SELECT campaign_id, threshold_qty, bonus_amount
                 FROM commission_tiers
                 WHERE campaign_id IN (${placeholders})
                 ORDER BY campaign_id ASC, threshold_qty ASC`,
                campaignIds
            );

            return campaignRows.map((campaign) => ({
                id: Number(campaign.id),
                name: campaign.name ? String(campaign.name) : `Campaign #${Number(campaign.id)}`,
                description: campaign.description ? String(campaign.description) : null,
                start_at: campaign.start_at,
                end_at: campaign.end_at,
                tiers: tierRows
                    .filter((tier) => Number(tier.campaign_id) === Number(campaign.id))
                    .map((tier) => ({
                        threshold_qty: Number(tier.threshold_qty),
                        bonus_amount: Number(tier.bonus_amount),
                    })),
            }));
        } finally {
            connection.release();
        }
    },

    async getProductsCommissionPreview(): Promise<any[]> {
        const connection = await pool.getConnection();
        try {
            const activeCampaign = await this.getActiveCampaign(connection);
            const categoryColumns = await this.getCategoryColumns(connection);
            const categorySelect = categoryColumns.productCategoryColumn
                ? `p.${categoryColumns.productCategoryColumn}`
                : 'NULL';

            const [productRows] = await connection.query<RowDataPacket[]>(
                `SELECT p.id, p.name, p.price, ${categorySelect} AS product_category
                 FROM products p
                 WHERE p.is_active = 1
                 ORDER BY p.id DESC`
            );

            const previews: any[] = [];
            for (const product of productRows) {
                const rule = await this.resolveCommissionRule(connection, {
                    campaignId: activeCampaign?.id ?? null,
                    productId: Number(product.id),
                    categoryValue: (product.product_category ?? null) as CategoryValue,
                });

                const amount = rule
                    ? this.calculateCommissionAmount(
                        rule.commission_type,
                        Number(rule.commission_value),
                        1,
                        Number(product.price || 0)
                    )
                    : 0;

                previews.push({
                    id: Number(product.id),
                    name: product.name,
                    price: Number(product.price || 0),
                    commission_preview: rule
                        ? {
                            type: rule.commission_type,
                            value: Number(rule.commission_value),
                            amount,
                            campaign_id: rule.campaign_id,
                        }
                        : null,
                });
            }

            return previews;
        } finally {
            connection.release();
        }
    },

    async getCampaignProgress(agentId: number, campaignId: number): Promise<any> {
        const connection = await pool.getConnection();
        try {
            const [campaignRows] = await connection.query<CampaignRow[]>(
                `SELECT id, start_at, end_at
                 FROM commission_campaigns
                 WHERE id = ?
                 LIMIT 1`,
                [campaignId]
            );

            if (campaignRows.length === 0) {
                throw { type: 'AppError', message: 'Campaign not found', statusCode: 404 };
            }

            return this.getCampaignProgressInternal(connection, agentId, campaignId, campaignRows[0]);
        } finally {
            connection.release();
        }
    },

    async getActiveCampaign(connection: PoolConnection): Promise<CampaignRow | null> {
        const [rows] = await connection.query<CampaignRow[]>(
            `SELECT id, start_at, end_at, is_active
             FROM commission_campaigns
             WHERE is_active = 1
               AND start_at <= NOW()
               AND end_at >= NOW()
             ORDER BY start_at ASC
             LIMIT 1`
        );

        return rows[0] || null;
    },

    calculateCommissionAmount(type: string, value: number, qty: number, unitPrice: number): number {
        const normalizedType = String(type || '').toLowerCase();
        const safeValue = toNumber(value);
        const safeQty = toNumber(qty);
        const safeUnitPrice = toNumber(unitPrice);

        if (normalizedType === 'flat') {
            return Number((safeValue * safeQty).toFixed(2));
        }

        if (normalizedType === 'percent') {
            return Number(((safeUnitPrice * safeQty * safeValue) / 100).toFixed(2));
        }

        return 0;
    },

    async getCategoryColumns(connection: PoolConnection): Promise<CategoryColumns> {
        if (cachedCategoryColumns) {
            return cachedCategoryColumns;
        }

        const [productColumns] = await connection.query<RowDataPacket[]>(`SHOW COLUMNS FROM products`);
        const [ruleColumns] = await connection.query<RowDataPacket[]>(`SHOW COLUMNS FROM commission_rules`);

        const productFieldSet = new Set(productColumns.map((row) => String(row.Field)));
        const ruleFieldSet = new Set(ruleColumns.map((row) => String(row.Field)));

        const productCategoryColumn: CategoryColumns['productCategoryColumn'] = productFieldSet.has('category_id')
            ? 'category_id'
            : productFieldSet.has('category')
                ? 'category'
                : null;

        const ruleCategoryColumn: CategoryColumns['ruleCategoryColumn'] = ruleFieldSet.has('category_id')
            ? 'category_id'
            : ruleFieldSet.has('category')
                ? 'category'
                : null;

        cachedCategoryColumns = {
            productCategoryColumn,
            ruleCategoryColumn,
        };

        return cachedCategoryColumns;
    },

    async getOrderItemsForCommission(connection: PoolConnection, orderId: number): Promise<OrderItemCommissionRow[]> {
        const categoryColumns = await this.getCategoryColumns(connection);
        const categorySelect = categoryColumns.productCategoryColumn
            ? `p.${categoryColumns.productCategoryColumn}`
            : 'NULL';

        const [rows] = await connection.query<OrderItemCommissionRow[]>(
            `SELECT
                oi.id AS order_item_id,
                oi.product_id,
                oi.qty,
                oi.unit_price,
                oi.line_total,
                ${categorySelect} AS product_category
             FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        return rows;
    },

    async resolveCommissionRule(connection: PoolConnection, params: {
        campaignId: number | null;
        productId: number;
        categoryValue: CategoryValue;
    }): Promise<CommissionRuleRow | null> {
        const { campaignId, productId, categoryValue } = params;
        const categoryColumns = await this.getCategoryColumns(connection);
        const ruleCategoryColumn = categoryColumns.ruleCategoryColumn;

        const selectRule = async (options: {
            campaignId: number | null;
            productId: number | null;
            categoryValue: CategoryValue;
        }): Promise<CommissionRuleRow | null> => {
            const conditions: string[] = [];
            const values: any[] = [];

            if (options.campaignId === null) {
                conditions.push('campaign_id IS NULL');
            } else {
                conditions.push('campaign_id = ?');
                values.push(options.campaignId);
            }

            if (options.productId === null) {
                conditions.push('product_id IS NULL');
            } else {
                conditions.push('product_id = ?');
                values.push(options.productId);
            }

            if (ruleCategoryColumn) {
                if (options.categoryValue === null || options.categoryValue === undefined || options.categoryValue === '') {
                    conditions.push(`${ruleCategoryColumn} IS NULL`);
                } else {
                    conditions.push(`${ruleCategoryColumn} = ?`);
                    values.push(options.categoryValue);
                }
            }

            const [rows] = await connection.query<CommissionRuleRow[]>(
                `SELECT id, campaign_id, product_id, commission_type, commission_value
                 FROM commission_rules
                 WHERE ${conditions.join(' AND ')}
                 ORDER BY id DESC
                 LIMIT 1`,
                values
            );

            return rows[0] || null;
        };

        if (campaignId !== null) {
            const campaignProductRule = await selectRule({ campaignId, productId, categoryValue: null });
            if (campaignProductRule) return campaignProductRule;

            if (ruleCategoryColumn && categoryValue !== null && categoryValue !== undefined && categoryValue !== '') {
                const campaignCategoryRule = await selectRule({ campaignId, productId: null, categoryValue });
                if (campaignCategoryRule) return campaignCategoryRule;
            }

            const campaignDefaultRule = await selectRule({ campaignId, productId: null, categoryValue: null });
            if (campaignDefaultRule) return campaignDefaultRule;
        }

        const globalProductRule = await selectRule({ campaignId: null, productId, categoryValue: null });
        if (globalProductRule) return globalProductRule;

        if (ruleCategoryColumn && categoryValue !== null && categoryValue !== undefined && categoryValue !== '') {
            const globalCategoryRule = await selectRule({ campaignId: null, productId: null, categoryValue });
            if (globalCategoryRule) return globalCategoryRule;
        }

        return selectRule({ campaignId: null, productId: null, categoryValue: null });
    },

    async applyTierBonuses(connection: PoolConnection, params: {
        agentId: number;
        campaignId: number;
        startAt: Date;
        endAt: Date;
    }): Promise<void> {
        const { agentId, campaignId, startAt, endAt } = params;

        const [soldRows] = await connection.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(qty), 0) AS sold_qty
             FROM agent_commissions
             WHERE agent_id = ?
               AND campaign_id = ?
               AND created_at BETWEEN ? AND ?`,
            [agentId, campaignId, startAt, endAt]
        );

        const soldQty = toNumber(soldRows[0]?.sold_qty);

        const [tierRows] = await connection.query<CommissionTierRow[]>(
            `SELECT threshold_qty, bonus_amount
             FROM commission_tiers
             WHERE campaign_id = ?
             ORDER BY threshold_qty ASC`,
            [campaignId]
        );

        for (const tier of tierRows) {
            const thresholdQty = toNumber(tier.threshold_qty);
            if (thresholdQty > soldQty) {
                continue;
            }

            await connection.query(
                `INSERT INTO agent_commission_bonuses
                    (agent_id, campaign_id, threshold_qty, bonus_amount, status)
                 VALUES (?, ?, ?, ?, 'pending')
                 ON DUPLICATE KEY UPDATE
                    agent_id = agent_id`,
                [agentId, campaignId, thresholdQty, toNumber(tier.bonus_amount)]
            );
        }
    },

    async getCampaignProgressInternal(connection: PoolConnection, agentId: number, campaignId: number, campaign: Pick<CampaignRow, 'start_at' | 'end_at'>): Promise<any> {
        const [soldRows] = await connection.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(qty), 0) AS sold_qty
             FROM agent_commissions
             WHERE agent_id = ?
               AND campaign_id = ?
               AND created_at BETWEEN ? AND ?`,
            [agentId, campaignId, campaign.start_at, campaign.end_at]
        );
        const soldQty = toNumber(soldRows[0]?.sold_qty);

        const [tierRows] = await connection.query<CommissionTierRow[]>(
            `SELECT threshold_qty, bonus_amount
             FROM commission_tiers
             WHERE campaign_id = ?
             ORDER BY threshold_qty ASC`,
            [campaignId]
        );

        const [bonusRows] = await connection.query<RowDataPacket[]>(
            `SELECT threshold_qty, bonus_amount
             FROM agent_commission_bonuses
             WHERE agent_id = ? AND campaign_id = ?`,
            [agentId, campaignId]
        );

        const reachedThresholds = tierRows
            .filter((tier) => toNumber(tier.threshold_qty) <= soldQty)
            .map((tier) => ({
                threshold_qty: toNumber(tier.threshold_qty),
                bonus_amount: toNumber(tier.bonus_amount),
            }));

        const nextTier = tierRows.find((tier) => toNumber(tier.threshold_qty) > soldQty);

        const bonusesEarned = bonusRows.reduce((sum, row) => sum + toNumber(row.bonus_amount), 0);

        return {
            sold_qty: soldQty,
            tiers_reached: reachedThresholds,
            next_threshold: nextTier ? toNumber(nextTier.threshold_qty) : null,
            remaining_to_next_threshold: nextTier ? Math.max(0, toNumber(nextTier.threshold_qty) - soldQty) : 0,
            bonuses_earned: bonusesEarned,
        };
    },
};
