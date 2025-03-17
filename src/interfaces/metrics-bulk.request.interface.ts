import { MetricCreateBodyInterface } from "./metric-create-body.interface";
import { MetricUpdateBodyInterface } from "./metric-update-body.interface";

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

type Delete = {
	op: "delete";
	data: string;
};

export type MetricsBulkRequestInterface = (Create | Update | Delete)[];
