import type { HTMLAttributes } from "react";

type BloodwickBrandProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export function BloodwickWordmark({ className = "", label = "Bloodwick", ...props }: BloodwickBrandProps) {
  return (
    <div className={`bloodwick-wordmark ${className}`.trim()} {...props}>
      <BloodwickMark aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function BloodwickMark({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`bloodwick-mark ${className}`.trim()} {...props}>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 36 36">
        <path d="M9 5h9.5c5.5 0 9.2 3.1 9.2 7.8 0 2.7-1.3 4.8-3.7 6.1 3.1 1.1 5 3.5 5 6.8C29 31 25 34 18.7 34H9V5Zm7.5 11.8h2c1.9 0 3.1-1 3.1-2.7 0-1.8-1.2-2.8-3.3-2.8h-1.8v5.5Zm0 10.7h2.6c2.2 0 3.5-1.1 3.5-3 0-2-1.3-3.1-3.6-3.1h-2.5v6.1Z" />
      </svg>
    </span>
  );
}
