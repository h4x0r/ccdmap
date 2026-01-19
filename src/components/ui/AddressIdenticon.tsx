'use client';

import Jazzicon from 'react-jazzicon';
import { useMemo } from 'react';

interface AddressIdenticonProps {
  address: string;
  diameter?: number;
  className?: string;
}

/**
 * Convert a Concordium account address to a numeric seed for Jazzicon
 * Uses a simple hash function to create a deterministic integer from the address
 */
function addressToSeed(address: string): number {
  if (!address) return 0;

  // Simple hash function (djb2 algorithm)
  let hash = 5381;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) + hash) + address.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Visual identicon component for Concordium account addresses
 * Generates a unique, deterministic colorful icon based on the address
 */
export function AddressIdenticon({
  address,
  diameter = 20,
  className
}: AddressIdenticonProps) {
  const seed = useMemo(() => addressToSeed(address), [address]);

  if (!address) {
    return null;
  }

  return (
    <span className={className} style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
      <Jazzicon diameter={diameter} seed={seed} />
    </span>
  );
}
