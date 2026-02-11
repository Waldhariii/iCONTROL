
interface Circuit {
  failures: number
  open: boolean
}

const circuits = new Map<string, Circuit>()

export async function withCircuit<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T>{

  const c = circuits.get(key) ?? { failures:0, open:false }

  if(c.open){
    throw new Error(`CIRCUIT_OPEN ${key}`)
  }

  try{
    const result = await fn()
    c.failures = 0
    circuits.set(key,c)
    return result

  }catch(e){

    c.failures++

    if(c.failures > 5){
      c.open = true
      setTimeout(()=>{
        c.open = false
        c.failures = 0
      },10000)
    }

    circuits.set(key,c)
    throw e
  }
}

