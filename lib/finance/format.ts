export function normalizarNumero(valor: number | string | null | undefined): number {
  return Number(valor || 0);
}

export function formatarMoedaBRL(valor: number | string | null | undefined): string {
  return normalizarNumero(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}