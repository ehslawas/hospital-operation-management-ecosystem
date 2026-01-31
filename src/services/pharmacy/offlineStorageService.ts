/**
 * Offline Storage Service
 * Handles persistence of data when the user is offline using localStorage.
 * Acts as a temporary "Outbox" for requests that need to be synced.
 */

const STORAGE_KEYS = {
    CYLINDER_ISSUE_QUEUE: 'HOME_OFFLINE_CYLINDER_ISSUE_QUEUE',
    CYLINDER_REQUEST_QUEUE: 'HOME_OFFLINE_CYLINDER_REQUEST_QUEUE'
};

export interface OfflineIssueItem {
    id: string; // Unique ID for the local queue item
    timestamp: number;
    payload: {
        request_id?: string;
        department_id: string;
        issued_by: string;
        issued_at: string;
        cylinders: string[]; // List of QR codes
        requester_name: string;
        issuer_name: string;
    };
    meta: {
        dept_name: string; // For display purposes in offline UI
    };
}

// --- Cylinder Issuance Queue ---

export const getOfflineIssueQueue = (): OfflineIssueItem[] => {
    try {
        const json = localStorage.getItem(STORAGE_KEYS.CYLINDER_ISSUE_QUEUE);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error('Failed to parse offline issue queue', e);
        return [];
    }
};

export const addToOfflineIssueQueue = (item: Omit<OfflineIssueItem, 'id' | 'timestamp'>) => {
    const queue = getOfflineIssueQueue();
    const newItem: OfflineIssueItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: Date.now()
    };
    queue.push(newItem);
    localStorage.setItem(STORAGE_KEYS.CYLINDER_ISSUE_QUEUE, JSON.stringify(queue));
    return newItem;
};

export const removeFromOfflineIssueQueue = (id: string) => {
    const queue = getOfflineIssueQueue();
    const filtered = queue.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.CYLINDER_ISSUE_QUEUE, JSON.stringify(filtered));
};

export const clearOfflineIssueQueue = () => {
    localStorage.removeItem(STORAGE_KEYS.CYLINDER_ISSUE_QUEUE);
};

// --- Generic Helpers ---

export const hasPendingOfflineItems = (): boolean => {
    return getOfflineIssueQueue().length > 0;
};
