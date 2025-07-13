import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Plus, Eye, BarChart, Hash, Clock, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { useEffect, useState } from "react";
import linkService, { Link as LinkInterface } from "@/services/links";

// Utility function to decode JWT token
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

const Dashboard = () => {
  const [links, setLinks] = useState<LinkInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");

  // Get username from JWT token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = decodeJWT(token);
      if (decodedToken && decodedToken.username) {
        setUsername(decodedToken.username);
      }
    }
  }, []);
  // Fetch links on component mount
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const fetchedLinks = await linkService.getLinks();
        console.log('Raw fetched links:', fetchedLinks);
        console.log('First link structure:', fetchedLinks[0]);
        setLinks(fetchedLinks);
      } catch (error) {
        console.error('Failed to fetch links:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);  const stats = {
    totalLinks: links.length,
    totalClicks: links.reduce((sum, link) => sum + link.click_count, 0),
    activeLinks: links.filter(link => {
      // Debug logging for each link
      console.log(`Checking link ${link.slug}:`, {
        deleted_at: link.deleted_at,
        deleted_at_type: typeof link.deleted_at,
        expires_at: link.expires_at,
        expires_at_type: typeof link.expires_at,
        click_limit: link.click_limit,
        click_limit_type: typeof link.click_limit,
        click_count: link.click_count
      });
      
      // Link is active if:
      // 1. Not deleted (deleted_at is null)
      // 2. Not expired (expires_at is null or in the future)
      // 3. Not reached click limit (click_limit is null or click_count < click_limit)
      const isNotDeleted = !link.deleted_at;
      const isNotExpired = !link.expires_at || new Date(link.expires_at) > new Date();
      const isWithinClickLimit = !link.click_limit || link.click_count < link.click_limit;
      
      console.log(`Link ${link.slug} filters:`, {
        isNotDeleted,
        isNotExpired,
        isWithinClickLimit,
        isActive: isNotDeleted && isNotExpired && isWithinClickLimit
      });
      
      return isNotDeleted && isNotExpired && isWithinClickLimit;
    }).length,
    clicksToday: 143 // Still mock for now
  };
  const recentLinks = links
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
    .map(link => ({
      slug: link.slug,
      target_url: link.target_url,
      clicks: link.click_count
    }));

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="container mx-auto px-4 py-8">        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back{username ? `, ${username}` : ""}!
          </h2>
          <p className="text-gray-400">Here's what's happening with your links today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Links</CardTitle>
              <Link2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalLinks}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Clicks</CardTitle>
              <Hash className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalClicks}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active Links</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeLinks}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Clicks Today</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.clicksToday}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Plus className="w-5 h-5 mr-2 text-blue-500" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-gray-400">
                Get started with common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">              <Link to="/links/create">
                <Button className="w-full bg-gray-800 hover:bg-blue-600 text-white font-semibold transition-all duration-300 hover:scale-105">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Link
                </Button>
              </Link><Link to="/links">
                <Button variant="outline" className="w-full border-gray-600 text-white bg-gray-800 hover:bg-blue-600 hover:text-white transition-all duration-300">
                  <Link2 className="w-4 h-4 mr-2" />
                  Manage Links
                </Button>
              </Link>
              <Link to="/analytics">
                <Button variant="outline" className="w-full border-gray-600 text-white bg-gray-800 hover:bg-blue-600 hover:text-white transition-all duration-300">
                  <BarChart className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-500" />
                Recent Links
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your most recently created links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLinks.map((link) => (
                  <div key={link.slug} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div>
                      <code className="text-blue-400 text-sm font-mono">/l/{link.slug}</code>
                      <p className="text-xs text-gray-500 truncate max-w-48">{link.target_url}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{link.clicks}</p>
                      <p className="text-xs text-gray-500">clicks</p>
                    </div>
                  </div>
                ))}
                <Link to="/links" className="block">
                  <Button variant="ghost" className="w-full text-blue-400 hover:text-blue-300 hover:bg-gray-800">
                    View All Links →
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
