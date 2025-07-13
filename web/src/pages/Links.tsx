import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link2, Plus, Search, Copy, Edit, Trash2, Clock, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import linkService, { Link as LinkInterface } from "@/services/links";

const BACKEND_BASE_URL = import.meta.env.VITE_API_URL;

function mapNullableField(field: any, valueKey: string) {
  if (field && typeof field === "object" && "Valid" in field) {
    return field.Valid ? field[valueKey] : null;
  }
  return field ?? null;
}

const Links = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [links, setLinks] = useState<LinkInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active">("all");
  const [sortBy, setSortBy] = useState<"recent" | "clicks">("recent");
  const { toast } = useToast();

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const fetchedLinks = await linkService.getLinks();
        const mappedLinks = fetchedLinks.map((link) => ({
          ...link,
          expires_at: mapNullableField(link.expires_at, "Time"),
          click_limit: mapNullableField(link.click_limit, "Int32"),
          deleted_at: mapNullableField(link.deleted_at, "Time"),
          user_id: mapNullableField(link.user_id, "Int32"),
          clicks: link.click_count,
        })).filter(Boolean);
        setLinks(mappedLinks);
      } catch (error) {
        console.error('Failed to fetch links:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, []);

  const copyToClipboard = (slug: string) => {
    const url = `${BACKEND_BASE_URL}/l/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied", description: "Link copied to clipboard" });
  };
  const deleteLink = async (slug: string) => {
    try {
      await linkService.deleteLink(slug);
      // After successful deletion, update UI
      setLinks((prev) => prev.filter((l) => l.slug !== slug));
      toast({ 
        title: "Deleted", 
        description: `Link /l/${slug} deleted successfully` 
      });
    } catch (error: any) {
      console.error('Failed to delete link:', error);
      // Show error message to user
      toast({
        title: "Error",
        description: error.message || `Failed to delete link /l/${slug}`,
        variant: "destructive"
      });
    }
  };

  const now = new Date();

  const filteredLinks = links
    .filter(link => {
      const matchSearch = link.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          link.target_url.toLowerCase().includes(searchTerm.toLowerCase());
      const isExpired = link.expires_at && new Date(link.expires_at) < now;
      if (filter === "active" && isExpired) return false;
      return matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return (b.click_count ?? 0) - (a.click_count ?? 0);
    });

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Your Links</h2>
            <p className="text-gray-400">Manage and monitor all your shortened links</p>
          </div>
          <Link to="/links/create">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 hover:scale-105">
              <Plus className="w-4 h-4 mr-2" />
              Create Link
            </Button>
          </Link>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            className={
              filter === "all"
                ? "text-white border-gray-700 bg-blue-600 hover:bg-blue-700"
                : "text-white border border-gray-700 bg-transparent hover:bg-gray-800"
            }
            onClick={() => setFilter("all")}
          >
            Show All
          </Button>
          <Button
            variant={filter === "active" ? "default" : "ghost"}
            className={
              filter === "active"
                ? "text-white border-gray-700 bg-blue-600 hover:bg-blue-700"
                : "text-white border border-gray-700 bg-transparent hover:bg-gray-800"
            }
            onClick={() => setFilter("active")}
          >
            Active Only
          </Button>
          <Button
            variant={sortBy === "recent" ? "default" : "ghost"}
            className={
              sortBy === "recent"
                ? "text-white border-gray-700 bg-blue-600 hover:bg-blue-700"
                : "text-white border border-gray-700 bg-transparent hover:bg-gray-800"
            }
            onClick={() => setSortBy("recent")}
          >
            <Clock className="w-4 h-4 mr-2" />
            Sort by Recent
          </Button>
          <Button
            variant={sortBy === "clicks" ? "default" : "ghost"}
            className={
              sortBy === "clicks"
                ? "text-white border-gray-700 bg-blue-600 hover:bg-blue-700"
                : "text-white border border-gray-700 bg-transparent hover:bg-gray-800"
            }
            onClick={() => setSortBy("clicks")}
          >
            <Flame className="w-4 h-4 mr-2" />
            Sort by Clicks
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-500" />
              Search Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by slug or URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
            />
          </CardContent>
        </Card>

        {loading ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center text-gray-400">Loading links...</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredLinks.map((link) => {
              const isExpired = link.expires_at && new Date(link.expires_at) < now;
              return (
                <Card key={link.slug} className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-blue-400 text-lg font-mono">/l/{link.slug}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(link.slug)}
                            className="p-1 h-auto text-gray-400 hover:text-blue-400"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {isExpired && (
                            <span className="text-red-500 text-sm font-semibold ml-2">[Expired]</span>
                          )}
                        </div>
                        <p className="text-gray-300 mb-2 truncate">{link.target_url}</p>
                        <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                          <span>Created: {link.created_at ? new Date(link.created_at).toLocaleDateString() : 'Unknown'}</span>
                          {link.expires_at && (
                            <span>Expires: {new Date(link.expires_at).toLocaleDateString()}</span>
                          )}
                          {link.click_limit && <span>Limit: {link.click_limit} clicks</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">{link.click_count}</p>
                          <p className="text-sm text-gray-400">clicks</p>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/links/${link.slug}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </Link>                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-white"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete this link: /l/${link.slug}?`)) {
                                deleteLink(link.slug);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {!loading && filteredLinks.length === 0 && (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-12 text-center">
                  <Link2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No links found</h3>
                  <p className="text-gray-400 mb-6">
                    {searchTerm ? "Try adjusting your search terms" : "Create your first link to get started"}
                  </p>
                  <Link to="/links/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Link
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Links;
