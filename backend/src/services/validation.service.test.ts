import { ValidationService } from "./validation.service"

describe("ValidationService", () => {
  it("should validate and clean raw lead payloads", () => {
    const rawLead = {
      name: "John Doe",
      email: "john@example.com",
      mobile_without_country_code: "+91 9876543210",
      company: "Acme Corp",
      crm_status: "Won",
      data_source: "eden_park",
      hallucinated_field: "invalidValue",
    }

    const { lead, warnings, errors } = ValidationService.validateAndCleanLead(rawLead)

    expect(errors.length).toBe(0)
    expect(lead.name).toBe("John Doe")
    expect(lead.email).toBe("john@example.com")
    expect(lead.country_code).toBe("+91")
    expect(lead.mobile_without_country_code).toBe("9876543210")
    expect(lead.crm_status).toBe("SALE_DONE") // Normalized from Won
    expect(lead.data_source).toBe("eden_park")
    expect((lead as any).hallucinated_field).toBeUndefined() // Hallucination stripped
  })

  it("should detect invalid email structures", () => {
    const invalidEmailLead = {
      name: "Sarah Connor",
      email: "sarah.connor#gmail.com",
    }
    const { lead, warnings } = ValidationService.validateAndCleanLead(invalidEmailLead)
    expect(lead.email).toBe("")
    expect(warnings.length).toBe(1)
    expect(warnings[0]).toContain("Malformed email format")
  })
})
