import {useState, useEffect} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const TILES = Array.from({length: 480});

// To-Do는 빌드에 박지 않고 런타임에 raw로 불러온다 → todos만 바꿀 땐 재배포 불필요(push만 하면 반영).
const RAW_TODOS = 'https://raw.githubusercontent.com/chanyoze/TIL/main/data/todos.json';
const EMPTY_TODOS = {updated: '', week: [], today: [], deadlines: []};

function TodoBlock({label, items}) {
  return (
    <div className={styles.todoBlock}>
      <div className={styles.todoLabel}>{label}</div>
      <ul className={styles.todoList}>
        {items.length === 0 ? (
          <li className={styles.todoEmpty}>비어 있음</li>
        ) : (
          items.map((t, i) => (
            <li key={i} className={t.done ? styles.todoDone : styles.todoItem}>
              <span className={styles.todoCheck} aria-hidden="true">{t.done ? '✅' : '⬜'}</span>
              <span className={styles.todoText}>{t.text}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

// 구글 캘린더 "추가 링크"(OAuth 불필요) — 클릭하면 캘린더에 일정 등록
function gcalUrl(text, due) {
  if (!due) return null;
  const hasTime = due.includes('T');
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  let dates;
  if (hasTime) {
    const start = new Date(due);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // +1시간
    const fmt = (d) => `${ymd(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    dates = `${fmt(start)}/${fmt(end)}`;
  } else {
    const start = new Date(`${due.slice(0, 10)}T00:00:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000); // 종일(다음날)
    dates = `${ymd(start)}/${ymd(end)}`;
  }
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${dates}`;
}

// 마감(deadline) — 가까운 순 정렬 + D-day(클라이언트에서만 계산해 hydration 안전)
function DeadlineBlock({items}) {
  const [now, setNow] = useState(null);
  useEffect(() => setNow(Date.now()), []);
  const sorted = [...(items || [])].sort((a, b) => (a.due || '').localeCompare(b.due || ''));
  return (
    <div className={styles.todoBlock}>
      <div className={styles.todoLabel}>⏰ 마감</div>
      <ul className={styles.todoList}>
        {sorted.length === 0 ? (
          <li className={styles.todoEmpty}>마감 예정 없음</li>
        ) : (
          sorted.map((t, i) => {
            let dday = null;
            if (now && t.due) {
              const target = new Date(`${t.due.slice(0, 10)}T23:59:59`).getTime();
              const d = Math.ceil((target - now) / 86400000);
              dday = d === 0 ? 'D-DAY' : d > 0 ? `D-${d}` : `D+${-d}`;
            }
            const urgent = dday && (dday === 'D-DAY' || /^D-[0-2]$/.test(dday));
            const url = !t.done ? gcalUrl(t.text, t.due) : null;
            const label = (
              <>
                {t.text}
                <span className={styles.due}>
                  {t.due?.slice(0, 10)}
                  {dday && <b className={urgent ? styles.ddayUrgent : styles.dday}> · {dday}</b>}
                </span>
              </>
            );
            return (
              <li key={i} className={t.done ? styles.todoDone : styles.todoItem}>
                <span className={styles.todoCheck} aria-hidden="true">{t.done ? '✅' : '⬜'}</span>
                {url ? (
                  <a
                    className={styles.calLink}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    title="📅 구글 캘린더에 추가">
                    {label}
                  </a>
                ) : (
                  <span className={styles.todoText}>{label}</span>
                )}
                {t.doc && (
                  <a
                    className={styles.docLink}
                    href={t.doc}
                    target="_blank"
                    rel="noreferrer"
                    title="📄 참고 문서 열기">
                    📄
                  </a>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  const mascot = useBaseUrl('/img/mascot.png');
  const [todos, setTodos] = useState(EMPTY_TODOS);
  useEffect(() => {
    // 쿼리에 타임스탬프를 붙여 GitHub raw CDN(Fastly ~5분) 엣지 캐시까지 우회한다.
    fetch(`${RAW_TODOS}?t=${Date.now()}`, {cache: 'no-store'})
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setTodos(d))
      .catch(() => {});
  }, []);
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline} wrapperClassName="homeMain">
      <main className={styles.hero}>
        <div className={styles.tileGrid} aria-hidden="true">
          {TILES.map((_, i) => (
            <img key={i} src={mascot} className={styles.tileImg} alt="" />
          ))}
        </div>
        <div className={styles.heroInner}>
          <div className={styles.left}>
            <p className={styles.kicker}>✨ Today I Learned · TIL</p>
            <Heading as="h1" className={styles.title}>흩어진 배움을 한곳에</Heading>
            <div className={styles.links}>
              <Link className={styles.btnPrimary} to="/docs">📒 노트</Link>
              <Link className={styles.btnGhost} to="/profile">👤 프로필</Link>
            </div>
          </div>
          <aside className={styles.todoCard}>
            <div className={styles.todoHead}>
              <span className={styles.todoCardTitle}>🗓️ To-Do</span>
              <span className={styles.todoUpdated}>{todos.updated ? `${todos.updated} 기준` : ''}</span>
            </div>
            <TodoBlock label="📌 금주" items={todos.week} />
            <TodoBlock label="🔥 금일" items={todos.today} />
            <DeadlineBlock items={todos.deadlines} />
          </aside>
        </div>
      </main>
    </Layout>
  );
}
