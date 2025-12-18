import { CsvCompanyRecordValues } from "~/validation/companies";

export function deduplicateCompanies(
  records: CsvCompanyRecordValues[]
): Map<string, CsvCompanyRecordValues[]> {
  const companyMap = new Map<string, CsvCompanyRecordValues[]>();

  for (const record of records) {
    const normalizedName = record.company.toLowerCase().trim();
    if (!companyMap.has(normalizedName)) {
      companyMap.set(normalizedName, []);
    }
    companyMap.get(normalizedName)!.push(record);
  }

  return companyMap;
}
