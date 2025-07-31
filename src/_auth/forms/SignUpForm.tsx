
  import { Link, useNavigate } from 'react-router-dom';
  import { useForm } from "react-hook-form";
  import z from 'zod';
  import { zodResolver } from "@hookform/resolvers/zod";
  import axios from 'axios'; // Make sure axios is imported
  import { useState } from 'react'; // Import useState for loading and error states

  import { Button } from "@/components/ui/button";
  import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
  import { Input } from "@/components/ui/input";
  import { SignUpValidation } from "@/lib/validation";
  import { Loader } from 'lucide-react';

  const SignUpForm = () => {
    // --- NEW: State for loading indicator ---
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const form = useForm<z.infer<typeof SignUpValidation>>({
      resolver: zodResolver(SignUpValidation),
      defaultValues: {
        name: "",
        username: "",
        email: "",
        password: "",
      },
    });

    // --- UPDATED: Submit handler with detailed error logging ---
    async function onSubmit(values: z.infer<typeof SignUpValidation>) {
      setIsLoading(true);
      try {
        const response = await axios.post('http://localhost:5000/api/auth/register', values);

        if (response.status === 201) {
          console.log('User registered!', response.data);
          form.reset();
          navigate('/sign-in');
        }
      } catch (error) {
        console.error("🔥 An error occurred in the submit handler!");

        if (axios.isAxiosError(error)) {
          // This is an error from a server response (e.g., 400, 409, 500)
          console.error("Axios error response:", error.response?.data);
          console.error("Axios error status:", error.response?.status);
        } else {
          // This is likely a network error, CORS error, or a setup issue.
          console.error("Non-Axios error:", error);
        }
      } finally {
        setIsLoading(false);
      }
    }

    return (
      <Form {...form}>
        <div className="sm:w-420 flex-center flex-col">
          <img src="/assets/images/logo.svg" alt="logo" />
          <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
            Create a new account
          </h2>
          <p className="text-light-3 small-medium md:base-regular mt-2">
            To use PawsGram, Please enter your details
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input type="text" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input type="text" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" className="shad-input" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input type="password" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="shad-button_primary" disabled={isLoading}>
              {isLoading ? (
                <div className="flex-center gap-2">
                  <Loader /> Loading...
                </div>
              ) : "Sign Up"}
            </Button>
            <p className="text-small-regular text-light-2 text-center mt-2">
              Already have an account?
              <Link to="/sign-in" className="text-primary-500 text-small-semibold ml-1">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </Form>
    )
  }

  export default SignUpForm;