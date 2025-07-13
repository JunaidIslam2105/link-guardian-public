import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, Hash, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import linkService from "@/services/links";

const CreateLink = () => {
  const [linkForm, setLinkForm] = useState({
    target_url: "",
    expires_at: "",
    click_limit: ""
  });
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingLink(true);

    try {
      // Prepare payload
      const payload: any = {
        target_url: linkForm.target_url,
      };
      if (linkForm.expires_at) {
        // Convert to RFC3339 format: "YYYY-MM-DDTHH:mm:00Z"
        let expiresAt = linkForm.expires_at;
        if (expiresAt.length === 16) {
          expiresAt = expiresAt + ":00Z";
        }
        payload.expires_at = expiresAt;
      }
      if (linkForm.click_limit) {
        payload.click_limit = Number(linkForm.click_limit);
      }
      // Call the real API
      const createdLink = await linkService.createLink(payload);
      toast({
        title: "Link created successfully",
        description: `Your short URL: ${window.location.origin}/l/${createdLink.slug}`,
      });
      setLinkForm({ target_url: "", expires_at: "", click_limit: "" });
      setIsCreatingLink(false);
      navigate("/links");
    } catch (error: any) {
      toast({
        title: "Server Error",
        description: error.message || "Failed to create link. Please try again later.",
        variant: "destructive",
      });
      setIsCreatingLink(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/links">
            <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Links
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Create New Link</h2>
            <p className="text-gray-400">Generate a secure shortened link with advanced controls</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Plus className="w-5 h-5 mr-2 text-blue-500" />
                Link Details
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure your shortened link settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLinkSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="target_url" className="text-white">
                    Target URL *
                  </Label>
                  <Input
                    id="target_url"
                    type="url"
                    required
                    value={linkForm.target_url}
                    onChange={(e) => setLinkForm({ ...linkForm, target_url: e.target.value })}
                    placeholder="https://example.com"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500">
                    The URL where users will be redirected
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at" className="text-white flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Expires At (Optional)
                  </Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={linkForm.expires_at}
                    onChange={(e) => setLinkForm({ ...linkForm, expires_at: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500">
                    Link will automatically expire after this date
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="click_limit" className="text-white flex items-center">
                    <Hash className="w-4 h-4 mr-2" />
                    Click Limit (Optional)
                  </Label>
                  <Input
                    id="click_limit"
                    type="number"
                    min="1"
                    value={linkForm.click_limit}
                    onChange={(e) => setLinkForm({ ...linkForm, click_limit: e.target.value })}
                    placeholder="e.g., 100"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500">
                    Link will stop working after this many clicks
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isCreatingLink}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 hover:scale-105"
                  >
                    {isCreatingLink ? "Creating..." : "Create Link"}
                  </Button>                  <Link to="/links">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-600 text-white bg-gray-800 hover:bg-blue-600 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateLink;
