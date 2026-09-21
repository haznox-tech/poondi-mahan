import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items }) {
  // items: [{ label: 'Home', path: '/' }, { label: 'About' }]
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-[#B78A3B]/70 font-sans">
      <Link to="/" className="flex items-center gap-1 hover:text-[#B78A3B] transition-colors">
        <Home size={14} aria-hidden="true" />
        <span className="sr-only">Home</span>
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={14} className="text-[#B78A3B]/40" aria-hidden="true" />
          {item.path ? (
            <Link to={item.path} className="hover:text-[#B78A3B] transition-colors text-[#E8D7B5]/60">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#B78A3B] font-medium" aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
