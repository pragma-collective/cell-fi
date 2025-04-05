export default function Summary() {
  return (
    <div className="grid grid-cols-2 gap-10 leading-none">
      <div className="flex flex-col gap-[10px]">
        <div className="h5 text-[var(--color-dark-purple)]">Current</div>
        <div className="h1 font-bold text-[var(--color-primary)]">$309.14</div>
        <div className="text-[14px] text-[var(--color-gray-dark)]">as of <strong>04/07/2025</strong></div>
      </div>
      <div className="flex flex-col gap-[10px]">
        <div className="h5 text-[var(--color-dark-purple)]">Savings</div>
        <div className="h1 font-bold text-[var(--color-tertiary)]">$240.54</div>
        <div className="text-[14px] text-[var(--color-gray-dark)]">Rate: <strong>4.51%</strong></div>
      </div>
    </div>
  );
}