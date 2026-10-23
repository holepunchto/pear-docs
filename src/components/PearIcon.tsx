// components/icons/PearIcon.tsx
export function PearIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width="24"
      height="24"
    >
      {/* Pear outline */}
      <path d="M12 22c-5 0-8-4-8-9 0-4 2.5-7 5-9 1-0.8 1.5-1.5 1.5-2.5 0-0.5 0.5-1.5 1.5-1.5s1.5 1 1.5 1.5c0 1 0.5 1.7 1.5 2.5 2.5 2 5 5 5 9 0 5-3 9-8 9z" />
    </svg>
  );
}