import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary Caught:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn("Failed to clear localStorage", e);
    }
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: "50px 20px", 
          textAlign: "center", 
          background: "#090d16", 
          color: "#f8fafc", 
          minHeight: "100vh", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif"
        }}>
          <div style={{ fontSize: "56px", marginBottom: "20px" }}>⚠️</div>
          <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#f43f5e", marginBottom: "12px" }}>
            Application Recovery Mode
          </h1>
          <p style={{ fontSize: "16px", color: "#94a3b8", maxWidth: "580px", marginBottom: "24px", lineHeight: "1.6" }}>
            We detected a temporary browser rendering glitch or incompatible cached session data from a previous test run.
          </p>
          {this.state.error && (
            <div style={{ 
              background: "rgba(244,63,94,0.08)", 
              border: "1px solid rgba(244,63,94,0.3)", 
              padding: "16px 20px", 
              borderRadius: "12px", 
              color: "#fca5a5", 
              marginBottom: "30px", 
              maxWidth: "680px", 
              width: "100%",
              overflowX: "auto", 
              fontFamily: "monospace", 
              fontSize: "13px", 
              textAlign: "left",
              whiteSpace: "pre-wrap"
            }}>
              <strong>Error Details:</strong> {this.state.error.toString()}
            </div>
          )}
          <button
            onClick={this.handleReset}
            style={{ 
              background: "linear-gradient(135deg, #10b981, #059669)", 
              color: "#fff", 
              padding: "15px 32px", 
              borderRadius: "12px", 
              border: "none", 
              fontSize: "16px", 
              fontWeight: "700", 
              cursor: "pointer", 
              boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
              transition: "transform 0.2s ease"
            }}
          >
            🔄 Clear Cached State & Restore Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
