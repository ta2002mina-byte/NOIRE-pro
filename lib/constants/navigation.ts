export interface SectionNavItem {
  href: string;
  label: string;
  /** Hidden from staff. The page itself still enforces this on the server. */
  adminOnly?: boolean;
}

export interface PublicNavItem {
  href: string;
  label: string;
}

/** Primary public-site navigation, shared by the desktop header and the mobile drawer. */
export const PUBLIC_NAV: readonly PublicNavItem[] = [
  { href: "/menu", label: "Menu" },
  { href: "/chef", label: "Chef" },
  { href: "/our-ingredients", label: "Our Ingredients" },
  { href: "/space", label: "Space" },
  { href: "/stories", label: "Stories" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const ACCOUNT_NAV: readonly SectionNavItem[] = [
  { href: "/account", label: "Overview" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/reservations", label: "Reservations" },
  { href: "/account/journal", label: "Dining journal" },
  { href: "/account/passport", label: "Passport" },
  { href: "/account/favorites", label: "Favorites" },
  { href: "/account/reviews", label: "Reviews" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/settings", label: "Settings" },
];

export const ADMIN_NAV: readonly SectionNavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/tonight", label: "Tonight" },
  { href: "/admin/reservations", label: "Reservations" },
  { href: "/admin/tables", label: "Tables" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/experiences", label: "Experiences" },
  { href: "/admin/chef", label: "Chef’s Desk" },
  { href: "/admin/ingredients", label: "Ingredients" },
  { href: "/admin/stories", label: "Stories" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/passport", label: "Dining Passport" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/content", label: "Site content" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Settings", adminOnly: true },
];
