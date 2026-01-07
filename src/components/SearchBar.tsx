import { Search, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SearchBar = ({ 
  placeholder = "Search notes...", 
  value, 
  onChange,
  className 
}: SearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div 
      className={cn(
        "relative flex items-center",
        className
      )}
    >
      <div 
        className={cn(
          "flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200",
          "bg-white/60 backdrop-blur-lg border",
          isFocused 
            ? "border-primary/40 shadow-soft" 
            : "border-white/30"
        )}
      >
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
        />
        {value && (
          <button 
            onClick={() => onChange('')}
            className="p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
