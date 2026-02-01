import React, { useState } from "react";
import { Link } from "react-router-dom"; // Import Link for client-side routing
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  }

  return (
    // UPDATED: rounded-md, border-border, bg-card
    <Card className="w-full max-w-lg mx-auto shadow-md rounded-md border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-foreground">
          Create an account
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Sign Up */}
        {/* UPDATED: rounded-md */}
        <Button variant="outline" className="w-full rounded-md border-input hover:bg-accent hover:text-accent-foreground" disabled={isLoading}>
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          Sign up with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="bg-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              {/* UPDATED: rounded-md */}
              <Input
                id="name"
                placeholder="John Doe"
                required
                disabled={isLoading}
                className="rounded-md bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age" className="text-foreground">Age</Label>
              {/* UPDATED: rounded-md */}
              <Input
                id="age"
                type="number"
                placeholder="25"
                min="13"
                max="120"
                required
                disabled={isLoading}
                className="rounded-md bg-background border-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="text-foreground">Gender</Label>
            <Select>
              {/* UPDATED: rounded-md */}
              <SelectTrigger id="gender" className="w-full rounded-md bg-background border-input">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>

              {/* UPDATED: rounded-md */}
              <SelectContent className="rounded-md bg-popover border-border">
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="other">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            {/* UPDATED: rounded-md */}
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              disabled={isLoading}
              className="rounded-md bg-background border-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            {/* UPDATED: rounded-md */}
            <Input
              id="password"
              type="password"
              required
              disabled={isLoading}
              className="rounded-md bg-background border-input"
            />
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox id="terms" required className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
            <Label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
            >
              I agree to the{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </Label>
          </div>

          {/* UPDATED: rounded-md */}
          <Button type="submit" className="w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}