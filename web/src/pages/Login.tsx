import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Lock, ArrowLeft } from "lucide-react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import authService from "@/services/auth";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.login(formData);
      toast({
        title: "Welcome back",
        description: "Successfully logged in to your account.",
      });
      navigate("/dashboard");    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message && error.message.includes("credentials")) {
        toast({
          title: "Invalid credentials",
          description: "Email or password is incorrect. Please try again.",
          variant: "destructive",
          duration: 5000, // 5 seconds duration for error messages
        });
      } else if (error.message && error.message.includes("connect")) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to server. Please check your internet connection.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Login Error",
          description: error.message || "Something went wrong. Please try again later.",
          variant: "destructive",
          duration: 5000, // 5 seconds duration for error messages
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <RouterLink to="/" className="inline-flex items-center text-gray-400 hover:text-gray-300 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </RouterLink>
          <div className="flex justify-center items-center mb-4">
            <Shield className="w-12 h-12 text-blue-500 mr-3" />
            <h1 className="text-3xl font-bold text-white">
              LinkGuardian
            </h1>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
            <CardDescription className="text-gray-400">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Your secure password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:scale-105"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                New to LinkGuardian?{" "}
                <RouterLink
                  to="/signup"
                  className="text-blue-500 hover:text-blue-400 font-semibold transition-colors"
                >
                  Create an account
                </RouterLink>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
