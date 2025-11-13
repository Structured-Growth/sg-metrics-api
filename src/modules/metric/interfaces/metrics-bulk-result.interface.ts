import Metric from "../../../../database/models/metric";

export type MetricsBulkResultInterface = (
	| {
			op: "create";
			data: Metric;
	  }
	| {
			op: "update";
			data: Metric;
	  }
	| {
			op: "upsert";
			data: Metric;
	  }
	| {
			op: "delete";
			data: {
				id: Metric["id"];
				deleted: boolean;
			};
	  }
)[];
