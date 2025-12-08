import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin } from "lucide-react";

export function Web3Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/web3forindia" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6A5BFF] to-[#4AC4FF] flex items-center justify-center">
                <span className="text-white font-bold text-xl">W3</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] bg-clip-text text-transparent">
                Web3 for India
              </span>
            </Link>
            <p className="text-gray-600 mb-4 max-w-md">
              Learn Blockchain, Crypto & Smart Contracts with tutorials designed for Indian developers and enthusiasts.
            </p>
            <div className="flex gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-[#6A5BFF] hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-[#6A5BFF] hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-[#6A5BFF] hover:text-white transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/web3forindia#tutorials" className="text-gray-600 dark:text-gray-400 hover:text-[#6A5BFF] transition-colors">
                  Tutorials
                </Link>
              </li>
              <li>
                <Link to="/web3forindia/blockchain-basics" className="text-gray-600 dark:text-gray-400 hover:text-[#6A5BFF] transition-colors">
                  Blockchain Basics
                </Link>
              </li>
              <li>
                <Link to="/web3forindia/smart-contracts" className="text-gray-600 dark:text-gray-400 hover:text-[#6A5BFF] transition-colors">
                  Smart Contracts
                </Link>
              </li>
              <li>
                <Link to="/web3forindia/defi" className="text-gray-600 dark:text-gray-400 hover:text-[#6A5BFF] transition-colors">
                  DeFi
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/web3forindia/playground" className="text-gray-600 dark:text-gray-400 hover:text-[#6A5BFF] transition-colors">
                  Playground
                </Link>
              </li>
              <li>
                <Link to="/web3forindia#learning-paths" className="text-gray-600 dark:text-gray-400 hover:text-[#6A5BFF] transition-colors">
                  Learning Paths
                </Link>
              </li>
              <li>
                <Link to="/web3forindia/about" className="text-gray-600 dark:text-gray-400 hover:text-[#6A5BFF] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-[#6A5BFF] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Main Site */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">TheBulletinBriefs</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-[#6A5BFF] transition-colors">
                  News Home
                </Link>
              </li>
              <li>
                <Link to="/web-stories" className="text-gray-600 dark:text-gray-400 hover:text-[#6A5BFF] transition-colors">
                  Web Stories
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-gray-600 dark:text-gray-400 hover:text-[#6A5BFF] transition-colors">
                  Tools
                </Link>
              </li>
              <li>
                <Link to="/category/jobs" className="text-gray-600 dark:text-gray-400 hover:text-[#6A5BFF] transition-colors">
                  Jobs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Web3 for India - A TheBulletinBriefs Initiative. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
