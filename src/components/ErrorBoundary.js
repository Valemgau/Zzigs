// src/components/ErrorBoundary.js
import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView style={styles.container}>
          <Text style={styles.title}>Une erreur est survenue :</Text>
          <Text style={styles.error}>{this.state.error?.toString()}</Text>
          <Text style={styles.stack}>{this.state.info?.componentStack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  error: { color: "red", fontSize: 16, marginBottom: 10 },
  stack: { fontFamily: "monospace", color: "#333" },
});

export default ErrorBoundary;
