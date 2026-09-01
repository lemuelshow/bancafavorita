export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Validação real de CPF (dígitos verificadores mod-11), rejeita sequências repetidas. */
export function isValidCpf(raw: string): boolean {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  function checkDigit(length: number): number {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += digits[i] * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  }

  return checkDigit(9) === digits[9] && checkDigit(10) === digits[10];
}

export function formatCpf(raw: string): string {
  const cpf = onlyDigits(raw).padEnd(11, " ").slice(0, 11);
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
}

export function isValidPhone(raw: string): boolean {
  const digits = onlyDigits(raw);
  return digits.length === 10 || digits.length === 11;
}
