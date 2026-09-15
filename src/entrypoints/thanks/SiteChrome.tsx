import type { ReactNode } from 'react';
import { SparklesIcon } from '@/lib/ui/icons/sparkles';

type SiteChromeProps = {
  title: string;
  children: ReactNode;
};

export function SiteChrome({ title, children }: SiteChromeProps) {
  const version = browser.runtime.getManifest().version;

  return (
    <div className="site">
      <header className="site-nav">
        <span className="site-name">
          <SparklesIcon size={18} />
          TF2 Inventory Value
        </span>
        <span className="site-ver">{version}</span>
      </header>
      <div className="site-main">
        <section className="card">
          <h1>{title}</h1>
          {children}
        </section>
      </div>
    </div>
  );
}
