import { demoHours } from "../index";

export function OrderingHours() {
  return (
    <div className="ordering-hours" role="note" aria-label="Beställningstider">
      <span>
        <strong>Beställ för samma dag</strong> {demoHours.days}{" "}
        {demoHours.sameDayOrdering.from}–{demoHours.sameDayOrdering.until}
      </span>
      <span>Övriga tider: förbeställning</span>
    </div>
  );
}
