
type Command = () => Promise<void>

const queue: Command[] = []
let processing = false

async function process(){
  if(processing) return
  processing = true

  while(queue.length){
    const cmd = queue.shift()
    if(!cmd) continue

    try{
      await cmd()
    }catch(e){
      console.error("ASYNC_COMMAND_FAILED", e)
    }
  }

  processing = false
}

export function dispatchAsync(cmd: Command){
  queue.push(cmd)
  process()
}

