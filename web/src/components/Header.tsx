import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const handleLogout = () => {
    localStorage.removeItem("token");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };
  return (
    <div className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center cursor-pointer" onClick={() => navigate("/dashboard")}>
          <Shield className="w-8 h-8 text-blue-500 mr-3" />
          <h1 className="text-2xl font-bold text-white">
            LinkGuardian
          </h1>
        </div>        <Button
          onClick={handleLogout}
          variant="outline"
          className="border-gray-600 text-white bg-gray-800 hover:bg-gray-700 hover:text-white transition-all duration-300"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Header;
