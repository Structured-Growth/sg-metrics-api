/**
 * 1. Generate 3600 metrics per day in range 2024-05-01 - 2024-05-14
 * 2. Split 50400 metrics into chunks by 500
 * 3. Send create requests in series
 * 4. Try to aggregate data with aggregation interval 1h
 * 4. Try to aggregate data with aggregation interval 6h
 * 4. Try to aggregate data with aggregation interval 30m
 * 4. Try to aggregate data with aggregation interval 1day
 *
 */
import { chunk } from "lodash";

const a =[1,2,3,5,6]
const chunks = chunk(a, 3);