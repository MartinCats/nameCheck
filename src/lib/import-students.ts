export type ImportedStudent = {
  number: number;
  fullName: string;
};

export type ImportResult = {
  students: ImportedStudent[];
  errors: string[];
};

export function parseStudentText(input: string): ImportResult {
  const errors: string[] = [];
  const seenNumbers = new Set<number>();
  const seenNames = new Set<string>();

  const students = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(/^(\d+)[\s,.\-\t]+(.+)$/);
      const number = match ? Number(match[1]) : index + 1;
      const fullName = (match ? match[2] : line).trim();

      if (!fullName) {
        errors.push(`แถว ${index + 1}: ไม่มีชื่อนักเรียน`);
      }
      if (seenNumbers.has(number)) {
        errors.push(`เลขที่ ${number} ซ้ำในรายการนำเข้า`);
      }
      if (seenNames.has(fullName.toLowerCase())) {
        errors.push(`ชื่อ ${fullName} ซ้ำในรายการนำเข้า`);
      }

      seenNumbers.add(number);
      seenNames.add(fullName.toLowerCase());
      return { number, fullName };
    });

  return { students, errors };
}
