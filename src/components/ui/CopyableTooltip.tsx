'use client';

import { useState, useRef, useEffect } from 'react';

interface CopyableTooltipProps {
  value: string;
  displayValue: string;
  className?: string;
}

export function CopyableTooltip({ value, displayValue, className = '' }: CopyableTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <span className="relative inline-block">
      <span
        ref={triggerRef}
        className={`cursor-pointer hover:opacity-80 ${className}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Click to view full value"
      >
        {displayValue}
      </span>

      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute z-50 left-0 top-full mt-1"
          style={{
            minWidth: '280px',
            maxWidth: '400px',
          }}
        >
          <div
            style={{
              background: 'var(--bb-panel-bg)',
              border: '1px solid var(--bb-cyan)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              padding: '8px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--bb-gray)',
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}
            >
              Full Value
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: 'var(--bb-cyan)',
                wordBreak: 'break-all',
                marginBottom: '8px',
                lineHeight: '1.4',
              }}
            >
              {value}
            </div>
            <button
              onClick={handleCopy}
              style={{
                width: '100%',
                padding: '4px 8px',
                background: copied ? 'var(--bb-green)' : 'var(--bb-border)',
                border: 'none',
                color: copied ? 'var(--bb-black)' : 'var(--bb-text)',
                fontSize: '10px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
