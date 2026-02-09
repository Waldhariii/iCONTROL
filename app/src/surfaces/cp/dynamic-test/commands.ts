import { useWriteGateway } from '@/platform/write-gateway/writeGateway';

export function usePageCommands() {
  const writeGateway = useWriteGateway();

  const handleTestAction = async () => {
    await writeGateway.execute({
      type: 'TEST_ACTION',
      payload: { message: 'Test' }
    });
    console.log('✅ Action via Write Gateway');
  };

  return { handleTestAction };
}
