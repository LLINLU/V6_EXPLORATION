import { pgEnum } from "drizzle-orm/pg-core"

export const axisType = pgEnum("axis_type", [
	"Root",
	"Scenario",
	"Purpose",
	"Function",
	"Measure",
	"Measure2",
	"Measure3",
	"Measure4",
	"Measure5",
	"Measure6",
	"Measure7",
	"Technology",
	"How1",
	"How2",
	"How3",
	"How4",
	"How5",
	"How6",
	"How7",
])
