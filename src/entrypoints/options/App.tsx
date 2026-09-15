import { GITHUB_ISSUES, SUPPORT_EMAIL, bugReportMailto } from '@/lib/support';
import { applyPageLocale, t } from '@/lib/i18n';
import { useLayoutEffect } from 'react';
import { SiteChrome } from '../thanks/SiteChrome';
import { MailboxIcon } from '@/lib/ui/icons/mailbox';
import { GithubIcon } from '@/lib/ui/icons/github';

const version = browser.runtime.getManifest().version;

export default function OptionsApp() {
  useLayoutEffect(() => {
    applyPageLocale('options_document_title');
  }, []);
  const mail = bugReportMailto(version);

  return (
    <SiteChrome title="TF2 Inventory Value">
      <p>
        {t('options_pricedb_before')}
        <a href="https://pricedb.io" target="_blank" rel="noreferrer">
          pricedb.io
        </a>
        {t('options_pricedb_after')}
      </p>
      <p>{t('options_open')}</p>
      <div className="actions">
        <a className="btn" href={mail}>
          <MailboxIcon size={18} />
          {SUPPORT_EMAIL}
        </a>
        <a className="btn alt" href={GITHUB_ISSUES} target="_blank" rel="noreferrer">
          <GithubIcon size={18} />
          GitHub Issues
        </a>
      </div>
      <p className="fine">{t('options_disclaimer')}</p>
    </SiteChrome>
  );
}
