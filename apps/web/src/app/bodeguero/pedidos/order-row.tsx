'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { advanceOrder, type ActionState } from '@/app/bodeguero/actions';
import { Badge, type Tone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Order = {
  id: string;
  code: string;
  status: string;
  statusLabel: string;
  tone: Tone;
  business: string;
  from: string;
  to: string;
  buyer: string;
};

export function OrderRow({
  order,
  items,
  next,
}: {
  order: Order;
  items: { sku: string; name: string; quantity: number }[];
  next: { status: string; label: string } | null;
}) {
  const [state, action] = useActionState<ActionState, FormData>(advanceOrder, null);

  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-extrabold text-navy-900">{order.code}</h3>
            <Badge tone={order.tone}>{order.statusLabel}</Badge>
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink-400">
            {order.business} · {order.from} → {order.to} · {order.buyer}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1 border-t border-line-100 pt-3">
        {items.map((i) => (
          <li key={i.sku} className="flex items-center gap-2 text-[13px] text-ink-700">
            <span className="font-extrabold text-navy-900 tabular-nums">{i.quantity}×</span>
            <span className="truncate">{i.name}</span>
            <span className="text-[11.5px] text-ink-400">{i.sku}</span>
          </li>
        ))}
      </ul>

      {next ? (
        <form action={action} className="mt-4">
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="status" value={next.status} />
          {state?.error ? (
            <p role="alert" className="mb-2 text-[12.5px] font-semibold text-danger-700">
              {state.error}
            </p>
          ) : null}
          <Submit label={next.label} />
        </form>
      ) : null}
    </li>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" full disabled={pending}>
      {pending ? 'Actualizando…' : label}
    </Button>
  );
}
