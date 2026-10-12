import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, PanelLeftClose, PanelLeftOpen, Settings, Trophy } from "lucide-react";
import { useAuth } from "@context/AuthContext";
import { useApp } from "@context/AppContext";
import { useConfirm } from "@context/ConfirmationContext";
import { IconButton, Menu, Tooltip, cx } from "@ui/index";
import { levelInfo } from "@lib/levels";
import { dueCardCount, initials } from "@lib/selectors";
import { BrandMark } from "./BrandMark";
import { activeNavItem, FOOTER_NAV, NAV_GROUPS, type NavItem } from "./nav";
import s from "./AppShell.module.css";

interface SidebarProps {
  rail: boolean;
  onToggleRail?: () => void;
  /** Called after navigating (closes the mobile sheet). */
  onNavigate?: () => void;
  /** Rendered inside the mobile "More" sheet rather than the desktop column. */
  inSheet?: boolean;
}

export function Sidebar({ rail, onToggleRail, onNavigate, inSheet }: SidebarProps) {
  const { user, logout } = useAuth();
  const { state } = useApp();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = activeNavItem(pathname);
  const level = levelInfo(state.xp);
  const due = dueCardCount(state);

  const renderItem = (item: NavItem) => {
    const badge = item.badge === "reviewDue" && due > 0 ? due : null;
    const link = (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === "/"}
        onClick={onNavigate}
        className={cx(s.navItem, active?.to === item.to && s.active)}
        aria-current={active?.to === item.to ? "page" : undefined}
      >
        <item.icon size={18} strokeWidth={1.75} aria-hidden />
        <span className={s.navLabel}>{item.label}</span>
        {badge !== null && (
          <span className={s.navBadge} aria-label={`${badge} due`}>
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </NavLink>
    );
    return rail ? (
      <Tooltip key={item.to} content={item.label} side="right">
        {link}
      </Tooltip>
    ) : (
      link
    );
  };

  const signOut = async () => {
    const ok = await confirm({
      title: "Sign out?",
      message: "Your progress is saved to the cloud. You can sign back in any time.",
      confirmText: "Sign out",
      type: "warning",
    });
    if (ok) await logout();
  };

  return (
    <aside className={cx(s.sidebar, rail && s.rail)} aria-label="Primary" style={inSheet ? { position: "static", height: "100%", border: "none" } : undefined}>
      <div className={s.brand}>
        <NavLink to="/" className={s.brandLink} onClick={onNavigate} aria-label="Forge home">
          <BrandMark className={s.brandMark} />
          <span className={s.wordmark}>Forge</span>
        </NavLink>
        {onToggleRail && (
          <IconButton
            className={s.collapse}
            label="Collapse sidebar"
            size="sm"
            icon={<PanelLeftClose size={18} />}
            onClick={onToggleRail}
          />
        )}
      </div>

      <nav className={s.navScroll}>
        {rail && onToggleRail && (
          <IconButton className={s.expand} label="Expand sidebar" icon={<PanelLeftOpen size={18} />} onClick={onToggleRail} />
        )}
        {NAV_GROUPS.map(group => (
          <div key={group.id} className={s.group} role="group" aria-label={group.label ?? "Home"}>
            {group.label && <div className={s.groupLabel}>{group.label}</div>}
            {group.items.map(renderItem)}
          </div>
        ))}
        <div className={s.group} role="group" aria-label="You">
          {!rail && <div className={s.groupLabel}>You</div>}
          {FOOTER_NAV.map(renderItem)}
        </div>
      </nav>

      <div className={s.footer}>
        <Menu
          align="start"
          trigger={
            <button type="button" className={s.userButton} aria-label="Account menu">
              <span className={s.avatar} aria-hidden>
                {initials(user?.displayName || user?.email)}
              </span>
              <span className={s.userMeta}>
                <span className={s.userName}>{user?.displayName || user?.email || "You"}</span>
                <span className={s.userLevel}>
                  Level {level.level} · {level.title}
                </span>
              </span>
            </button>
          }
          items={[
            { label: "Profile & trophies", icon: <Trophy size={16} />, onSelect: () => { navigate("/profile"); onNavigate?.(); } },
            { label: "Settings", icon: <Settings size={16} />, onSelect: () => { navigate("/settings"); onNavigate?.(); } },
            "separator",
            { label: "Sign out", icon: <LogOut size={16} />, danger: true, onSelect: signOut },
          ]}
        />
      </div>
    </aside>
  );
}
