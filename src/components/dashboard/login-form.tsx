"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Loader2, Eye, EyeOff } from "lucide-react";

const ADMIN_EMAIL = "admin@seoexpert.com";
const ADMIN_PASSWORD = "Santafee@1972-2907";

export function LoginForm() {
  const { setIsAuthenticated, setUser } = useAppStore();
  const [email, setEmail] = useState("admin@seoexpert.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const userData = {
        id: "admin-001",
        email: ADMIN_EMAIL,
        name: "Admin",
        role: "admin",
      };
      const token = btoa(JSON.stringify({ ...userData, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
      localStorage.setItem("seo_token", token);
      localStorage.setItem("seo_user", JSON.stringify(userData));
      setIsAuthenticated(true);
      setUser(userData);
    } else {
      setError("Invalid email or password. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-background via-background to-emerald-50/50 dark:to-emerald-950/20 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
            <Globe className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SEO Expert</h1>
          <p className="text-sm text-muted-foreground">
            Premium SEO Analytics Platform
          </p>
        </div>

        <Card className="shadow-xl border-0 shadow-black/5 dark:shadow-black/20">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@seoexpert.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          &copy; 2024 SEO Expert. Enterprise SEO Platform.
        </p>
      </div>
    </div>
  );
}
