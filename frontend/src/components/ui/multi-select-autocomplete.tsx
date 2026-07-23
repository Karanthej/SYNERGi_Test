import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MultiSelectAutocompleteProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  suggestedOptions?: string[];
  placeholder?: string;
  allowCustom?: boolean;
}

export function MultiSelectAutocomplete({
  value = [],
  onChange,
  options = [],
  suggestedOptions = [],
  placeholder = "Search...",
  allowCustom = true,
}: MultiSelectAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(
    (opt) =>
      opt.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(opt)
  );

  const handleSelect = (item: string) => {
    if (!value.includes(item)) {
      onChange([...value, item]);
    }
    setInputValue("");
    setIsOpen(false);
  };

  const handleRemove = (item: string) => {
    onChange(value.filter((i) => i !== item));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
    
    if (!isOpen && inputValue) {
      setIsOpen(true);
    }

    if (isOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filteredOptions.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredOptions[activeIndex]) {
          handleSelect(filteredOptions[activeIndex]);
        } else if (allowCustom && inputValue.trim()) {
          handleSelect(inputValue.trim());
        }
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    } else if (e.key === "Enter" && allowCustom && inputValue.trim()) {
        e.preventDefault();
        handleSelect(inputValue.trim());
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((item) => (
          <Badge key={item} variant="secondary" className="flex items-center gap-1 pr-1">
            {item}
            <div 
              role="button"
              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-muted-foreground/20 cursor-pointer"
              onClick={() => handleRemove(item)}
            >
              <X className="w-3 h-3" />
            </div>
          </Badge>
        ))}
      </div>
      
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full"
        />
        
        {isOpen && (inputValue || filteredOptions.length > 0) && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border glass-surface text-popover-foreground shadow-md outline-none">
            <ScrollArea className="max-h-64 overflow-auto rounded-md">
              <div className="p-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt, index) => (
                    <div
                      key={opt}
                      onClick={() => handleSelect(opt)}
                      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${index === activeIndex ? "bg-accent text-accent-foreground" : ""}`}
                    >
                      {opt}
                    </div>
                  ))
                ) : allowCustom && inputValue.trim() ? (
                  <div
                    onClick={() => handleSelect(inputValue.trim())}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground bg-accent text-accent-foreground"
                  >
                    Add "{inputValue.trim()}"
                  </div>
                ) : (
                  <div className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none opacity-50">
                    No results found.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {suggestedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {suggestedOptions.map(opt => {
            if (value.includes(opt)) return null;
            return (
              <Badge 
                key={opt} 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => handleSelect(opt)}
              >
                + {opt}
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  );
}
