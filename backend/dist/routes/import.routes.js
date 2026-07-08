"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_middleware_1 = require("../middleware/upload.middleware");
const import_controller_1 = require("../controllers/import.controller");
const router = (0, express_1.Router)();
router.post("/upload", upload_middleware_1.uploadMiddleware.single("file"), import_controller_1.ImportController.uploadCSV);
router.get("/stream", import_controller_1.ImportController.streamImport);
exports.default = router;
