import { PublicMetricAttributes } from "../controllers/v1/metric.controller";

export type MetricsBulkResponseInterface = (
	| {
			op: "create";
			data: PublicMetricAttributes;
	  }
	| {
			op: "update";
			data: PublicMetricAttributes;
	  }
	| {
			op: "upsert";
			data: PublicMetricAttributes;
	  }
	| {
			op: "delete";
			data: {
				id: PublicMetricAttributes["id"];
			};
	  }
)[];
