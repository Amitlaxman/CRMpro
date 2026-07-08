import { ColumnInfo } from "./csvAnalyzer"

export class PromptService {
  public static generateSystemPrompt(): string {
    return `
You are an advanced CRM Data Extraction agent. Your task is to map and extract columns from arbitrary CSV records into the strict GrowEasy CRM schema.

GrowEasy CRM Target Schema:
- created_at: String (ISO 8601 formatted date: YYYY-MM-DDTHH:mm:ss.sssZ)
- name: String (Lead's full name. Ambiguous or missing values should combine first/last name columns)
- email: String (Primary email. Must validate email structure. If multiple emails exist, return first in "email" and append others in "crm_note")
- country_code: String (e.g. "+91" or "+1". Extracted from phone inputs)
- mobile_without_country_code: String (Phone number digits only, excluding country codes, spaces, or hyphens)
- company: String (Lead company or organization name)
- city: String (Lead city address)
- state: String (Lead state address)
- country: String (Lead country address)
- lead_owner: String (Mapped owner name or default to empty string)
- crm_status: Enum String. MUST only be one of the following allowed values:
    "GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE"
    Normalize similar or custom values to match these (e.g., "Won" -> "SALE_DONE", "No Response" -> "DID_NOT_CONNECT", "Hot Prospect" -> "GOOD_LEAD_FOLLOW_UP")
- crm_note: String (Any notes, additional emails/phones, or remarks mapped from the CSV)
- data_source: Enum String. MUST only be one of:
    "leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots"
    If uncertain, return empty string.
- possession_time: String (ISO 8601 formatted date if applicable)
- description: String (Combine extra fields not mapped else where)

Rules:
1. Return JSON output only. Do NOT wrap it in Markdown \`\`\`json tags, explanations, or introductory text.
2. Maintain row order. For each CSV record input, return a corresponding mapped object.
3. Phone parsing: Detect and strip spaces, hyphens, country codes like +91 or 0091. Place prefix in "country_code" and remainder in "mobile_without_country_code".
4. If a field is empty, missing, or uncertain, return an empty string "". Never hallucinate values.
`
  }

  public static generateUserPrompt(
    records: Record<string, string>[],
    columnsInfo: ColumnInfo[]
  ): string {
    // Inject headers heuristics context to guide mapping
    const contextLines = columnsInfo.map((c) => {
      const heuristic = c.likelyType ? ` (Likely ${c.likelyType})` : ""
      return `- Column "${c.name}": Completeness ${c.completeness}%${heuristic}, Example value: "${c.exampleValue || ""}"`
    })

    return `
CSV Database Context:
${contextLines.join("\n")}

CSV Records to Parse (JSON format):
${JSON.stringify(records, null, 2)}

Format your response as a strict JSON array of objects representing the mapped records.
`
  }
}
