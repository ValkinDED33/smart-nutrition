import { cva } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const buttonSurface = cva(
  "inline-flex items-center justify-center font-semibold transition-colors",
  {
    variants: {
      intent: {
        primary: "bg-emerald-600 text-white hover:bg-emerald-700",
        subtle: "bg-slate-100 text-slate-900 hover:bg-slate-200",
        danger: "bg-rose-600 text-white hover:bg-rose-700",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-sm",
        md: "h-10 rounded-md px-4 text-base",
        lg: "h-12 rounded-lg px-5 text-lg",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
    },
  }
);
