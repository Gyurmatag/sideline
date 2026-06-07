import { describe, it, expect } from "vitest";
import { rowsToObjects, type SqlStatement } from "../src/stdb-http";

describe("rowsToObjects", () => {
  it("maps positional rows to keyed objects using the schema", () => {
    const stmt: SqlStatement = {
      schema: {
        elements: [{ name: { some: "id" } }, { name: { some: "status" } }],
      },
      rows: [
        [1, "resolved"],
        [2, "open"],
      ],
    };
    expect(rowsToObjects(stmt)).toEqual([
      { id: 1, status: "resolved" },
      { id: 2, status: "open" },
    ]);
  });

  it("falls back to colN for unnamed columns", () => {
    const stmt: SqlStatement = {
      schema: { elements: [{ name: {} }] },
      rows: [["x"]],
    };
    expect(rowsToObjects(stmt)).toEqual([{ col0: "x" }]);
  });
});
