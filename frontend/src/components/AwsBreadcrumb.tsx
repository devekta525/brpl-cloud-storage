import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

const AwsBreadcrumb = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav className="flex items-center gap-1 text-sm py-2 px-1">
    {items.map((item, i) => (
      <span key={i} className="flex items-center gap-1">
        {i > 0 && <ChevronRight size={12} className="text-muted-foreground" />}
        {item.onClick ? (
          <button onClick={item.onClick} className="aws-link">{item.label}</button>
        ) : (
          <span className="text-foreground font-medium">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
);

export default AwsBreadcrumb;
