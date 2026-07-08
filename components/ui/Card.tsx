import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick, ...rest }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
