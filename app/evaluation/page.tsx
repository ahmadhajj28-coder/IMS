'use client';

import useSWR from "swr";
import { Card } from "@/components/ui/Card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EvaluationPage() {
  const { data, error } = useSWR("/api/evaluation?mode=current", fetcher);

  if (error) return <div>Error loading evaluation.</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory evaluation</h1>
        <p className="mt-1 text-sm text-slate-600">
          Current valuation snapshot (extendable to historical reporting).
        </p>
      </div>
      <Card className="p-4">
        <p className="text-sm">
          Mode: <span className="font-mono">{data.mode}</span>
        </p>
        <p className="mt-2 text-lg">
          Total inventory value:{" "}
          <span className="font-semibold">
            ${data.totalValue.toLocaleString()}
          </span>
        </p>
        <p className="mt-1 text-sm text-slate-700">
          Total products tracked: {data.totalProducts}
        </p>
      </Card>
    </div>
  );
}

