import React from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreVertical, Trash2, Move } from 'lucide-react';

interface ComponentOptionsMenuProps {
  onDelete: () => void;
  onMove?: () => void; // Optional move handler
  className?: string;
}

/**
 * Component options menu that appears in the top-right corner of dashboard components
 * 
 * @param onDelete - Function to call when delete option is selected
 * @param onMove - Optional function to call when move option is selected
 * @param className - Optional additional CSS classes
 */
const ComponentOptionsMenu: React.FC<ComponentOptionsMenuProps> = ({ 
  onDelete, 
  onMove,
  className
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 ${className}`}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Component options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onMove && (
          <>
            <DropdownMenuItem onClick={onMove}>
              <Move className="mr-2 h-4 w-4" />
              Move
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem 
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ComponentOptionsMenu; 