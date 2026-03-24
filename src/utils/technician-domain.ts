export const LEGACY_AGENT_ROLE = 'agent' as const;
export const TECHNICIAN_ROLE = 'technician' as const;

export const normalizeRoleValue = (role?: string | null): string => {
    const normalized = String(role || '').trim().toLowerCase();
    if (!normalized) return '';
    return normalized === LEGACY_AGENT_ROLE ? TECHNICIAN_ROLE : normalized;
};

export const isTechnicianRole = (role?: string | null): boolean => {
    return normalizeRoleValue(role) === TECHNICIAN_ROLE;
};

export const rolesMatch = (actualRole?: string | null, expectedRole?: string | null): boolean => {
    const normalizedActual = normalizeRoleValue(actualRole);
    const normalizedExpected = normalizeRoleValue(expectedRole);
    return normalizedActual.length > 0 && normalizedActual === normalizedExpected;
};

export const buildRoleCondition = (
    columnName: string,
    role?: string | null
): { clause: string; params: string[] } | null => {
    const normalizedRole = normalizeRoleValue(role);
    if (!normalizedRole) {
        return null;
    }

    return {
        clause: `${columnName} = ?`,
        params: [normalizedRole],
    };
};

export const getCompatibleTechnicianId = (input: Record<string, any> | null | undefined): number | null => {
    const rawValue = input?.technician_id ?? input?.agent_id;
    if (rawValue === undefined || rawValue === null || rawValue === '') {
        return null;
    }

    const technicianId = Number(rawValue);
    return Number.isFinite(technicianId) && technicianId > 0 ? technicianId : null;
};
