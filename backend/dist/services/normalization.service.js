"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NormalizationService = void 0;
class NormalizationService {
    /**
     * Normalize date strings to ISO-8601 strings.
     */
    static normalizeDate(dateStr) {
        if (!dateStr || dateStr.trim() === "")
            return "";
        try {
            const parsed = Date.parse(dateStr);
            if (!isNaN(parsed)) {
                return new Date(parsed).toISOString();
            }
        }
        catch (_) { }
        return "";
    }
    /**
     * Parse phone number to extract country code and mobile digits.
     */
    static parsePhone(phoneStr) {
        if (!phoneStr || phoneStr.trim() === "") {
            return { countryCode: "", mobileNumber: "" };
        }
        // Strip spaces, dashes, hyphens, parentheses
        let cleaned = phoneStr.replace(/[\s\-\(\)\.]/g, "");
        let countryCode = "";
        let mobileNumber = cleaned;
        // Check for +91 or +1 or 0091 prefixes
        if (cleaned.startsWith("+")) {
            // Basic country code check (+ followed by 1 to 3 digits)
            const match = cleaned.match(/^\+(\d{1,3})(\d+)$/);
            if (match) {
                countryCode = `+${match[1]}`;
                mobileNumber = match[2];
            }
        }
        else if (cleaned.startsWith("00")) {
            const match = cleaned.match(/^00(\d{1,3})(\d+)$/);
            if (match) {
                countryCode = `+${match[1]}`;
                mobileNumber = match[2];
            }
        }
        else if (cleaned.length > 10 && cleaned.startsWith("91")) {
            // Fallback for India 91 prefix
            countryCode = "+91";
            mobileNumber = cleaned.slice(2);
        }
        return {
            countryCode,
            mobileNumber,
        };
    }
    /**
     * Standardize custom status strings to match allowed CRM status enums.
     */
    static normalizeStatus(status) {
        const s = (status || "").toString().toUpperCase().trim();
        if (s.includes("SALE") || s.includes("WON") || s.includes("DONE") || s.includes("SUCCESS")) {
            return "SALE_DONE";
        }
        if (s.includes("NO") || s.includes("CONNECT") || s.includes("BUSY") || s.includes("UNREACH")) {
            return "DID_NOT_CONNECT";
        }
        if (s.includes("BAD") || s.includes("SPAM") || s.includes("JUNK") || s.includes("FAKE")) {
            return "BAD_LEAD";
        }
        return "GOOD_LEAD_FOLLOW_UP"; // Default fallback
    }
    /**
     * Standardize custom source strings to match allowed CRM source enums.
     */
    static normalizeSource(source) {
        const s = (source || "").toString().toLowerCase().trim();
        const ALLOWED_SOURCES = ["leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots"];
        for (const allowed of ALLOWED_SOURCES) {
            if (s.includes(allowed.replace(/_/g, " ")) || s.includes(allowed)) {
                return allowed;
            }
        }
        return "";
    }
}
exports.NormalizationService = NormalizationService;
