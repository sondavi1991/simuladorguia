import { Link, useLocation } from "wouter";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              {/* Logo recreation based on uploaded image */}
              <div className="relative w-12 h-12 mr-3">
                <div className="absolute inset-0 border-4 border-gups-teal rounded-full border-t-transparent transform rotate-45"></div>
                <div className="absolute inset-2 bg-gups-teal rounded-md flex items-center justify-center">
                  <div className="w-3 h-3 bg-gups-red rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-gups-teal font-bold text-xl leading-none">guia</div>
                <div className="text-xs text-gray-600 -mt-1 leading-none">dos planos de saúde</div>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button 
                variant={location === "/admin" ? "default" : "ghost"} 
                size="sm"
                className={location === "/admin" ? "bg-gups-teal hover:bg-gups-teal/90" : ""}
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
