import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Toggle } from "./Toggle.vue"

export const toggleVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-control text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=on]:bg-secondary data-[state=on]:text-primary [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-border bg-card shadow-none hover:bg-secondary hover:text-primary",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 rounded-chip px-1.5 min-w-8",
        lg: "h-10 rounded-control px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ToggleVariants = VariantProps<typeof toggleVariants>
