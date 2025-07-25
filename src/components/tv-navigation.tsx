import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

interface TVNavigationProps {
  onAIClick: () => void;
}

export const TVNavigation = ({ onAIClick }: TVNavigationProps) => {
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center space-x-8">
        <Button variant="ghost" className="text-lg font-medium text-foreground hover:text-primary">
          Home
        </Button>
        <Button variant="ghost" className="text-lg font-medium text-muted-foreground hover:text-primary">
          Library
        </Button>
        <Button variant="ghost" className="text-lg font-medium text-muted-foreground hover:text-primary">
          Apps
        </Button>
        <Button variant="ghost" className="text-lg font-medium text-muted-foreground hover:text-primary">
          Settings
        </Button>
      </div>
      
      <Button
        onClick={onAIClick}
        className="bg-muted/80 hover:bg-muted text-foreground font-bold px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
      >
        AI
      </Button>
    </nav>
  );
};