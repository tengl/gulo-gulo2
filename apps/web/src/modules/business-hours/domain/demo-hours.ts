// OPPEN-016/017: display-only ordinary hours from the legacy UI, not slot availability.
export const demoHours = {
  days: "tors–sön",
  opening: { from: "11:00", until: "15:00" },
  sameDayOrdering: { from: "10:30", until: "14:00" },
} as const;

export const ordinaryHoursText = `Ordinarie öppettider: ${demoHours.days} ${demoHours.opening.from}–${demoHours.opening.until}. Beställ för samma dag: ${demoHours.days} ${demoHours.sameDayOrdering.from}–${demoHours.sameDayOrdering.until}. Övriga tider blir det en förbeställning. Det här är demotider, inte uppgift om bokningsbara hämtningstider eller datumundantag.`;
