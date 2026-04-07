import React from 'react';
import { ExternalLink } from 'lucide-react';

interface LinkRendererProps {
  links?: string;
  className?: string;
}

export default function LinkRenderer({ links, className = "" }: LinkRendererProps) {
  if (!links) return null;

  const linkArray = links.split(/\s+/).filter(link => link.length > 0);

  if (linkArray.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {linkArray.map((link, i) => {
        let url = link;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = `https://${url}`;
        }
        
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-md bg-brick-50 px-2 py-1 text-xs font-medium text-brick-600 transition-colors hover:bg-brick-100"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="max-w-[150px] truncate">{link}</span>
          </a>
        );
      })}
    </div>
  );
}
