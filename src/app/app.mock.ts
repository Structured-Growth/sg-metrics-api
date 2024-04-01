import {
	autoInjectable,
	inject,
	injectWithTransform,
	Logger,
	LoggerTransform,
} from "@structured-growth/microservice-sdk";
import * as path from "path";
import { Sequelize } from "sequelize-typescript";

@autoInjectable()
export class AppMock {
	public ready: Promise<any>;
	private sequelize;

	constructor(
		@injectWithTransform("Logger", LoggerTransform, { module: "App" }) private logger?: Logger,
		@inject("stage") private stage?: string,
		@inject("logDbRequests") private logDbRequests?: boolean
	) {
		this.logger.info(`Initializing mock app in "${this.stage}" stage...`);
		const promises = [this.connectToDatabase()];
		this.ready = Promise.all(promises);
		this.ready.then(() => this.logger.info("Mock app initialized"));
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
		try {
			this.sequelize = new Sequelize({ dialect: "postgres" });
			await this.sequelize.authenticate();
		} catch (e) {
			// should through error, it's ok
		}
		this.sequelize.addModels([path.join(__dirname, "..", "..", "database", "models")]);
	}
}
