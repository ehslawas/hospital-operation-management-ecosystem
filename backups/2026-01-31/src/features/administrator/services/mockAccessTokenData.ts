import { AccessToken, TokenUsageLog, UnauthorizedAccessAttempt, AccessControlRule, TokenStatistics } from '../types/AccessToken';

export const getAccessTokens = (): AccessToken[] => [];
export const getTokenUsageLogs = (): TokenUsageLog[] => [];
export const getUnauthorizedAccessAttempts = (): UnauthorizedAccessAttempt[] => [];
export const getAccessControlRules = (): AccessControlRule[] => [];
export const getTokenStatistics = (): TokenStatistics => ({
    totalActive: 0,
    totalExpired: 0,
    totalRevoked: 0,
    totalUsage24h: 0,
    totalUnauthorizedAttempts24h: 0,
    mostAccessedResource: 'None',
    highRiskAttempts: 0,
});
