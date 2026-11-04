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
    <div className="neon-backdrop" style={{ padding: "26px 28px" }}>
      <div className="frame" style={{ maxWidth: "min(1920px, 96vw)", margin: "0 auto" }}>
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
