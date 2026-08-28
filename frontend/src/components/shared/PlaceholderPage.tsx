import { Hammer } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center space-y-4 py-20 text-center">
      <div className="bg-secondary p-4 rounded-full">
        <Hammer className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground max-w-md">
        {description}
        <br />
        This module is scheduled for implementation in Phase 2.
      </p>
    </div>
  );
}
