import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Link, Zap, Eye, ArrowRight } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center mb-6">
            <Shield className="w-16 h-16 text-blue-500 mr-4" />
            <h1 className="text-6xl font-bold text-white">
              LinkGuardian
            </h1>
          </div>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Professional link management with enterprise-grade security and analytics.
          </p>
          <div className="flex gap-4 justify-center">
            <RouterLink to="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </RouterLink>
            <RouterLink to="/login">
              <Button variant="outline" size="lg" className="border-gray-600 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105">
                Sign In
              </Button>
            </RouterLink>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-500 hover:scale-105">
            <CardHeader className="text-center">
              <Link className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-white">Smart Link Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-400 text-center">
                Create secure, shortened links with advanced expiration controls and access limitations.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-500 hover:scale-105">
            <CardHeader className="text-center">
              <Eye className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-white">Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-400 text-center">
                Comprehensive tracking with detailed visitor logs and real-time access monitoring.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-500 hover:scale-105">
            <CardHeader className="text-center">
              <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-white">Enterprise Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-400 text-center">
                Lightning-fast redirects with 99.9% uptime and global edge caching.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready for professional link management?</h2>
          <p className="text-gray-400 mb-8">Join thousands of professionals who trust LinkGuardian.</p>
          <RouterLink to="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105">
              Start Your Journey
            </Button>
          </RouterLink>
        </div>
      </div>
    </div>
  );
};

export default Index;
