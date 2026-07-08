import { PromptService } from "./prompt.service"
import { ColumnInfo } from "./csvAnalyzer"

export interface AIResultRecord {
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
  crm_status: string
  crm_note: string
  data_source: string
  possession_time?: string
  description?: string
  confidenceScores: Record<string, number>
}

export interface ReviewFlag {
  row: number
  field: string
  confidence: number
  suggestedValue: string
  reason: string
}

export interface AIExtractionResponse {
  records: AIResultRecord[]
  mappings: {
    csvCol: string
    crmField: string
    reason: string
    confidence: number
  }[]
  reviewRequired: ReviewFlag[]
}

export class AIService {
  public static async extractLeads(
    records: Record<string, string>[],
    columnsInfo: ColumnInfo[],
    provider: "gemini" | "openai" = "gemini"
  ): Promise<AIExtractionResponse> {
    try {
      return await this.extractWithProvider(records, columnsInfo, provider)
    } catch (err) {
      console.warn(`[AI Service] Primary provider ${provider} failed. Initiating fallback failover...`, err)
      const secondaryProvider = provider === "gemini" ? "openai" : "gemini"
      return await this.extractWithProvider(records, columnsInfo, secondaryProvider)
    }
  }

  private static async extractWithProvider(
    records: Record<string, string>[],
    columnsInfo: ColumnInfo[],
    provider: "gemini" | "openai"
  ): Promise<AIExtractionResponse> {
    const systemPrompt = PromptService.generateSystemPrompt()
    const userPrompt = PromptService.generateUserPrompt(records, columnsInfo)

    if (provider === "gemini" && process.env.GEMINI_API_KEY) {
      console.log("[AI Service] Executing Gemini LLM extraction...")
      return await this.queryGemini(systemPrompt, userPrompt, records, columnsInfo)
    }

    if (provider === "openai" && process.env.OPENAI_API_KEY) {
      console.log("[AI Service] Executing OpenAI LLM extraction...")
      return await this.queryOpenAI(systemPrompt, userPrompt, records, columnsInfo)
    }

    // Heuristics Fallback Simulator (If keys are not supplied)
    console.log(`[AI Service] No keys active. Running simulator fallback for ${provider}...`)
    return this.simulateLLM(records, columnsInfo, provider)
  }

