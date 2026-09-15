import { useEffect, useLayoutEffect, useState } from 'react';
import type { StatusResponse } from '@/lib/messages';
import { applyPageLocale, t } from '@/lib/i18n';
import { GITHUB_ISSUES, bugReportMailto, thanksPagePath, whatsNewPagePath } from '@/lib/support';

const version = browser.runtime.getManifest().version;

export default function App() {
  useLayoutEffect(() => {
    applyPageLocale();
  }, []);
  const [statusText, setStatusText] = useState(t('popup_status_loading'));

  useEffect(() => {
    void browser.runtime.sendMessage({ type: 'REFRESH_PRICES' }).then((response: StatusResponse) => {
      if ('status' in response && response.status.ready) {
        setStatusText(t('popup_status_ready', { keyRef: response.status.keyRef?.toFixed(2) ?? '—' }));
        return;
      }
      setStatusText(t('popup_status_open'));
    }).catch(() => {
      setStatusText(t('popup_status_open'));
    });
  }, []);

  return (
    <main className="popup">
      <h1>TF2 Inventory Value</h1>
      <p>{statusText}</p>
      <ol>
        <li>{t('popup_step1')}</li>
        <li>{t('popup_step2')}</li>
        <li>{t('popup_step3')}</li>
      </ol>
      <p className="popup-links">
        <a href={bugReportMailto(version)}>{t('popup_report_bug')}</a>
        {' · '}
        <a href={GITHUB_ISSUES} target="_blank" rel="noreferrer">{t('popup_github')}</a>
        {' · '}
        <a
          href={browser.runtime.getURL(thanksPagePath())}
          target="_blank"
          rel="noreferrer"
        >
          {t('popup_howto')}
        </a>
        {' · '}
        <a
          href={browser.runtime.getURL(whatsNewPagePath())}
          target="_blank"
          rel="noreferrer"
        >
          {t('popup_whatsnew')}
        </a>
      </p>
      <p className="disclaimer">{t('popup_disclaimer')}</p>
    </main>
  );
}
