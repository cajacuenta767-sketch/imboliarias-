import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div aria-busy="true">
      <div className="mb-6 flex items-center justify-between"><Skeleton className="h-9 w-64" /><Skeleton className="h-10 w-40" /></div>
      <div className="card overflow-hidden">
        <div className="border-b border-line p-4"><Skeleton className="h-10 w-72 max-w-full" /></div>
        <div className="divide-y divide-line">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="flex items-center gap-4 p-4"><Skeleton className="h-10 w-14" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" /></div>)}</div>
      </div>
    </div>
  );
}
