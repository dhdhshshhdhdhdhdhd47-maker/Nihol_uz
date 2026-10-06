/**
 * Utility function to handle export of JSON state data or custom rows into a structured CSV file.
 * Handles cell escaping for double quotes, commas, and newlines.
 * Includes the Byte Order Mark (BOM) to support correct character rendering (e.g. Uzbek Cyrillic/Latin characters) in MS Excel.
 */

export interface CSVColumnMapping<T> {
  key: keyof T | string;
  header: string;
  transform?: (value: any, item: T) => string;
}

/**
 * Exports JSON data to a CSV file.
 * 
 * @param data Array of objects representing rows.
 * @param columns Optional column configuration for mapping and formatting keys.
 * @param filename File name for the downloaded file.
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: CSVColumnMapping<T>[] | string[],
  filename: string
): void {
  if (!data || data.length === 0) {
    console.warn("No data provided for CSV export.");
    return;
  }

  let headers: string[] = [];
  let keys: string[] = [];
  let transforms: Record<string, (value: any, item: T) => string> = {};

  if (columns && columns.length > 0) {
    if (typeof columns[0] === "string") {
      // Simple array of keys
      keys = columns as string[];
      headers = columns as string[];
    } else {
      // Column mappings with potential header titles and transformers
      const mappings = columns as CSVColumnMapping<T>[];
      keys = mappings.map(col => col.key as string);
      headers = mappings.map(col => col.header);
      mappings.forEach(col => {
        if (col.transform) {
          transforms[col.key as string] = col.transform;
        }
      });
    }
  } else {
    // Default to extracting keys from the first object
    keys = Object.keys(data[0]);
    headers = keys;
  }

  // Format header row
  const headerRow = headers.map(h => escapeCSVCell(h)).join(",");

  // Format data rows
  const dataRows = data.map(item => {
    return keys.map(key => {
      const rawValue = item[key];
      let valueStr = "";

      if (transforms[key]) {
        valueStr = transforms[key](rawValue, item);
      } else if (rawValue === null || rawValue === undefined) {
        valueStr = "";
      } else if (typeof rawValue === "object") {
        valueStr = JSON.stringify(rawValue);
      } else {
        valueStr = String(rawValue);
      }

      return escapeCSVCell(valueStr);
    }).join(",");
  });

  // Combine headers and rows
  const csvContent = [headerRow, ...dataRows].join("\n");

  // Include UTF-8 Byte Order Mark (BOM) for Excel
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Download trigger
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escapes a cell value for CSV standards:
 * - Wrap value in double quotes if it contains commas, double quotes, or newlines.
 * - Escape internal double quotes by doubling them (" -> "").
 */
function escapeCSVCell(value: string): string {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
