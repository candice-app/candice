export function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function ageSlice(dob: string): string | null {
  const age = calculateAge(dob);
  if (age === null) return null;
  if (age < 18) return "moins de 18 ans";
  if (age <= 25) return "18–25 ans";
  if (age <= 35) return "26–35 ans";
  if (age <= 45) return "36–45 ans";
  if (age <= 55) return "46–55 ans";
  if (age <= 65) return "56–65 ans";
  return "66 ans et plus";
}
