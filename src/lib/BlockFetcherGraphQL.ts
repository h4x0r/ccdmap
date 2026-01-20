/**
 * BlockFetcherGraphQL - Fetches block data from CCDScan GraphQL API
 *
 * Uses CCDScan's GraphQL API instead of gRPC for better compatibility
 * with Vercel serverless functions. gRPC connections often fail due to
 * cold starts and connection timeout issues in serverless environments.
 */

import type { BlockInfo } from './db/BlockTracker';

export interface BlockFetcherOptions {
  timeout?: number;
}

export type ExtendedBlockInfo = BlockInfo;

export interface FetchBlocksResult {
  blocks: ExtendedBlockInfo[];
  latestHeight: number;
  fromHeight: number;
  errors: string[];
}

const DEFAULT_TIMEOUT = 15000;
const MAX_BLOCKS_PER_FETCH = 100;

// CCDScan GraphQL API endpoint (discovered from ccdscan.io)
const CCDSCAN_GRAPHQL_URL = 'https://api-ccdscan-fungy.mainnet.concordium.software/api/graphql';

interface GraphQLBlockNode {
  blockHash: string;
  blockHeight: number;
  bakerId: number | null;
  transactionCount: number;
  blockSlotTime: string;
}

interface GraphQLBlocksResponse {
  data?: {
    blocks: {
      nodes: GraphQLBlockNode[];
      pageInfo: {
        hasNextPage?: boolean;
        hasPreviousPage?: boolean;
        startCursor?: string;
        endCursor?: string;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

export class BlockFetcherGraphQL {
  private timeout: number;

  constructor(options?: BlockFetcherOptions) {
    this.timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  }

  /**
   * Execute a GraphQL query against CCDScan API
   */
  private async executeQuery<T>(query: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(CCDSCAN_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get the latest block height from CCDScan
   */
  async getLatestBlockHeight(): Promise<number | null> {
    try {
      const query = `{ blocks(first: 1) { nodes { blockHeight } } }`;
      const result = await this.executeQuery<GraphQLBlocksResponse>(query);

      if (result.errors?.length) {
        console.error('[BlockFetcherGraphQL] GraphQL errors:', result.errors);
        return null;
      }

      const nodes = result.data?.blocks?.nodes;
      if (!nodes || nodes.length === 0) {
        return null;
      }

      return nodes[0].blockHeight;
    } catch (error) {
      console.error('[BlockFetcherGraphQL] Failed to get latest block height:', error);
      return null;
    }
  }

  /**
   * Convert GraphQL block node to BlockInfo
   */
  private nodeToBlockInfo(node: GraphQLBlockNode): ExtendedBlockInfo | null {
    // Skip blocks without baker (genesis, special blocks)
    if (node.bakerId === null || node.bakerId === undefined) {
      return null;
    }

    return {
      height: node.blockHeight,
      hash: node.blockHash,
      bakerId: node.bakerId,
      timestamp: new Date(node.blockSlotTime).getTime(),
      transactionCount: node.transactionCount,
    };
  }

  /**
   * Fetch blocks newer than a given height
   * Uses `last` + `before` to get blocks with height > fromHeight
   */
  async fetchBlocksSince(fromHeight: number): Promise<FetchBlocksResult> {
    const errors: string[] = [];

    try {
      // Get latest height first
      const latestHeight = await this.getLatestBlockHeight();
      if (latestHeight === null) {
        return {
          blocks: [],
          latestHeight: fromHeight,
          fromHeight,
          errors: ['Failed to get latest block height from CCDScan'],
        };
      }

      // If no new blocks, return empty
      if (latestHeight <= fromHeight) {
        return {
          blocks: [],
          latestHeight,
          fromHeight,
          errors: [],
        };
      }

      // Calculate how many blocks to fetch
      const blocksToFetch = Math.min(latestHeight - fromHeight, MAX_BLOCKS_PER_FETCH);

      // Fetch blocks newer than fromHeight
      // Using `last: N, before: "HEIGHT"` gets N blocks with height > HEIGHT
      const query = `{
        blocks(last: ${blocksToFetch}, before: "${fromHeight}") {
          nodes {
            blockHash
            blockHeight
            bakerId
            transactionCount
            blockSlotTime
          }
        }
      }`;

      const result = await this.executeQuery<GraphQLBlocksResponse>(query);

      if (result.errors?.length) {
        console.error('[BlockFetcherGraphQL] GraphQL errors:', result.errors);
        errors.push(...result.errors.map(e => e.message));
      }

      const nodes = result.data?.blocks?.nodes ?? [];
      const blocks: ExtendedBlockInfo[] = [];

      for (const node of nodes) {
        const block = this.nodeToBlockInfo(node);
        if (block) {
          blocks.push(block);
        }
      }

      // Check if we hit the limit
      if (latestHeight - fromHeight > MAX_BLOCKS_PER_FETCH) {
        errors.push(`Limited to ${MAX_BLOCKS_PER_FETCH} blocks. More blocks available.`);
      }

      return {
        blocks,
        latestHeight,
        fromHeight: fromHeight + 1,
        errors,
      };
    } catch (error) {
      console.error('[BlockFetcherGraphQL] Failed to fetch blocks:', error);
      return {
        blocks: [],
        latestHeight: fromHeight,
        fromHeight,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}

/**
 * Create a BlockFetcherGraphQL for Concordium mainnet
 */
export function createMainnetBlockFetcherGraphQL(options?: BlockFetcherOptions): BlockFetcherGraphQL {
  return new BlockFetcherGraphQL(options);
}
