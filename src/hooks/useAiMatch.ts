'use client';

import { useMutation } from '@tanstack/react-query';
import { aiService } from '@/services/ai.service';

export function useAiMatch() {
  return useMutation({ mutationFn: (description: string) => aiService.match(description) });
}
