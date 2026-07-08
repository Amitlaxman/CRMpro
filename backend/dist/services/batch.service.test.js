"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const batch_service_1 = require("./batch.service");
describe("BatchService", () => {
    it("should chunk records into correct batch sizes adaptively", () => {
        // 1. Short records -> Batch size 50
        const shortRecords = Array.from({ length: 120 }, () => ({ name: "A", email: "a@a.com" }));
        const shortBatches = batch_service_1.BatchService.createBatches(shortRecords);
        expect(shortBatches[0].length).toBe(50);
        expect(shortBatches.length).toBe(3);
        // 2. Medium records -> Batch size 30
        const mediumRecords = Array.from({ length: 80 }, () => ({
            name: "Johnathan Smithers",
            email: "jsmithers.verylong@companydomain.com",
            description: "Interested in real estate properties in Bangalore region",
        }));
        const mediumBatches = batch_service_1.BatchService.createBatches(mediumRecords);
        expect(mediumBatches[0].length).toBe(30);
        expect(mediumBatches.length).toBe(3);
        // 3. Long records -> Batch size 15
        const longRecords = Array.from({ length: 20 }, () => ({
            name: "Johnathan Smithers",
            email: "jsmithers.verylong@companydomain.com",
            description: "Interested in real estate properties in Bangalore region. Detailed lead tracking required. Client is looking for 3BHK flat in Eden Park block A. Require immediate callback. Follow up on Monday morning. Additional requirements include modular kitchen setup, double parking slot allocation, access control keys activation, top floor premium views, and payment plans customized to four quarterly milestones. High priority prospect from meridian tower campaign.",
        }));
        const longBatches = batch_service_1.BatchService.createBatches(longRecords);
        expect(longBatches[0].length).toBe(15);
        expect(longBatches.length).toBe(2);
    });
});
