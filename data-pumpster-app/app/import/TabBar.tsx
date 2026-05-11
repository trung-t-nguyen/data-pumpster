'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function TabBar() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'new';

  const tabClass = (tab: string) =>
    [
      'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
      activeTab === tab
        ? 'border-foreground text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground',
    ].join(' ');

  return (
    <div className="mb-8 flex border-b border-border">
      <Link href="/import?tab=new" className={tabClass('new')} data-testid="tab-new-import">
        New Import
      </Link>
      <Link href="/import?tab=history" className={tabClass('history')} data-testid="tab-history">
        History
      </Link>
    </div>
  );
}
