import React from "react";

type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { console.error("UI ErrorBoundary:", error, info); }
  render() {
    if (this.state.hasError) {
      return <div className="container" style={{ paddingTop: 16 }}>
        <div className="alert"><b>Ocorreu um erro na interface.</b><br/>{String(this.state.error?.message || this.state.error)}</div>
        <div style={{ marginTop: 8 }}><button className="btn" onClick={()=>window.location.reload()}>Recarregar</button></div>
      </div>;
    }
    return this.props.children;
  }
}
