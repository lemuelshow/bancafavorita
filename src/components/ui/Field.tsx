import { type InputHTMLAttributes, forwardRef } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; trailing?: React.ReactNode };

const Field = forwardRef<HTMLInputElement, Props>(({ label, trailing, className = "", ...props }, ref) => (
  <label className="mb-3 block">
    <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">{label}</span>
    <div className="relative">
      <input
        ref={ref}
        className={`w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3 text-text outline-none focus:border-gold ${trailing ? "pr-12" : ""} ${className}`}
        {...props}
      />
      {trailing && <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>}
    </div>
  </label>
));
Field.displayName = "Field";

export default Field;
