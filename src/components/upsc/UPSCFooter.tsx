import { Link } from "react-router-dom";
import { GraduationCap, Mail, ExternalLink, Blocks, Wrench } from "lucide-react";

const subjects = [
  { name: "Polity", slug: "polity" },
  { name: "Economy", slug: "economy" },
  { name: "Geography", slug: "geography" },
  { name: "History", slug: "history" },
  { name: "Environment", slug: "upsc-environment" },
  { name: "Science & Tech", slug: "science-tech" },
  { name: "Art & Culture", slug: "art-culture" },
  { name: "International Relations", slug: "upsc-international-relations" },
  { name: "Society", slug: "upsc-society" },
];

export const UPSCFooter = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/upscbriefs" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">UPSCBriefs</span>
            </Link>
            <p className="text-gray-400 text-sm mb-4 max-w-md">
              UPSC Preparation Made Simple. Clear, concise, and exam-oriented study material 
              for IAS, IPS, and Civil Services aspirants.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Mail className="w-4 h-4" />
              <a href="mailto:contact@thebulletinbriefs.in" className="hover:text-white transition-colors">
                contact@thebulletinbriefs.in
              </a>
            </div>
          </div>

          {/* Subjects */}
          <div>
            <h3 className="text-white font-semibold mb-4">Subjects</h3>
            <ul className="space-y-2">
              {subjects.slice(0, 5).map((subject) => (
                <li key={subject.slug}>
                  <Link
                    to={`/upscbriefs/${subject.slug}`}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {subject.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More Subjects & Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">More</h3>
            <ul className="space-y-2">
              {subjects.slice(5).map((subject) => (
                <li key={subject.slug}>
                  <Link
                    to={`/upscbriefs/${subject.slug}`}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {subject.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/upscbriefs/about"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  The Bulletin Briefs <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link
                  to="/web3forindia"
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Blocks className="w-3 h-3" /> Web3ForIndia
                </Link>
              </li>
              <li>
                <Link
                  to="/tools"
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Wrench className="w-3 h-3" /> Free Tools
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} UPSCBriefs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
