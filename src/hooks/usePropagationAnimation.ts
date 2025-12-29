import { useState, useCallback, useEffect, useRef } from 'react';
import {
  calculatePropagationWaves,
  getPropagationDelay,
  getWaveColor,
  type PropagationNode,
  type PropagationWave,
} from '@/lib/block-propagation';

export interface PropagationAnimationState {
  isAnimating: boolean;
  currentWave: number;
  activeNodeIds: Set<string>;
  activeEdgeKeys: Set<string>;
  waveColor: string;
}

interface UsePropagationAnimationProps {
  nodes: PropagationNode[];
  edges: { source: string; target: string }[];
}

export function usePropagationAnimation({ nodes, edges }: UsePropagationAnimationProps) {
  const [state, setState] = useState<PropagationAnimationState>({
    isAnimating: false,
    currentWave: -1,
    activeNodeIds: new Set(),
    activeEdgeKeys: new Set(),
    waveColor: '',
  });

  const wavesRef = useRef<PropagationWave[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startAnimation = useCallback((originId: string) => {
    // Cancel any existing animation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Calculate waves from origin
    const result = calculatePropagationWaves(nodes, edges, originId);
    wavesRef.current = result.waves;

    if (result.waves.length === 0) {
      return;
    }

    // Start animation
    setState({
      isAnimating: true,
      currentWave: 0,
      activeNodeIds: new Set(result.waves[0]?.nodeIds || []),
      activeEdgeKeys: new Set(),
      waveColor: getWaveColor(0),
    });

    // Schedule subsequent waves
    const animateNextWave = (waveIndex: number) => {
      if (waveIndex >= result.waves.length) {
        // Animation complete - hold for a moment then reset
        timeoutRef.current = setTimeout(() => {
          setState({
            isAnimating: false,
            currentWave: -1,
            activeNodeIds: new Set(),
            activeEdgeKeys: new Set(),
            waveColor: '',
          });
        }, 500);
        return;
      }

      const delay = getPropagationDelay(waveIndex);
      timeoutRef.current = setTimeout(() => {
        // Collect all active nodes up to this wave
        const activeNodes = new Set<string>();
        const activeEdges = new Set<string>();

        for (let i = 0; i <= waveIndex; i++) {
          const wave = result.waves[i];
          if (wave) {
            for (const nodeId of wave.nodeIds) {
              activeNodes.add(nodeId);
            }
          }
        }

        // Calculate active edges (edges between active nodes)
        for (const edge of edges) {
          if (activeNodes.has(edge.source) && activeNodes.has(edge.target)) {
            const [src, tgt] = [edge.source, edge.target].sort();
            activeEdges.add(`${src}-${tgt}`);
          }
        }

        setState({
          isAnimating: true,
          currentWave: waveIndex,
          activeNodeIds: activeNodes,
          activeEdgeKeys: activeEdges,
          waveColor: getWaveColor(waveIndex),
        });

        // Schedule next wave
        animateNextWave(waveIndex + 1);
      }, delay);
    };

    // Start from wave 1 (wave 0 is already shown)
    animateNextWave(1);
  }, [nodes, edges]);

  const stopAnimation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({
      isAnimating: false,
      currentWave: -1,
      activeNodeIds: new Set(),
      activeEdgeKeys: new Set(),
      waveColor: '',
    });
  }, []);

  return {
    ...state,
    startAnimation,
    stopAnimation,
  };
}
