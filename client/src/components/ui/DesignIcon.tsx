type IconName = "search" | "sound" | "heart" | "more" | "document" | "history" | "spark" | "theme" | "star";
const paths: Record<IconName, React.ReactNode> = {
  star: <path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1.1 6.2-5.7-3-5.7 3 1.1-6.2-4.5-4.4 6.3-.9Z" />,
  theme: <><path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  sound: <><path d="M11 4 5 9H2v6h3l6 5V4Z" /><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
  heart: <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
  more: <><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></>,
  document: <><path d="M6 3h8l4 4v14H6Z" /><path d="M14 3v5h4M9 12h6m-6 4h6" /></>,
  history: <><path d="M3 4v6h6M3 10a9 9 0 1 1 1 8" /><path d="M12 7v6l-4 2" /></>,
  spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /><path d="m18 2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z" /></>,
};
export function DesignIcon({ name }: { name: IconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
