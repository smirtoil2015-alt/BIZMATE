export interface FinancialTransaction {
  id: string;
  organizationId: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  description?: string;
  occurredAt: string;
  status: 'pending' | 'posted' | 'void';
}

export function financialSummary(transactions: FinancialTransaction[]) {
  const posted = transactions.filter((item) => item.status === 'posted');
  const income = posted.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = posted.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  return { income, expenses, net: income - expenses };
}
