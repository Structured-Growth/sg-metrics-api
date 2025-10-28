import { MetricCreateBodyInterface } from "../../../interfaces/metric-create-body.interface";
import { MetricUpdateBodyInterface } from "../../../interfaces/metric-update-body.interface";

type CreateMetricRequestBodyInterface = Omit<MetricCreateBodyInterface, "takenAtOffset">;
type UpdateMetricRequestBodyInterface = { id: string } & MetricUpdateBodyInterface;

type Create = {
	op: "create";
	data: CreateMetricRequestBodyInterface;
};

type Update = {
	op: "update";
	data: UpdateMetricRequestBodyInterface;
};

type Upsert = {
	op: "upsert";
	data: CreateMetricRequestBodyInterface;
};

type Delete = {
	op: "delete";
	data: {
		id: string;
	};
};

export type MetricsBulkDataInterface = (Create | Update | Upsert | Delete)[];
