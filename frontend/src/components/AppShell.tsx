import { ReactNode } from "react";
import { NavBar } from "./NavBar";

interface AppShellProps {
  eyebrow?: string;
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** Standard authenticated page: gridded backdrop + framed panel + nav + header. */
export function AppShell({ eyebrow, title, actions, children }: AppShellProps) {
  return (
    <div className="neon-backdrop" style={{ padding: "32px 40px" }}>
      <div className="frame" style={{ maxWidth: 1440, margin: "0 auto" }}>
        <div className="frame-inner">
          <NavBar />
          {(title || actions) && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 20,
                marginTop: 22,
              }}
            >
              <div>
                {eyebrow && <div className="eyebrow">{eyebrow}</div>}
                {title && <h1 className="h1">{title}</h1>}
              </div>
              {actions}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
