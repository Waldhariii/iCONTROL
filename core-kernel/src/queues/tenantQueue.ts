
const tenantQueues = new Map<string, Promise<void>>()

export function enqueueTenant(
  tenant: string,
  task: () => Promise<void>
){
  const prev = tenantQueues.get(tenant) ?? Promise.resolve()

  const next = prev
    .catch(()=>{})
    .then(task)

  tenantQueues.set(tenant, next)
}

