import { demoHours } from "../index";
import { Icon } from "@/shared/Icon";

export function HoursOverview() {
  return (
    <aside className="opening-hours" aria-label="Öppettider">
      <Icon name="clock" size={16} />
      <div>
        <strong>Öppettider</strong>
        <span>
          {demoHours.days} {demoHours.opening.from}–{demoHours.opening.until}
        </span>
      </div>
    </aside>
  );
}
