// Fields that contain sensitive information and should be redacted
const SENSITIVE_FIELDS = [
    "password",
    "confirmPassword",
    "currentPassword",
    "newPassword",
    "token",
    "apiKey",
    "secret",
    "accessToken",
    "refreshToken",
    "authorization",
];

/**
 * Recursively sanitizes an object by masking sensitive fields.
 * Sensitive fields are replaced with "[REDACTED]" to indicate
 * they were present but not logged for security reasons.
 *
 * @param obj - The object to sanitize
 * @returns A sanitized copy of the object with sensitive fields masked
 */
export function sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item));
    }

    if (typeof obj === "object") {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();
            // Check if the key (case-insensitive) matches any sensitive field
            if (
                SENSITIVE_FIELDS.some(
                    (field) => lowerKey === field.toLowerCase()
                )
            ) {
                sanitized[key] = "[REDACTED]";
            } else if (typeof value === "object") {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    return obj;
}

