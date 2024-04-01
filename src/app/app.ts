import {
	autoInjectable,
	inject,
	injectWithTransform,
	Logger,
	LoggerTransform,
	connectDatabase,
} from "@structured-growth/microservice-sdk";
import * as path from "path";
import { Sequelize } from "sequelize-typescript";
import * as dbConfig from "../../database/config/config.js";

@autoInjectable()
export class App {
	public ready: Promise<any>;
	private sequelize;

	constructor(
		@injectWithTransform("Logger", LoggerTransform, { module: "App" }) private logger?: Logger,
		@inject("stage") private stage?: string,
		@inject("logDbRequests") private logDbRequests?: boolean
	) {
		this.logger.info(`Initializing app in "${this.stage}" stage...`);
		const promises = [this.connectToDatabase()];
		this.ready = Promise.all(promises);
		this.ready.then(() => this.logger.info("App initialized"));
	}

	/**
	 * Returns all initialized models
	 */
	get models(): Sequelize["models"] {
		return this.sequelize.models;
	}

	/**
	 * Connect to a database and automatically initialize models
	 */
	protected async connectToDatabase() {
		const config = await dbConfig();
		this.sequelize = await connectDatabase(Sequelize, config, this.logDbRequests);
		this.sequelize.addModels([path.join(__dirname, "..", "..", "database", "models")]);
	}
}
