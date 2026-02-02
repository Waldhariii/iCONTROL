
type TenantId = string

interface Budget {
  maxWritesPerSecond: number
}

const budgets = new Map<TenantId, Budget>()
const counters = new Map<TenantId, number>()

export function configureTenantBudget(
  tenant: TenantId,
  budget: Budget
){
  budgets.set(tenant, budget)
}

export function guardWrite(tenant: TenantId){
  const budget = budgets.get(tenant) ?? { maxWritesPerSecond: 50 }
  const current = counters.get(tenant) ?? 0

  if(current >= budget.maxWritesPerSecond){
    throw new Error(
      `WRITE_PRESSURE_EXCEEDED tenant=${tenant}`
    )
  }

  counters.set(tenant, current + 1)

  setTimeout(()=>{
    counters.set(tenant, (counters.get(tenant) ?? 1) - 1)
  },1000)
}

