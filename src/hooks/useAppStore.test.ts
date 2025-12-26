import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      selectedNodeId: null,
      currentView: 'topology',
      isPanelOpen: false,
      isDeepDiveOpen: false,
    });
  });

  describe('selectedNodeId', () => {
    it('starts with null', () => {
      expect(useAppStore.getState().selectedNodeId).toBeNull();
    });

    it('selectNode sets the selected node ID', () => {
      useAppStore.getState().selectNode('node-123');

      expect(useAppStore.getState().selectedNodeId).toBe('node-123');
    });

    it('selectNode with null clears selection', () => {
      useAppStore.getState().selectNode('node-123');
      useAppStore.getState().selectNode(null);

      expect(useAppStore.getState().selectedNodeId).toBeNull();
    });

    it('selecting a node opens the panel', () => {
      useAppStore.getState().selectNode('node-123');

      expect(useAppStore.getState().isPanelOpen).toBe(true);
    });

    it('deselecting closes the panel', () => {
      useAppStore.getState().selectNode('node-123');
      useAppStore.getState().selectNode(null);

      expect(useAppStore.getState().isPanelOpen).toBe(false);
    });
  });

  describe('currentView', () => {
    it('starts with topology view', () => {
      expect(useAppStore.getState().currentView).toBe('topology');
    });

    it('setView changes the current view', () => {
      useAppStore.getState().setView('geographic');

      expect(useAppStore.getState().currentView).toBe('geographic');
    });

    it('setView to topology works', () => {
      useAppStore.getState().setView('geographic');
      useAppStore.getState().setView('topology');

      expect(useAppStore.getState().currentView).toBe('topology');
    });
  });

  describe('isPanelOpen', () => {
    it('starts closed', () => {
      expect(useAppStore.getState().isPanelOpen).toBe(false);
    });

    it('togglePanel opens when closed', () => {
      useAppStore.getState().togglePanel();

      expect(useAppStore.getState().isPanelOpen).toBe(true);
    });

    it('togglePanel closes when open', () => {
      useAppStore.getState().togglePanel();
      useAppStore.getState().togglePanel();

      expect(useAppStore.getState().isPanelOpen).toBe(false);
    });

    it('closePanel closes the panel', () => {
      useAppStore.getState().togglePanel(); // Open
      useAppStore.getState().closePanel();

      expect(useAppStore.getState().isPanelOpen).toBe(false);
    });

    it('closePanel clears selection', () => {
      useAppStore.getState().selectNode('node-123');
      useAppStore.getState().closePanel();

      expect(useAppStore.getState().selectedNodeId).toBeNull();
    });
  });

  describe('isDeepDiveOpen', () => {
    it('starts closed', () => {
      expect(useAppStore.getState().isDeepDiveOpen).toBe(false);
    });

    it('openDeepDive opens the deep dive panel', () => {
      useAppStore.getState().selectNode('node-123');
      useAppStore.getState().openDeepDive();

      expect(useAppStore.getState().isDeepDiveOpen).toBe(true);
    });

    it('closeDeepDive closes the deep dive panel', () => {
      useAppStore.getState().selectNode('node-123');
      useAppStore.getState().openDeepDive();
      useAppStore.getState().closeDeepDive();

      expect(useAppStore.getState().isDeepDiveOpen).toBe(false);
    });

    it('closeDeepDive keeps node selected', () => {
      useAppStore.getState().selectNode('node-123');
      useAppStore.getState().openDeepDive();
      useAppStore.getState().closeDeepDive();

      expect(useAppStore.getState().selectedNodeId).toBe('node-123');
    });

    it('closePanel also closes deep dive', () => {
      useAppStore.getState().selectNode('node-123');
      useAppStore.getState().openDeepDive();
      useAppStore.getState().closePanel();

      expect(useAppStore.getState().isDeepDiveOpen).toBe(false);
    });

    it('selecting a different node closes deep dive', () => {
      useAppStore.getState().selectNode('node-123');
      useAppStore.getState().openDeepDive();
      useAppStore.getState().selectNode('node-456');

      expect(useAppStore.getState().isDeepDiveOpen).toBe(false);
      expect(useAppStore.getState().selectedNodeId).toBe('node-456');
    });

    it('deselecting node closes deep dive', () => {
      useAppStore.getState().selectNode('node-123');
      useAppStore.getState().openDeepDive();
      useAppStore.getState().selectNode(null);

      expect(useAppStore.getState().isDeepDiveOpen).toBe(false);
    });
  });
});
