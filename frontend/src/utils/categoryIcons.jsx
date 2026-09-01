import { Banknote, Car, Clapperboard, Home, Pill, ShoppingBag, Tag, UtensilsCrossed, Zap } from 'lucide-react';

// Default categories created for every new account (see authService.registerUser
// on the backend). Anything not listed here just falls back to a generic tag icon,
// which covers custom categories a user creates themselves.
const iconByCategory = {
  Food: UtensilsCrossed,
  Transport: Car,
  Shopping: ShoppingBag,
  Rent: Home,
  Health: Pill,
  Entertainment: Clapperboard,
  Savings: Banknote,
  Utilities: Zap,
};

export function CategoryIcon({ category, ...props }) {
  const Icon = iconByCategory[category] || Tag;
  return <Icon aria-hidden="true" {...props} />;
}
