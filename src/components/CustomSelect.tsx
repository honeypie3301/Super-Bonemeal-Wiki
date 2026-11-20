import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption<T extends string | number> {
  value: T;
  label: string;
  desc?: string;
}

interface CustomSelectProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: CustomSelectOption<T>[];
  className?: string;
  menuClassName?: string;
  placeholder?: string;
  widthClass?: string;
  compact?: boolean;
}

export default function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  className = '',
  menuClassName = '',
  placeholder = 'Select option...',
  widthClass = 'w-full',
  compact = false,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${widthClass} ${isOpen ? 'z-[120]' : 'z-30'}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`w-full bg-surface-alt hover:bg-surface border border-line hover:border-accent/60 rounded-lg ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-2.5 py-1.5 text-xs'
        } font-mono text-ink flex items-center justify-between gap-2 focus:outline-none focus:border-accent transition shadow-xs cursor-pointer ${className}`}
      >
        <span className="truncate text-left font-mono">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-accent-text shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 left-0 mt-1 z-[130] bg-surface border border-line rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-100 ${menuClassName}`}>
          <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between gap-2 transition cursor-pointer ${
                    isSelected
                      ? 'bg-accent-soft text-accent-text font-semibold'
                      : 'text-ink-muted hover:bg-surface-alt hover:text-ink'
                  }`}
                >
                  <div className="truncate">
                    <div>{option.label}</div>
                    {option.desc && (
                      <div className="text-[10px] text-ink-subtle font-normal truncate mt-0.5">{option.desc}</div>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-accent-text shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
