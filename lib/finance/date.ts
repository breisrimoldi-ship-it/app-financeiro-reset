export function getMesAtualISO(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

export function getHojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}