import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Target, Users, BookOpen, Award } from "lucide-react";

export default function Web3AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Web3 for India - Learn Blockchain & Crypto</title>
        <meta name="description" content="Web3 for India is a comprehensive learning platform helping Indians master blockchain technology, cryptocurrency, and Web3 development." />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/web3forindia/about" />
        <meta property="og:title" content="About Web3 for India - Empowering Indians with Blockchain Education" />
        <meta property="og:description" content="Learn about our mission to make blockchain and Web3 education accessible to every Indian" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.thebulletinbriefs.in/web3forindia/about" />
        <meta property="og:image" content="https://www.thebulletinbriefs.in/og-images/web3-about.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#6A5BFF]/10 via-white to-[#4AC4FF]/10 py-16">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#6A5BFF]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#4AC4FF]/20 rounded-full blur-3xl" />
          
          <div className="container relative mx-auto px-4">
            <Link 
              to="/web3forindia" 
              className="inline-flex items-center gap-2 text-[#6A5BFF] hover:text-[#4AC4FF] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to Home</span>
            </Link>

            <h1 className="text-5xl font-bold bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] bg-clip-text text-transparent mb-4">
              About Web3 for India
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl">
              Empowering Indians to learn and build in the Web3 ecosystem
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 mb-4">
                Web3 for India is dedicated to making blockchain technology and Web3 development accessible to every Indian. We believe that the future of the internet is decentralized, and we're here to ensure that India plays a leading role in this transformation.
              </p>
              <p className="text-lg text-gray-700">
                Through comprehensive tutorials, practical guides, and real-world examples, we're building a community of Web3 developers, entrepreneurs, and enthusiasts who are ready to shape the future of technology in India.
              </p>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6A5BFF]/20 to-[#4AC4FF]/20 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-[#6A5BFF]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Focused Learning</h3>
                <p className="text-gray-600">
                  Structured curriculum designed specifically for Indian learners, covering blockchain fundamentals to advanced Web3 development.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6A5BFF]/20 to-[#4AC4FF]/20 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-[#6A5BFF]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Hands-on Tutorials</h3>
                <p className="text-gray-600">
                  Practical, project-based learning with real-world examples and code samples you can use immediately.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6A5BFF]/20 to-[#4AC4FF]/20 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[#6A5BFF]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Growing Community</h3>
                <p className="text-gray-600">
                  Join thousands of Indian developers learning and building Web3 applications together.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6A5BFF]/20 to-[#4AC4FF]/20 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-[#6A5BFF]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Industry Standards</h3>
                <p className="text-gray-600">
                  Learn best practices and industry-standard tools used by leading Web3 companies worldwide.
                </p>
              </div>
            </div>

            {/* What We Cover */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">What We Cover</h2>
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-[#6A5BFF] bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">Blockchain Fundamentals</h4>
                  <p className="text-gray-600">Understanding how blockchain works, consensus mechanisms, and cryptography basics</p>
                </div>
                <div className="p-4 border-l-4 border-[#4AC4FF] bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">Smart Contract Development</h4>
                  <p className="text-gray-600">Writing, testing, and deploying smart contracts using Solidity and other languages</p>
                </div>
                <div className="p-4 border-l-4 border-[#6A5BFF] bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">DeFi & NFTs</h4>
                  <p className="text-gray-600">Building decentralized finance applications and working with non-fungible tokens</p>
                </div>
                <div className="p-4 border-l-4 border-[#4AC4FF] bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">Web3 Development</h4>
                  <p className="text-gray-600">Integrating blockchain with web applications using Web3.js, ethers.js, and modern frameworks</p>
                </div>
                <div className="p-4 border-l-4 border-[#6A5BFF] bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-1">India-Specific Context</h4>
                  <p className="text-gray-600">Understanding regulations, opportunities, and the Web3 ecosystem in India</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-[#6A5BFF]/10 to-[#4AC4FF]/10">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Your Web3 Journey?</h3>
              <p className="text-gray-600 mb-6">
                Join thousands of Indians learning blockchain and building the future of the internet
              </p>
              <Link 
                to="/web3forindia"
                className="inline-block px-8 py-3 bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Start Learning Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
