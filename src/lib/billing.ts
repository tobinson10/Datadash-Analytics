export type BillingCurrency = 'USD' | 'NGN'
export type BillingInterval = 'monthly' | 'annually'
export type PaidPlanKey =
  | 'starter_monthly_usd'
  | 'starter_annual_usd'
  | 'pro_monthly_usd'
  | 'pro_annual_usd'
  | 'starter_monthly_ngn'
  | 'starter_annual_ngn'
  | 'pro_monthly_ngn'
  | 'pro_annual_ngn'

export type PaidPlan = {
  key: PaidPlanKey
  tier: 'Starter' | 'Pro'
  interval: BillingInterval
  currency: BillingCurrency
  amount: number
  label: string
  detail: string
}

export const paidPlans: Record<PaidPlanKey, PaidPlan> = {
  starter_monthly_usd: { key: 'starter_monthly_usd', tier: 'Starter', interval: 'monthly', currency: 'USD', amount: 5, label: '$5', detail: 'per month' },
  starter_annual_usd: { key: 'starter_annual_usd', tier: 'Starter', interval: 'annually', currency: 'USD', amount: 50, label: '$50', detail: 'per year — two months free' },
  pro_monthly_usd: { key: 'pro_monthly_usd', tier: 'Pro', interval: 'monthly', currency: 'USD', amount: 12, label: '$12', detail: 'per month' },
  pro_annual_usd: { key: 'pro_annual_usd', tier: 'Pro', interval: 'annually', currency: 'USD', amount: 120, label: '$120', detail: 'per year — two months free' },
  starter_monthly_ngn: { key: 'starter_monthly_ngn', tier: 'Starter', interval: 'monthly', currency: 'NGN', amount: 8000, label: '₦8,000', detail: 'per month' },
  starter_annual_ngn: { key: 'starter_annual_ngn', tier: 'Starter', interval: 'annually', currency: 'NGN', amount: 80000, label: '₦80,000', detail: 'per year — two months free' },
  pro_monthly_ngn: { key: 'pro_monthly_ngn', tier: 'Pro', interval: 'monthly', currency: 'NGN', amount: 20000, label: '₦20,000', detail: 'per month' },
  pro_annual_ngn: { key: 'pro_annual_ngn', tier: 'Pro', interval: 'annually', currency: 'NGN', amount: 200000, label: '₦200,000', detail: 'per year — two months free' },
}

export const isPaidPlanKey = (value: unknown): value is PaidPlanKey =>
  typeof value === 'string' && value in paidPlans

export const planEnvName: Record<PaidPlanKey, string> = {
  starter_monthly_usd: 'PAYSTACK_PLAN_STARTER_MONTHLY_USD',
  starter_annual_usd: 'PAYSTACK_PLAN_STARTER_ANNUAL_USD',
  pro_monthly_usd: 'PAYSTACK_PLAN_PRO_MONTHLY_USD',
  pro_annual_usd: 'PAYSTACK_PLAN_PRO_ANNUAL_USD',
  starter_monthly_ngn: 'PAYSTACK_PLAN_STARTER_MONTHLY_NGN',
  starter_annual_ngn: 'PAYSTACK_PLAN_STARTER_ANNUAL_NGN',
  pro_monthly_ngn: 'PAYSTACK_PLAN_PRO_MONTHLY_NGN',
  pro_annual_ngn: 'PAYSTACK_PLAN_PRO_ANNUAL_NGN',
}
