import { GITHUB_ISSUES, GITHUB_REPO, SUPPORT_EMAIL, bugReportMailto } from '@/lib/support';
import { applyPageLocale, t } from '@/lib/i18n';
import { useLayoutEffect } from 'react';
import { SiteChrome } from './SiteChrome';
import { BoxIcon } from '@/lib/ui/icons/box';
import { KeyIcon } from '@/lib/ui/icons/key';
import { GitCompareArrowsIcon } from '@/lib/ui/icons/git-compare-arrows';
import { MailboxIcon } from '@/lib/ui/icons/mailbox';
import { GithubIcon } from '@/lib/ui/icons/github';

const version = browser.runtime.getManifest().version;

export default function App() {
  useLayoutEffect(() => {
    applyPageLocale('thanks_document_title');
  }, []);
  const mail = bugReportMailto(version);

  return (
    <SiteChrome title={t('thanks_title')}>
      <p>{t('thanks_lead')}</p>
      <ul className="steps">
        <li>
          <span className="icon-slot"><BoxIcon size={22} /></span>
          <span>{t('thanks_step1')}</span>
        </li>
        <li>
          <span className="icon-slot"><KeyIcon size={22} /></span>
          <span>{t('thanks_step2')}</span>
        </li>
        <li>
          <span className="icon-slot"><GitCompareArrowsIcon size={22} /></span>
          <span>{t('thanks_step3')}</span>
        </li>
      </ul>
      <p className="note">{t('thanks_unusual_note')}</p>
      <div className="actions">
        <a className="btn" href={mail}>
          <MailboxIcon size={18} />
          {t('thanks_write_bug')}
        </a>
        <a className="btn alt" href={GITHUB_ISSUES} target="_blank" rel="noreferrer">
          <GithubIcon size={18} />
          {t('thanks_github_issue')}
        </a>
      </div>
      <p className="mail">
        <MailboxIcon size={16} />
        <a href={mail}>{SUPPORT_EMAIL}</a>
      </p>
      <p className="fine">
        {t('thanks_disclaimer_before')}
        <a href={GITHUB_REPO} target="_blank" rel="noreferrer">
          github.com/catlsp/tf2-inventory-value
        </a>
        {t('thanks_disclaimer_after')}
      </p>
    </SiteChrome>
  );
}
