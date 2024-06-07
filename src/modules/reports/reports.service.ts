import { autoInjectable, inject, ValidationError } from "@structured-growth/microservice-sdk";
import ReportSequelize from "../../../database/models/report.sequelize";
import { ReportCreateBodyInterface } from "../../interfaces/report-create-body.interface";
import { ReportsRepository } from "./reports.repository";

@autoInjectable()
export class ReportsService {
	constructor(
		@inject("ReportsRepository") private reportRepository: ReportsRepository,
	) {}

}