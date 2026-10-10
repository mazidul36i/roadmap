import { NavLink, useLocation } from "react-router-dom";
import { Menu as MenuIcon } from "lucide-react";
import { useApp } from "@context/AppContext";
import { cx } from "@ui/index";
import { dueCardCount } from "@lib/selectors";
import { activeNavItem, BOTTOM_NAV, NAV_GROUPS } from "./nav";
import s from "./AppShell.module.css";

/** Mobile tab bar: four destinations plus "More" for the full navigation. */
export function BottomNav({ onMore }: { onMore: () => void }) {
  const { pathname } = useLocation();
  const { state } = useApp();
  const active = activeNavItem(pathname);
  const due = dueCardCount(state);
  const groupOf = (to: string) => NAV_GROUPS.find(g => g.items.some(i => i.to === to))?.id;
  const activeGroup = active ? groupOf(active.to) : undefined;

  return (
    <nav className={s.bottomNav} aria-label="Primary">
      {BOTTOM_NAV.map(item => {
        // A tab lights up for anything in its group (e.g. Practice for Mocks).
        const isActive = active?.to === item.to || (item.to !== "/" && activeGroup === groupOf(item.to));
        return (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className={cx(s.tab, isActive && s.active)} aria-current={isActive ? "page" : undefined}>
            <item.icon size={22} strokeWidth={1.75} aria-hidden />
            {item.short ?? item.label}
            {item.badge === "reviewDue" && due > 0 && <span className={s.navBadge}>{due > 99 ? "99+" : due}</span>}
          </NavLink>
        );
      })}
      <button type="button" className={s.tab} onClick={onMore} aria-label="More navigation">
        <MenuIcon size={22} strokeWidth={1.75} aria-hidden />
        More
      </button>
    </nav>
  );
}
