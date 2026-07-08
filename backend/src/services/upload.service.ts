import fs from "fs"
import path from "path"

export class UploadService {
  private static uploadDir = path.join(process.cwd(), "uploads")

  public static ensureUploadDirectoryExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }
  }

  public static deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath)
      } catch (err) {
        console.error(`Failed to delete temporary file: ${filePath}`, err)
      }
    }
  }
}
