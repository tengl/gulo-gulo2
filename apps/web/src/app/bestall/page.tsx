import type { Metadata } from "next";
import { OrderingExperience } from "@/modules/storefront/ui";

export const metadata: Metadata = {
  title: "Beställ",
  description: "Beställ korvwraps och dryck från Gulo Gulo Deli via chatt eller meny.",
  // WEBB-011: the ordering app is not indexed; /meny carries the menu as text.
  robots: { index: false, follow: true },
};

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ varor?: string | string[] }>;
}) {
  const { varor } = await searchParams;
  return (
    <OrderingExperience
      orderLink={typeof varor === "string" ? varor.slice(0, 2000) : undefined}
    />
  );
}
