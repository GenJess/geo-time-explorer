import { cn } from "@/lib/utils";

interface TimelineProps {
  items: {
    year: number;
    title: string;
    description: string;
  }[];
  className?: string;
}

export const Timeline = ({ items, className }: TimelineProps) => {
  return (
    <div className={cn("space-y-8", className)}>
      {items.map((item, index) => (
        <div key={index} className="relative group">
          <div className="flex items-center">
            <div className="flex flex-col items-center mr-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary bg-background group-hover:bg-primary/10 transition-colors">
                <span className="text-sm font-semibold">{item.year}</span>
              </div>
              {index !== items.length - 1 && (
                <div className="w-px h-16 bg-border group-hover:bg-primary/50 transition-colors" />
              )}
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};