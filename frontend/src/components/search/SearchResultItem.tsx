import { Building2, MessageSquare, User, Briefcase, ChevronRight } from 'lucide-react';
import type { SearchResult } from '@/hooks/useGlobalSearch';
import { formatDistanceToNow } from 'date-fns';

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
  isActive: boolean;
  onSelect: () => void;
}

export function SearchResultItem({ result, query, isActive, onSelect }: SearchResultItemProps) {
  // Highlight matching text helper
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-primary/30 text-primary-foreground rounded-sm px-0.5 font-bold">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const getIcon = () => {
    switch (result.type) {
      case 'WORKSPACE': return <Building2 className="w-5 h-5 text-indigo-400" />;
      case 'STARTUP': return <Briefcase className="w-5 h-5 text-blue-400" />;
      case 'USER':
      case 'MEMBER': return <User className="w-5 h-5 text-green-400" />;
      case 'MESSAGE': return <MessageSquare className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div 
      className={`p-3 md:p-4 cursor-pointer flex items-center gap-4 transition-colors ${isActive ? 'bg-primary/20 dark:bg-indigo-900/40 border-l-4 border-primary' : 'hover:bg-black/5 dark:hover:bg-white/5 border-l-4 border-transparent'}`}
      onClick={onSelect}
      onMouseEnter={() => {
        // Optional: Call an external onHover if we want to sync mouse hover to arrow navigation state
      }}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black/10 dark:bg-black/30 shrink-0">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-bold text-sm text-foreground dark:text-white truncate">
            {highlightText(result.title, query)}
          </h4>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full shrink-0">
            {result.type}
          </span>
        </div>
        
        <p className="text-xs text-muted-foreground dark:text-slate-400 truncate mt-0.5">
          {highlightText(result.subtitle, query)}
        </p>
        
        {result.type === 'MESSAGE' && result.metadata?.createdAt && (
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            {formatDistanceToNow(new Date(result.metadata.createdAt), { addSuffix: true })}
          </p>
        )}
      </div>
      
      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isActive ? 'translate-x-1 text-primary' : ''}`} />
    </div>
  );
}
