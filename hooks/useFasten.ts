import { useFasten as useContextFasten } from '../app/_layout';

// Re-export the hook for easier imports
export function useFasten() {
  return useContextFasten();
} 