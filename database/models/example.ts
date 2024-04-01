import { Column, Model, Table } from "sequelize-typescript";
import { Optional } from "sequelize";
import { container, RegionEnum, DefaultModelInterface } from "@structured-growth/microservice-sdk";

export interface ExampleAttributes extends DefaultModelInterface {
	status: string;
}

export interface ExampleCreationAttributes extends Optional<ExampleAttributes, "id"> {}

@Table({
	tableName: "example",
	timestamps: true,
	underscored: true,
})
export class Example extends Model<ExampleAttributes, ExampleCreationAttributes> implements ExampleAttributes {
	@Column
	accountId: number;

	@Column
	orgId: number;

	@Column
	region: RegionEnum;

	@Column
	status: string;

	static get arnPattern(): string {
		return [container.resolve("appPrefix"), '<region>', '<orgId>', '<accountId>', `examples/<exampleId>`].join(":");
	}

	get arn(): string {
		return [container.resolve("appPrefix"), this.region, this.orgId, this.accountId, `examples/${this.id}`].join(":");
	}
}

export default Example;
