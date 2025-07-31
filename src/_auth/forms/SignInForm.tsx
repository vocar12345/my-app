import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import z from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import axios from 'axios';
import { Loader } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const SignInValidation = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

const SignInForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  const form = useForm<z.infer<typeof SignInValidation>>({
    resolver: zodResolver(SignInValidation),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof SignInValidation>) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', values);
      
      auth.login(response.data.token);
      // The navigate('/') line that was here has been removed.

    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Login failed.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col">
        <img src="/assets/images/logo.svg" alt="logo" />
        <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">Log in to your account</h2>
        <p className="text-light-3 small-medium md:base-regular mt-2">
          Welcome back! Please enter your details.
        </p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full mt-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" className="shad-input" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input type="password" className="shad-input" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="shad-button_primary" disabled={isLoading}>
            {isLoading ? (<div className="flex-center gap-2"><Loader /> Loading...</div>) : "Log in"}
          </Button>
          <p className="text-small-regular text-light-2 text-center mt-2">
            Don't have an account?
            <Link to="/sign-up" className="text-primary-500 text-small-semibold ml-1">Sign up</Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SignInForm;