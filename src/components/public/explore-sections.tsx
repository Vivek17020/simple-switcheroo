import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Blocks, BookOpen, Wrench, Video } from "lucide-react";

interface ExploreSectionsProps {
  onVideoClick?: () => void;
}

export default function ExploreSections({ onVideoClick }: ExploreSectionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <Link to="/web3forindia" className="group">
        <Card className="h-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Blocks className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Web3ForIndia</h3>
            <p className="text-sm text-muted-foreground mb-4">Learn Blockchain, Crypto & Web3 Technologies</p>
            <span className="text-primary text-sm font-medium group-hover:underline">Explore →</span>
          </CardContent>
        </Card>
      </Link>

      <Link to="/upscbriefs" className="group">
        <Card className="h-full bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20 hover:border-amber-500/40 transition-all hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">UPSC Briefs</h3>
            <p className="text-sm text-muted-foreground mb-4">UPSC Exam Preparation & Study Material</p>
            <span className="text-primary text-sm font-medium group-hover:underline">Explore →</span>
          </CardContent>
        </Card>
      </Link>
      
      <Link to="/tools" className="group">
        <Card className="h-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40 transition-all hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Wrench className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Free Tools</h3>
            <p className="text-sm text-muted-foreground mb-4">PDF, Image & Video Converters</p>
            <span className="text-primary text-sm font-medium group-hover:underline">Explore →</span>
          </CardContent>
        </Card>
      </Link>
      
      <Link to="/web-stories" className="group">
        <Card className="h-full bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 hover:border-orange-500/40 transition-all hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Web Stories</h3>
            <p className="text-sm text-muted-foreground mb-4">Visual Stories & Quick Reads</p>
            <span className="text-primary text-sm font-medium group-hover:underline">Explore →</span>
          </CardContent>
        </Card>
      </Link>
      
      <button onClick={onVideoClick} className="group text-left">
        <Card className="h-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40 transition-all hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Video className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Videos</h3>
            <p className="text-sm text-muted-foreground mb-4">Watch Latest News & Updates</p>
            <span className="text-primary text-sm font-medium group-hover:underline">Watch Now →</span>
          </CardContent>
        </Card>
      </button>
    </div>
  );
}