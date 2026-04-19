const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

export function formatShortDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
