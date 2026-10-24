// CHATT-016: give the header time to move out of view; let gestures take over.
export function scrollChat(container: HTMLDivElement, top: number) {
  const from = container.scrollTop;
  const to = Math.max(
    0,
    Math.min(top, container.scrollHeight - container.clientHeight),
  );
  const duration = 550;
  const started = performance.now();
  const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
  let frame = 0;
  function stop() {
    cancelAnimationFrame(frame);
    for (const event of events) container.removeEventListener(event, stop);
  }
  function step(now: number) {
    const progress = Math.min(1, (now - started) / duration);
    const eased =
      progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    container.scrollTo({
      top: from + (to - from) * eased,
      behavior: "instant",
    });
    if (progress < 1) frame = requestAnimationFrame(step);
    else stop();
  }
  if (from === to) return stop;
  for (const event of events)
    container.addEventListener(event, stop, { passive: true });
  frame = requestAnimationFrame(step);
  return stop;
}
