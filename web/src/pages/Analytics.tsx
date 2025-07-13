import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Filter, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import logService, { AccessLog } from "@/services/logs";
import linkService, { Link as LinkType } from "@/services/links";
import authService from "@/services/auth";

interface Log {
  id: number;
  link_id: string;
  link_slug?: string; // Added to store the resolved slug
  accessed_at: string;
  ip_address: string;
  user_agent: string;
}

const Analytics = () => {
  const location = useLocation();
  const linkSlug = location.state?.linkSlug || "";
    const [logs, setLogs] = useState<Log[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [linkFilter, setLinkFilter] = useState(linkSlug);
  const [logLimit, setLogLimit] = useState("50");
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  useEffect(() => {
    // Load links first to use as a cache for resolving slugs
    const fetchLinks = async () => {
      try {
        const fetchedLinks = await linkService.getLinks();
        setLinks(fetchedLinks);
      } catch (error) {
        console.error("Error fetching links:", error);
      }
    };
    
    fetchLinks().then(() => fetchLogs());
  }, []);  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      // Get the current user ID from the JWT token
      const userId = authService.getCurrentUserId();
      const logs = await logService.getLogsByUser(userId, parseInt(logLimit));
      
      // Map link_id to string and resolve slugs - ensure we have all links loaded
      if (links.length === 0) {
        try {
          const fetchedLinks = await linkService.getLinks();
          setLinks(fetchedLinks);
        } catch (error) {
          console.error("Error fetching links:", error);
        }
      }
      
      // Map link_id to string and resolve slugs
      const mappedLogs = logs.map((log: any) => {
        // Find slug from links cache
        const link = links.find(l => l.id === Number(log.link_id));
        const slug = link ? link.slug : String(log.link_id);
        
        return {
          ...log,
          link_id: String(log.link_id),
          link_slug: slug
        };
      });
      
      setLogs(mappedLogs);
    } catch (error) {
      // Optionally show a toast or error message
      setLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  };// Sort logs by ID from smallest to largest and filter by slug
  const filteredLogs = logs
    .filter(log => !linkFilter || 
      (log.link_slug && log.link_slug.toLowerCase().includes(linkFilter.toLowerCase())))
    .sort((a, b) => a.id - b.id)
    .slice(0, parseInt(logLimit));

  // Helper functions for stats calculations
  const calculateUniqueVisitors = (logs: Log[]) => {
    // Count unique IP addresses
    const uniqueIPs = new Set(logs.map(log => log.ip_address));
    return uniqueIPs.size;
  };

  const findTopLink = (logs: Log[]) => {
    // Count occurrences of each link slug
    const linkCounts: Record<string, number> = {};
    logs.forEach(log => {
      const slug = log.link_slug || log.link_id;
      linkCounts[slug] = (linkCounts[slug] || 0) + 1;
    });

    // Find the link with the most visits
    let topLink = '';
    let maxCount = 0;
    Object.entries(linkCounts).forEach(([slug, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topLink = slug;
      }
    });

    return topLink || 'No data';
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard">
            <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Analytics</h2>
            <p className="text-gray-400">Monitor and analyze link access patterns</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Clicks Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">143</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Unique Visitors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{calculateUniqueVisitors(logs)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Top Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-blue-400">{findTopLink(logs)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Click Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">87%</div>
            </CardContent>
          </Card>
        </div>

        {/* Access Logs */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-500" />
              Access Logs
            </CardTitle>
            <CardDescription className="text-gray-400">
              Detailed tracking of link access activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">                <Label htmlFor="link-filter" className="text-white text-sm mb-2 block">
                  Filter by Link Slug
                </Label>
                <Input
                  id="link-filter"
                  value={linkFilter}
                  onChange={(e) => setLinkFilter(e.target.value)}
                  placeholder="e.g., abc123"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="log-limit" className="text-white text-sm mb-2 block">
                  Limit
                </Label>
                <Select value={logLimit} onValueChange={setLogLimit}>
                  <SelectTrigger className="w-24 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={fetchLogs}
                  disabled={isLoadingLogs}
                  className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {isLoadingLogs ? "Loading..." : "Filter"}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 overflow-hidden">
              <Table>                <TableHeader className="bg-gray-800">
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">ID</TableHead>
                    <TableHead className="text-gray-300">Link Slug</TableHead>
                    <TableHead className="text-gray-300">Accessed At</TableHead>
                    <TableHead className="text-gray-300">IP Address</TableHead>
                    <TableHead className="text-gray-300">User Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="border-gray-700 hover:bg-gray-800 transition-colors">
                      <TableCell className="text-white">{log.id}</TableCell>
                      <TableCell className="text-blue-400 font-mono">{log.link_slug || log.link_id}</TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(log.accessed_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-blue-400">{log.ip_address}</TableCell>
                      <TableCell className="text-gray-300 max-w-xs truncate">
                        {log.user_agent}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
