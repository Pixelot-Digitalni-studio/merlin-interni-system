"use client";

import dynamic from 'next/dynamic';

const InvoiceLayout = dynamic(() => import('../components/InvoiceLayout'), { ssr: false });

export default function Home() {
  return (
    <main>
      <InvoiceLayout />
    </main>
  );
}
