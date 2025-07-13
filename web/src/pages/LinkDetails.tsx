import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Calendar, Hash, ArrowLeft, Copy, Trash2, BarChart } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface LinkData {
  slug: string;
  target_url: string;
  created_at: string;
  expires_at?: string;
  click_limit?: number;
  clicks: number;
}

const LinkDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    target_url: "",
    expires_at: "",
    click_limit: ""
  });

  useEffect(() => {
    // Mock data - in real app, fetch based on slug
    const mockData: LinkData = {
      slug: slug || "",
      target_url: "https://example.com",
      created_at: "2024-01-15T10:30:00Z",
      expires_at: "2024-02-15T10:30:00Z",
      click_limit: 100,
      clicks: 45
    };
    
    setLinkData(mockData);
    setEditForm({
      target_url: mockData.target_url,
      expires_at: mockData.expires_at || "",
      click_limit: mockData.click_limit?.toString() || ""
    });
  }, [slug]);

  const handleSave = () => {
    toast({
      title: "Link updated",
      description: "Your link has been updated successfully.",
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    toast({
      title: "Link deleted",
      description: "Your link has been deleted successfully.",
    });
    navigate("/links");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Link copied to clipboard",
    });
  };

  if (!linkData) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

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
            <h2 className="text-3xl font-bold text-white mb-2">Link Details</h2>
            <p className="text-gray-400">View and manage your link settings</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Link Info */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-blue-500" />
                  Link Information
                </span>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Short URL</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-blue-400 text-lg font-mono bg-gray-800 p-3 rounded border border-gray-700">
                      /l/{linkData.slug}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`${window.location.origin}/l/${linkData.slug}`)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-white mb-2 block">Total Clicks</Label>
                  <div className="text-3xl font-bold text-white bg-gray-800 p-3 rounded border border-gray-700">
                    {linkData.clicks}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="target_url" className="text-white">Target URL</Label>
                  <Input
                    id="target_url"
                    value={editForm.target_url}
                    onChange={(e) => setEditForm({ ...editForm, target_url: e.target.value })}
                    disabled={!isEditing}
                    className="bg-gray-800 border-gray-700 text-white disabled:opacity-70"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expires_at" className="text-white flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Expires At
                    </Label>
                    <Input
                      id="expires_at"
                      type="datetime-local"
                      value={editForm.expires_at}
                      onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-700 text-white disabled:opacity-70"
                    />
                  </div>

                  <div>
                    <Label htmlFor="click_limit" className="text-white flex items-center">
                      <Hash className="w-4 h-4 mr-2" />
                      Click Limit
                    </Label>
                    <Input
                      id="click_limit"
                      type="number"
                      value={editForm.click_limit}
                      onChange={(e) => setEditForm({ ...editForm, click_limit: e.target.value })}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-700 text-white disabled:opacity-70"
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Actions</CardTitle>
              <CardDescription className="text-gray-400">
                Manage your link settings and data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Link to="/analytics" state={{ linkSlug: linkData.slug }}>
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                    <BarChart className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Link
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white ml-2">
                    {new Date(linkData.created_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Slug:</span>
                  <span className="text-white ml-2">{linkData.slug}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LinkDetails;
