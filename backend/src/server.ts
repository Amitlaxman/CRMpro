import app from "./app"
import { validateEnv } from "./config/env.validator"

// Assert env specifications
validateEnv()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`[Server] CRMpro AI CSV Importer backend running on http://localhost:${PORT}`)
})
