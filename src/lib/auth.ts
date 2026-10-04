// Simple auth utilities for demo purposes
// In production, this would use Supabase Auth

export interface User {
  id: string;
  email: string;
  name: string;
}

// Demo user for testing
const DEMO_USER: User = {
  id: "demo-user-1",
  email: "demo@hydrascout.online",
  name: "Demo User",
};

export async function getCurrentUser(): Promise<User | null> {
  // For demo, always return the demo user
  // In production, this would check the session/token
  if (typeof window !== "undefined") {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
      return DEMO_USER;
    }
  }
  return null;
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  // Demo sign in - accept any credentials
  if (email && password) {
    if (typeof window !== "undefined") {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", email);
    }
    return { user: DEMO_USER, error: null };
  }
  return { user: null, error: "Invalid credentials" };
}

export async function signOut(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
  }
}

export function useAuth() {
  return {
    user: DEMO_USER,
    signIn,
    signOut,
    isLoading: false,
  };
}
