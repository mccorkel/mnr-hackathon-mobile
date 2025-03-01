import { useFastenDomain as useContextFastenDomain } from '../app/_layout';

// Re-export the hook for easier imports
export function useFastenDomain() {
  return useContextFastenDomain();
} 