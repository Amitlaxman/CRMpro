import { NormalizationService } from "./normalization.service"

export interface CRMLead {
  created_at?: string
  name: string
  email: string
  country_code: string
  mobile_without_country_code: string
  company: string
  city: string
  state: string
  country: string
  lead_owner: string
  crm_status: "GOOD_LEAD_FOLLOW_UP" | "DID_NOT_CONNECT" | "BAD_LEAD" | "SALE_DONE"
  crm_note: string
  data_source: string
  possession_time?: string
  description?: string
}

export class ValidationService {
  private static ALLOWED_KEYS = new Set([
    "created_at",
    "name",
    "email",
    "country_code",
    "mobile_without_country_code",
    "company",
    "city",
    "state",
    "country",
    "lead_owner",
    "crm_status",
    "crm_note",
    "data_source",
    "possession_time",
    "description",
  ])

  public static validateAndCleanLead(rawLead: any): { lead: CRMLead; warnings: string[]; errors: string[] } {
    const warnings: string[] = []
    const errors: string[] = []
    
    // Clean hallucinated fields
    const cleanedLead: any = {}
    Object.keys(rawLead).forEach((key) => {
      if (this.ALLOWED_KEYS.has(key)) {
        cleanedLead[key] = rawLead[key]
      }
    })

    // 1. Validate Name
    const name = (cleanedLead.name || "").toString().trim()
    if (!name) {
      errors.push("Missing required field: name")
    }

    // 2. Validate & Clean Email
    let email = (cleanedLead.email || "").toString().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
      warnings.push(`Malformed email format ignored: "${email}"`)
      email = ""
    }

    // 3. Normalize Phone
    const rawPhone = (cleanedLead.mobile_without_country_code || "").toString().trim()
    const parsedPhone = NormalizationService.parsePhone(rawPhone)
    const countryCode = cleanedLead.country_code || parsedPhone.countryCode
    const mobileDigits = parsedPhone.mobileNumber

    // 4. Validate Enums
    const crm_status = NormalizationService.normalizeStatus(cleanedLead.crm_status || "")
    const data_source = NormalizationService.normalizeSource(cleanedLead.data_source || "")

    // 5. Normalize Dates
    const created_at = cleanedLead.created_at ? NormalizationService.normalizeDate(cleanedLead.created_at) : new Date().toISOString()
    const possession_time = cleanedLead.possession_time ? NormalizationService.normalizeDate(cleanedLead.possession_time) : undefined

    const finalLead: CRMLead = {
      created_at,
      name,
      email,
      country_code: countryCode,
      mobile_without_country_code: mobileDigits,
      company: (cleanedLead.company || "").toString().trim(),
      city: (cleanedLead.city || "").toString().trim(),
      state: (cleanedLead.state || "").toString().trim(),
      country: (cleanedLead.country || "").toString().trim(),
      lead_owner: (cleanedLead.lead_owner || "").toString().trim(),
      crm_status,
      crm_note: (cleanedLead.crm_note || "").toString().trim(),
      data_source,
      possession_time,
      description: (cleanedLead.description || "").toString().trim(),
    }

    return {
      lead: finalLead,
      warnings,
      errors,
    }
  }
}
