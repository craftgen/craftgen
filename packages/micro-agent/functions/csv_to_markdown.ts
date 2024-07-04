import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

/**
 * Function to convert CSV data to a Markdown table.
 * @param csvData - The CSV data as a string.
 * @returns The Markdown table as a string.
 */
function csvToMarkdown(csvData: string): string {
  const rows = csvData.trim().split("\n");
  const headers = rows[0].split(",");
  const table = [];

  console.log("CSV Rows:", rows);
  console.log("CSV Headers:", headers);

  // Create the header row
  table.push(`| ${headers.join(" | ")} |`);
  table.push(`|${headers.map(() => "---").join("|")}|`);

  // Create the data rows
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].split(",");
    table.push(`| ${cells.join(" | ")} |`);
  }

  const result = table.join("\n");
  console.log("Markdown Table:", result);
  return result;
}

/**
 * Function to convert TOML data to a Markdown table.
 * @param tomlData - The TOML data as a string.
 * @returns The Markdown table as a string.
 */
function tomlToMarkdown(tomlData: string): string {
  const lines = tomlData.trim().split("\n");
  const table = [];
  const headers = [];
  const rows = [];

  console.log("TOML Lines:", lines);

  for (const line of lines) {
    if (line.includes("=")) {
      const [key, value] = line.split("=").map((part) => part.trim());
      headers.push(key);
      rows.push(value);
    }
  }

  console.log("TOML Headers:", headers);
  console.log("TOML Rows:", rows);

  // Create the header row
  table.push(`| ${headers.join(" | ")} |`);
  table.push(`|${headers.map(() => "---").join("|")}|`);

  // Create the data row
  table.push(`| ${rows.join(" | ")} |`);

  const result = table.join("\n");
  console.log("Markdown Table:", result);
  return result;
}

Deno.test({
  name: "can convert CSV to Markdown table",
  fn: () => {
    const csvData = `name,age,city\nAlice,30,New York\nBob,25,Los Angeles`;
    const expectedMarkdown = `| name | age | city |
|---|---|---|
| Alice | 30 | New York |
| Bob | 25 | Los Angeles |`;
    assertEquals(csvToMarkdown(csvData), expectedMarkdown);
  },
});

Deno.test({
  name: "handles empty CSV",
  fn: () => {
    const csvData = ``;
    const expectedMarkdown = `|  |
|---|`;
    assertEquals(csvToMarkdown(csvData), expectedMarkdown);
  },
});

Deno.test({
  name: "handles CSV with only headers",
  fn: () => {
    const csvData = `name,age,city`;
    const expectedMarkdown = `| name | age | city |
|---|---|---|`;
    assertEquals(csvToMarkdown(csvData), expectedMarkdown);
  },
});

Deno.test({
  name: "can convert TOML to Markdown table",
  fn: () => {
    const tomlData = `name = "Alice"\nage = 30\ncity = "New York"`;
    const expectedMarkdown = `| name | age | city |
|---|---|---|
| "Alice" | 30 | "New York" |`;
    assertEquals(tomlToMarkdown(tomlData), expectedMarkdown);
  },
});

Deno.test({
  name: "handles empty TOML",
  fn: () => {
    const tomlData = ``;
    const expectedMarkdown = `|  |
|---|`;
    assertEquals(tomlToMarkdown(tomlData), expectedMarkdown);
  },
});
