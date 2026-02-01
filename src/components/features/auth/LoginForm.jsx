import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function LoginForm({ onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(""); 
  const navigate = useNavigate();

  async function onSubmit(event) {
    event.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      if (onLoginSuccess) {
        onLoginSuccess({ email });
      }
      console.log("Logged in");
      navigate("/dashboard");
    }, 1500);
  }

  return (
    // UPDATED: rounded-md, border-border, and softer shadow
    <Card className="w-full max-w-md mx-auto shadow-md rounded-md border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-foreground">Sign in</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Login */}
        {/* UPDATED: rounded-md */}
        <Button variant="outline" className="w-full rounded-md border-input hover:bg-accent hover:text-accent-foreground" disabled={isLoading}>
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
          </svg>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="bg-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            {/* UPDATED: rounded-md */}
            <Input 
              id="email" 
              type="email" 
              placeholder="m@example.com" 
              required 
              disabled={isLoading} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md bg-background border-input"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            {/* UPDATED: rounded-md */}
            <Input 
                id="password" 
                type="password" 
                required 
                disabled={isLoading} 
                className="rounded-md bg-background border-input"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
            <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground">
              Remember me
            </Label>
          </div>

          {/* UPDATED: rounded-md */}
          <Button type="submit" className="w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}