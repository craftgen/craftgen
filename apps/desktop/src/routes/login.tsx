import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { open } from "@tauri-apps/plugin-shell";
import { z } from "zod";

import { Button } from "@craftgen/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@craftgen/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  useForm,
} from "@craftgen/ui/components/form";
import { Icons } from "@craftgen/ui/components/icons";
import { Input } from "@craftgen/ui/components/input";
import { Label } from "@craftgen/ui/components/label";
import { toast } from "@craftgen/ui/components/use-toast";

import { useOAuth } from "../hooks/use-auth-callback";
import { createClient } from "../libs/supabase";

export const LoginPage = () => {
  const { signup, redirect } = Route.useSearch();
  return (
    <div className="flex h-full min-h-screen w-full flex-col items-center justify-center">
      <Link to="/">
        <Button className="absolute left-4 top-4">
          <Icons.arrowLeft />
          Go Home
        </Button>
      </Link>
      <AuthForm isSignup={signup} redirect={redirect} />
    </div>
  );
};

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z.string().optional(),
    signup: z.boolean().optional(),
  }),
  component: LoginPage,
});

function getLocalHostUrl(port: number) {
  return `http://localhost:${port}`;
}

const formSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function AuthForm({
  isSignup,
  redirect,
}: {
  isSignup?: boolean;
  redirect?: string;
}) {
  const supabase = createClient();
  const navigate = useNavigate();
  const port = useOAuth({
    onSuccess: () => {
      if (redirect) {
        navigate({
          to: redirect,
        });
      } else {
        navigate({
          to: "/",
        });
      }
    },
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (isSignup) {
      const signup = supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      toast.promise(signup, {
        loading: "Signing up...",
        success: () => {
          navigate({
            to: redirect || "/",
          });
          return "Account created successfully";
        },
        error: () => "Failed to create account",
      });
    } else {
      const login = supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      toast.promise(login, {
        loading: "Logging in...",
        success: () => {
          navigate({
            to: redirect || "/",
          });
          return "Logged in successfully";
        },
        error: () => "Failed to log in",
      });
    }
  };

  const onProviderLogin = (provider: "google" | "github") => async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      options: {
        skipBrowserRedirect: true,
        scopes: provider === "google" ? "profile email" : "",
        redirectTo: getLocalHostUrl(port!),
      },
      provider: provider,
    });

    if (data.url) {
      // console.log("OPENING", data.url);
      open(data.url);
    } else {
      alert(error?.message);
    }
  };
  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">
          {isSignup ? "Sign Up" : "Login"}
        </CardTitle>
        <CardDescription>
          {isSignup ? "Enter your information to create an account" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="email">Email</Label>
                      <FormControl>
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="m@example.com"
                          required
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="password">Password</Label>
                      <FormControl>
                        <Input
                          {...field}
                          id="password"
                          type="password"
                          placeholder="Password"
                          required
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full">
                Create an account
              </Button>
            </form>
          </Form>
          <Button
            variant="outline"
            className="w-full p-4"
            onClick={onProviderLogin("google")}
          >
            <Icons.google className="h-6 w-6" />
            Sign up with Google
          </Button>
        </div>
        <div className="mt-4 text-center text-sm">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <Link
            to="/login"
            search={{ redirect, signup: !isSignup }}
            className="underline"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
