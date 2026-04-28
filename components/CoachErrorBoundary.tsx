"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { T } from "@/lib/design/tokens";

interface Props {
  children: ReactNode;
}

interface State {
  errorCount: number;
  hasError: boolean;
}

export default class CoachErrorBoundary extends Component<Props, State> {
  state: State = { errorCount: 0, hasError: false };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.warn("[CoachPanel] render error", err, info);
    this.setState((s) => ({ errorCount: s.errorCount + 1 }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px 16px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.55)",
            border: `1px solid rgba(31,42,68,0.08)`,
            textAlign: "center",
            fontFamily: T.fontUI,
            color: T.textMed,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontSize: 24, display: "block", marginBottom: 8 }}>😴</span>
          Coach Pawn is resting — the game keeps going!
          <br />
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: 10,
              fontSize: 12,
              fontFamily: T.fontUI,
              fontWeight: 700,
              background: "transparent",
              border: `1.5px solid rgba(31,42,68,0.14)`,
              borderRadius: 8,
              padding: "4px 12px",
              cursor: "pointer",
              color: T.textMed,
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