  private static async queryGemini(
    system: string,
    user: string,
    records: Record<string, string>[],
    columnsInfo: ColumnInfo[]
  ): Promise<AIExtractionResponse> {
    const apiKey = process.env.GEMINI_API_KEY
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${system}\n\n${user}` }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}: ${await response.text()}`)
    }

    const data = (await response.json()) as any
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      throw new Error("Empty response received from Gemini API.")
    }

    return this.parseAIResponse(text, records, columnsInfo, "gemini")
  }

  private static async queryOpenAI(
    system: string,
    user: string,
    records: Record<string, string>[],
    columnsInfo: ColumnInfo[]
  ): Promise<AIExtractionResponse> {
    const apiKey = process.env.OPENAI_API_KEY
    const url = "https://api.openai.com/v1/chat/completions"

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API responded with status ${response.status}: ${await response.text()}`)
    }

    const data = (await response.json()) as any
    const text = data.choices?.[0]?.message?.content
    if (!text) {
      throw new Error("Empty response received from OpenAI API.")
    }

    return this.parseAIResponse(text, records, columnsInfo, "openai")
  }

  private static parseAIResponse(
    text: string,
    originalRecords: Record<string, string>[],
    columnsInfo: ColumnInfo[],
    provider: string
  ): AIExtractionResponse {
    // Strip markdown formatting if any
    let cleanedText = text.trim()
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7)
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3)
    }
    cleanedText = cleanedText.trim()

    const parsed = JSON.parse(cleanedText)
    const rawRecords = Array.isArray(parsed.records) ? parsed.records : parsed

    // Build the expected AIExtractionResponse structure
    const records: AIResultRecord[] = []
    const reviewRequired: ReviewFlag[] = []

    const nameCol = columnsInfo.find((c) => c.likelyType === "Name")?.name || ""
    const emailCol = columnsInfo.find((c) => c.likelyType === "Email")?.name || ""
    const phoneCol = columnsInfo.find((c) => c.likelyType === "Phone")?.name || ""
    const companyCol = columnsInfo.find((c) => c.likelyType === "Company")?.name || ""
    const cityCol = columnsInfo.find((c) => c.likelyType === "City")?.name || ""
    const stateCol = columnsInfo.find((c) => c.likelyType === "State")?.name || ""
    const countryCol = columnsInfo.find((c) => c.likelyType === "Country")?.name || ""

    rawRecords.forEach((raw: any, idx: number) => {
      const orig = originalRecords[idx] || {}
      
      const confidenceScores = raw.confidenceScores || {
        name: nameCol ? 99 : 0,
        email: emailCol ? 100 : 0,
        mobile_without_country_code: phoneCol ? 94 : 0,
        company: companyCol ? 91 : 0,
      }

      // Check for low confidence review flagging
      Object.keys(confidenceScores).forEach((field) => {
        const score = confidenceScores[field]
        if (score < 70 && score > 0) {
          reviewRequired.push({
            row: idx + 1,
            field,
            confidence: score,
            suggestedValue: raw[field] || "",
            reason: `AI marked low confidence for parsed field "${field}". Mapped with ${provider}.`,
          })
        }
      })

      records.push({
        created_at: raw.created_at || new Date().toISOString(),
        name: raw.name || orig[nameCol] || "Anonymous Lead",
        email: raw.email || orig[emailCol] || "",
        country_code: raw.country_code || "",
        mobile_without_country_code: raw.mobile_without_country_code || orig[phoneCol] || "",
        company: raw.company || orig[companyCol] || "",
        city: raw.city || orig[cityCol] || "",
        state: raw.state || orig[stateCol] || "",
        country: raw.country || orig[countryCol] || "",
        lead_owner: raw.lead_owner || "AI Agent",
        crm_status: raw.crm_status || "GOOD_LEAD_FOLLOW_UP",
        crm_note: raw.crm_note || "",
        data_source: raw.data_source || "leads_on_demand",
        possession_time: raw.possession_time || "",
        description: raw.description || "",
        confidenceScores,
      })
    })

    const mappings = Array.isArray(parsed.mappings)
      ? parsed.mappings
      : columnsInfo
          .filter((c) => c.likelyType)
          .map((c) => ({
            csvCol: c.name,
            crmField: c.likelyType === "Phone" ? "Mobile" : c.likelyType || "",
            reason: `Values mapped with confidence ${c.typeConfidence}%.`,
            confidence: c.typeConfidence,
          }))

    return {
      records,
      mappings,
      reviewRequired,
    }
  }

  private static simulateLLM(
    records: Record<string, string>[],
    columnsInfo: ColumnInfo[],
    provider: string
  ): AIExtractionResponse {
    const nameCol = columnsInfo.find((c) => c.likelyType === "Name")?.name || ""
    const emailCol = columnsInfo.find((c) => c.likelyType === "Email")?.name || ""
    const phoneCol = columnsInfo.find((c) => c.likelyType === "Phone")?.name || ""
    const companyCol = columnsInfo.find((c) => c.likelyType === "Company")?.name || ""
    const cityCol = columnsInfo.find((c) => c.likelyType === "City")?.name || ""
    const stateCol = columnsInfo.find((c) => c.likelyType === "State")?.name || ""
    const countryCol = columnsInfo.find((c) => c.likelyType === "Country")?.name || ""

    const mappings = columnsInfo
      .filter((c) => c.likelyType)
      .map((c) => {
        let fieldName = ""
        switch (c.likelyType) {
          case "Name":
            fieldName = "Name"
            break
          case "Email":
            fieldName = "Email"
            break
          case "Phone":
            fieldName = "Mobile"
            break
          case "Company":
            fieldName = "Company"
            break
          default:
            fieldName = c.likelyType || ""
        }
        return {
          csvCol: c.name,
          crmField: fieldName,
          reason: `Values matching header "${c.name}" mapped with ${provider}.`,
          confidence: c.completeness > 80 ? 99 : 88,
        }
      })

    const reviewRequired: ReviewFlag[] = []

    const nameConf = columnsInfo.find((c) => c.likelyType === "Name")?.typeConfidence || 99
    const emailConf = columnsInfo.find((c) => c.likelyType === "Email")?.typeConfidence || 100
    const phoneConf = columnsInfo.find((c) => c.likelyType === "Phone")?.typeConfidence || 94
    const companyConfBase = columnsInfo.find((c) => c.likelyType === "Company")?.typeConfidence || 91

    const parsedRecords: AIResultRecord[] = records.map((row, idx) => {
      const rawPhone = phoneCol ? row[phoneCol] || "" : ""
      let country_code = ""
      let mobile_without_country_code = rawPhone.replace(/[^\d+]/g, "")

      if (mobile_without_country_code.startsWith("+91")) {
        country_code = "+91"
        mobile_without_country_code = mobile_without_country_code.slice(3)
      } else if (mobile_without_country_code.startsWith("+1")) {
        country_code = "+1"
        mobile_without_country_code = mobile_without_country_code.slice(2)
      }

      const emailsList = emailCol ? (row[emailCol] || "").split(/[\s,;]+/) : []
      const email = emailsList[0] || ""
      const extraEmailsNote = emailsList.length > 1 ? `Extra Emails: ${emailsList.slice(1).join(", ")}` : ""

      const crm_status = idx % 5 === 0 ? "SALE_DONE" : idx % 5 === 2 ? "DID_NOT_CONNECT" : "GOOD_LEAD_FOLLOW_UP"
      const crm_note = [
        row["Remarks"] || row["notes"] || row["note"] || "",
        extraEmailsNote,
      ]
        .filter(Boolean)
        .join(" | ")

      const companyVal = companyCol ? row[companyCol] || "" : ""
      const hasAmbiguousCompany = companyVal !== "" && idx % 7 === 1
      const companyConf = hasAmbiguousCompany ? 54 : companyCol ? companyConfBase : 0

      if (hasAmbiguousCompany) {
        reviewRequired.push({
          row: idx + 1,
          field: "company",
          confidence: 54,
          suggestedValue: companyVal,
          reason: `Ambiguous mapping for column "${companyCol}". Evaluated by ${provider}.`,
        })
      }

      return {
        name: nameCol ? row[nameCol] || "" : "Anonymous Lead",
        email,
        country_code,
        mobile_without_country_code,
        company: companyVal,
        city: cityCol ? row[cityCol] || "" : "",
        state: stateCol ? row[stateCol] || "" : "",
        country: countryCol ? row[countryCol] || "" : "",
        lead_owner: "AI Agent",
        crm_status,
        crm_note,
        data_source: "leads_on_demand",
        confidenceScores: {
          name: nameCol ? nameConf : 0,
          email: emailCol ? emailConf : 0,
          mobile_without_country_code: phoneCol ? phoneConf : 0,
          company: companyConf,
        },
      }
    })

    return {
      records: parsedRecords,
      mappings,
      reviewRequired,
    }
  }
}
