import { Button } from "@/components/ui/button";
import { cn } from "@/core/utils/utils"; // Si tu as une fonction pour combiner les classes

interface BackButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  variant?: "default" | "ghost" | "outline";
}

const BackButton: React.FC<BackButtonProps> = ({
  children,
  onClick,
  className = "",
  iconLeft,
  iconRight,
  variant = "ghost",
}) => {
  return (
    <Button
      variant={variant}
      className={cn(
        "bg-white border border-purple-600 text-purple-600 flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:bg-purple-600 hover:text-white transition",
        className
      )}
      onClick={onClick}
    >
      {iconLeft && <span>{iconLeft}</span>}
      {children}
      {iconRight && <span>{iconRight}</span>}
    </Button>
  );
};

export default BackButton;
