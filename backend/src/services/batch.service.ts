export class BatchService {
  /**
   * Chunks records adaptively depending on estimated row sizes.
   */
  public static createBatches<T>(records: T[], defaultSize?: number): T[][] {
    let batchSize = defaultSize || parseInt(process.env.MAX_BATCH_SIZE || "25", 10)

    if (records.length > 0 && !defaultSize) {
      // Calculate average character size of each record JSON structure
      const totalCharLength = records.reduce((sum, r) => sum + JSON.stringify(r).length, 0)
      const avgRowSize = totalCharLength / records.length

      if (avgRowSize < 120) {
        batchSize = 50 // Short rows
        console.log(`[Batch Service] Selected Adaptive Batch Size: 50 (Avg Row size: ${Math.round(avgRowSize)} chars)`)
      } else if (avgRowSize < 350) {
        batchSize = 30 // Medium rows
        console.log(`[Batch Service] Selected Adaptive Batch Size: 30 (Avg Row size: ${Math.round(avgRowSize)} chars)`)
      } else {
        batchSize = 15 // Very long rows / descriptions
        console.log(`[Batch Service] Selected Adaptive Batch Size: 15 (Avg Row size: ${Math.round(avgRowSize)} chars)`)
      }
    }

    const batches: T[][] = []
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize))
    }

    return batches
  }
}
