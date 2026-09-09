import { ListSkeleton, PageHeaderSkeleton, StatRowSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <span className="sr-only" role="status">
        Cargando…
      </span>
      <PageHeaderSkeleton />
      <StatRowSkeleton />
      <ListSkeleton />
    </div>
  );
}
