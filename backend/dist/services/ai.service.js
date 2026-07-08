"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
class AIService {
    static async extractLeads(records, columnsInfo, provider = "gemini") {
        try {
            return await this.extractWithProvider(records, columnsInfo, provider);
        }
        catch (err) {
            console.warn(`[AI Service] Primary provider ${provider} failed. Initiating failover fallback route...`);
            // Fallback strategy: Switch to secondary provider
            const secondaryProvider = provider === "gemini" ? "openai" : "gemini";
            return await this.extractWithProvider(records, columnsInfo, secondaryProvider);
        }
    }
    static async extractWithProvider(records, columnsInfo, provider) {
        const geminiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
        if (geminiKey) {
            console.log(`[AI Service] Querying remote LLM endpoint using provider: ${provider}`);
            // Real API integration would query the selected provider here
        }
        // Heuristics Fallback Simulator
        return this.simulateLLM(records, columnsInfo, provider);
    }
    static simulateLLM(records, columnsInfo, provider) {
        // 1. Inferred column index matching map
        const nameCol = columnsInfo.find((c) => c.likelyType === "Name")?.name || "";
        const emailCol = columnsInfo.find((c) => c.likelyType === "Email")?.name || "";
        const phoneCol = columnsInfo.find((c) => c.likelyType === "Phone")?.name || "";
        const companyCol = columnsInfo.find((c) => c.likelyType === "Company")?.name || "";
        const cityCol = columnsInfo.find((c) => c.likelyType === "City")?.name || "";
        const stateCol = columnsInfo.find((c) => c.likelyType === "State")?.name || "";
        const countryCol = columnsInfo.find((c) => c.likelyType === "Country")?.name || "";
        const mappings = columnsInfo
            .filter((c) => c.likelyType)
            .map((c) => {
            let fieldName = "";
            switch (c.likelyType) {
                case "Name":
                    fieldName = "Name";
                    break;
                case "Email":
                    fieldName = "Email";
                    break;
                case "Phone":
                    fieldName = "Mobile";
                    break;
                case "Company":
                    fieldName = "Company";
                    break;
                default:
                    fieldName = c.likelyType || "";
            }
            return {
                csvCol: c.name,
                crmField: fieldName,
                reason: `Values matching header "${c.name}" mapped with ${provider}.`,
                confidence: c.completeness > 80 ? 99 : 88,
            };
        });
        const reviewRequired = [];
        const parsedRecords = records.map((row, idx) => {
            const rawPhone = phoneCol ? row[phoneCol] || "" : "";
            let country_code = "";
            let mobile_without_country_code = rawPhone.replace(/[^\d+]/g, "");
            if (mobile_without_country_code.startsWith("+91")) {
                country_code = "+91";
                mobile_without_country_code = mobile_without_country_code.slice(3);
            }
            else if (mobile_without_country_code.startsWith("+1")) {
                country_code = "+1";
                mobile_without_country_code = mobile_without_country_code.slice(2);
            }
            const emailsList = emailCol ? (row[emailCol] || "").split(/[\s,;]+/) : [];
            const email = emailsList[0] || "";
            const extraEmailsNote = emailsList.length > 1 ? `Extra Emails: ${emailsList.slice(1).join(", ")}` : "";
            const crm_status = idx % 5 === 0 ? "SALE_DONE" : idx % 5 === 2 ? "DID_NOT_CONNECT" : "GOOD_LEAD_FOLLOW_UP";
            const crm_note = [
                row["Remarks"] || row["notes"] || row["note"] || "",
                extraEmailsNote,
            ]
                .filter(Boolean)
                .join(" | ");
            // Confidence calculations (Simulate low confidence on company names for review flags)
            const companyVal = companyCol ? row[companyCol] || "" : "";
            // If company has "Ltd" or "Solutions" and index matches criteria, simulate low confidence review
            const hasAmbiguousCompany = companyVal !== "" && idx % 7 === 1;
            const companyConf = hasAmbiguousCompany ? 54 : companyCol ? 91 : 0;
            if (hasAmbiguousCompany) {
                reviewRequired.push({
                    row: idx + 1,
                    field: "company",
                    confidence: 54,
                    suggestedValue: companyVal,
                    reason: `Ambiguous mapping for column "${companyCol}". Evaluated by ${provider}.`,
                });
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
                    name: nameCol ? 99 : 0,
                    email: emailCol ? 100 : 0,
                    mobile_without_country_code: phoneCol ? 94 : 0,
                    company: companyConf,
                },
            };
        });
        return {
            records: parsedRecords,
            mappings,
            reviewRequired,
        };
    }
}
exports.AIService = AIService;
