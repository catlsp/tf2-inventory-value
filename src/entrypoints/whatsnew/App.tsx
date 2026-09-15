import { useLayoutEffect, useMemo } from 'react';
import { changelogItemText, changelogKindLabel, changelogSince } from '@/lib/changelog';
import { applyPageLocale, detectLocale, t } from '@/lib/i18n';
import { GITHUB_ISSUES, SUPPORT_EMAIL, bugReportMailto } from '@/lib/support';
import { SiteChrome } from '../thanks/SiteChrome';
import { MailboxIcon } from '@/lib/ui/icons/mailbox';
import { GithubIcon } from '@/lib/ui/icons/github';

const version = browser.runtime.getManifest().version;

export default function App() {
  useLayoutEffect(() => {
    applyPageLocale('whatsnew_document_title');
  }, []);
  const locale = detectLocale();
  const from = useMemo(() => new URLSearchParams(location.search).get('from') ?? '', []);
  const releases = useMemo(() => changelogSince(from), [from]);
  const mail = bugReportMailto(version);

  return (
    <SiteChrome title={t('whatsnew_title')}>
      <p>{t('whatsnew_intro', { version })}</p>
      {from ? <p className="since">{t('whatsnew_since', { from })}</p> : null}

      {releases.length === 0 ? (
        <p>{t('whatsnew_empty')}</p>
      ) : (
        releases.map((release) => (
          <section key={release.version} className="changes">
            <h2>{release.version}</h2>
            <ul className="change-list">
              {release.items.map((item) => (
                <li key={`${release.version}-${item.en}`}>
                  <span className={`kind is-${item.kind}`}>
                    {changelogKindLabel(item.kind, locale)}
                  </span>
                  {' '}
                  {changelogItemText(item, locale)}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <div className="actions">
        <button type="button" className="btn" onClick={() => window.close()}>
          {t('whatsnew_continue')}
        </button>
        <a className="btn alt" href={mail}>
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
    </SiteChrome>
  );
}
