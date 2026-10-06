import { JsonLd } from "@/components/ui/json-ld";
import { getRestaurant } from "@/lib/data/restaurant";
import { SITE_URL } from "@/lib/env";

/**
 * Restaurant/LocalBusiness structured data, built only from fields the
 * restaurant record actually has set. Deliberately omits anything we can't
 * verify: `priceRange` and `servesCuisine` aren't stored anywhere, and
 * `opening_hours` is freeform admin-entered text (not a reliably parseable
 * time format), so none of those are guessed at here — see rule 13,
 * "do not fabricate restaurant facts... or availability".
 */
export async function RestaurantJsonLd() {
  const restaurant = await getRestaurant();
  if (!restaurant) return null;

  const address = restaurant.address_line
    ? {
        "@type": "PostalAddress",
        streetAddress: restaurant.address_line,
        addressLocality: restaurant.city ?? undefined,
        addressRegion: restaurant.region ?? undefined,
        postalCode: restaurant.postal_code ?? undefined,
        addressCountry: restaurant.country ?? undefined,
      }
    : undefined;

  const geo =
    restaurant.latitude != null && restaurant.longitude != null
      ? { "@type": "GeoCoordinates", latitude: restaurant.latitude, longitude: restaurant.longitude }
      : undefined;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: restaurant.name,
        description: restaurant.description ?? restaurant.tagline ?? undefined,
        url: SITE_URL,
        telephone: restaurant.phone ?? undefined,
        email: restaurant.email ?? undefined,
        address,
        geo,
      }}
    />
  );
}
