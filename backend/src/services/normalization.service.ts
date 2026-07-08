export class NormalizationService {
  /**
   * Normalize date strings to ISO-8601 strings.
   */
  public static normalizeDate(dateStr: string): string {
    if (!dateStr || dateStr.trim() === "") return ""
    try {
      const parsed = Date.parse(dateStr)
      if (!isNaN(parsed)) {
        return new Date(parsed).toISOString()
      }
    } catch (_) {}
    return ""
  }

  /**
   * Parse phone number to extract country code and mobile digits.
   */
  public static parsePhone(phoneStr: string): { countryCode: string; mobileNumber: string } {
    if (!phoneStr || phoneStr.trim() === "") {
      return { countryCode: "", mobileNumber: "" }
    }

    // Strip spaces, dashes, hyphens, parentheses
    let cleaned = phoneStr.replace(/[\s\-\(\)\.]/g, "")

    let countryCode = ""
    let mobileNumber = cleaned

    // Check for explicit known prefixes
    if (cleaned.startsWith("+91")) {
      countryCode = "+91"
      mobileNumber = cleaned.slice(3)
    } else if (cleaned.startsWith("+1")) {
      countryCode = "+1"
      mobileNumber = cleaned.slice(2)
    } else if (cleaned.startsWith("+")) {
      // General country code check (+ followed by 1 to 2 digits)
      const match = cleaned.match(/^\+(\d{1,2})(\d+)$/)
      if (match) {
        countryCode = `+${match[1]}`
        mobileNumber = match[2]
      }
    } else if (cleaned.startsWith("00")) {
      const match = cleaned.match(/^00(\d{1,3})(\d+)$/)
      if (match) {
        countryCode = `+${match[1]}`
        mobileNumber = match[2]
      }
    } else if (cleaned.length > 10 && cleaned.startsWith("91")) {
      // Fallback for India 91 prefix
      countryCode = "+91"
      mobileNumber = cleaned.slice(2)
    }

    return {
      countryCode,
      mobileNumber,
    }
  }

  /**
   * Standardize custom status strings to match allowed CRM status enums.
   */
  public static normalizeStatus(status: string): "GOOD_LEAD_FOLLOW_UP" | "DID_NOT_CONNECT" | "BAD_LEAD" | "SALE_DONE" {
    const s = (status || "").toString().toUpperCase().trim()

    if (s.includes("SALE") || s.includes("WON") || s.includes("DONE") || s.includes("SUCCESS")) {
      return "SALE_DONE"
    }
    if (s.includes("NO") || s.includes("CONNECT") || s.includes("BUSY") || s.includes("UNREACH")) {
      return "DID_NOT_CONNECT"
    }
    if (s.includes("BAD") || s.includes("SPAM") || s.includes("JUNK") || s.includes("FAKE")) {
      return "BAD_LEAD"
    }

    return "GOOD_LEAD_FOLLOW_UP" // Default fallback
  }

  /**
   * Standardize custom source strings to match allowed CRM source enums.
   */
  public static normalizeSource(source: string): string {
    const s = (source || "").toString().toLowerCase().trim()

    const ALLOWED_SOURCES = ["leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots"]
    for (const allowed of ALLOWED_SOURCES) {
      if (s.includes(allowed.replace(/_/g, " ")) || s.includes(allowed)) {
        return allowed
      }
    }
    return ""
  }

  /**
   * Escape dangerous cell values to protect against CSV Injection.
   */
  public static escapeCSVInjection(value: string): string {
    if (!value) return ""
    const trimmed = value.trim()
    if (
      trimmed.startsWith("=") ||
      trimmed.startsWith("+") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("@")
    ) {
      return `'${trimmed}`
    }
    return value
  }
}
