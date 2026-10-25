import type { Metadata } from 'next';
import { FallingGame } from '@/modules/game/ui';
import { loadSite } from '@/server/content/load';

export const metadata: Metadata = {
  title: 'Järvens korvfall',
  description: 'Fritt fall och full aptit. Hjälp Gulo Gulos järv fånga korvarna i ett spel från Hälsingland.',
  alternates: { canonical: '/spel' },
};

export default function GamePage() {
  // SPEL-001: names come from the site's actual sausage products, not a copy.
  const colors = ['#b86c43', '#c59864', '#9e533b', '#ce9462', '#b66045', '#d2aa70'];
  const foods = loadSite().products
    .filter(product => !product.slug.startsWith('burgare-') && product.slug !== 'brewurst')
    .map((product, index) => ({ id: product.slug, name: product.data.namn,
      points: 10 + (index % 3) * 10, color: colors[index % colors.length]! }));
  return <FallingGame foods={foods} />;
}
