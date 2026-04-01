import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "green" | "blue" | "amber" | "gray" | "red";
}

export function Badge({ children, variant = "green" }: BadgeProps) {
  const variants: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-600",
    red: "bg-red-100 text-red-700",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}
