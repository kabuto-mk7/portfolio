export function Window({ title, rightTag, children }: { title: string; rightTag?: string; children: React.ReactNode; }) {
  return (
    <div className="mb-8 rounded-[6px] border border-[#4a5a45] bg-[#313b2f] shadow-[0_0_0_1px_#2d362b,inset_0_1px_0_#2a3328]">
      <div className="flex items-center justify-between rounded-t-[6px] border-b border-[#4a5a45] bg-[#3a4538] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-sm bg-[var(--primary)] shadow-[0_0_10px_var(--primary)]" />
          <span className="text-sm tracking-wide text-[var(--accent)]">{title}</span>
        </div>
        {rightTag && <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] border border-[#284635] bg-[#313b2f]">{rightTag}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Panel({ title, rightTag, children }: { title: string; rightTag?: string; children: React.ReactNode; }) {
  return (
    <div className="rounded-[4px] border border-[#4a5a45] bg-[#3a4538] shadow-[inset_0_1px_0_#2a3328]">
      <div className="flex items-center justify-between border-b border-[#4a5a45] px-3 py-2">
        <span className="text-xs tracking-wide text-[var(--accent)]">{title}</span>
        {rightTag && <span className="text-[10px] opacity-70">{rightTag}</span>}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

export function SpecList({ specs }: { specs: Record<string, string> }) {
  return (
    <div className="grid gap-2 text-xs">
      {Object.entries(specs).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3 border-b border-dashed border-[#1e3329] pb-1">
          <span className="opacity-60">{k}</span>
          <span className="text-[var(--accent)]">{v}</span>
        </div>
      ))}
    </div>
  );
}
