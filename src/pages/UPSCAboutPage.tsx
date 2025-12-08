import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { GraduationCap, Target, BookOpen, CheckCircle, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UPSCBreadcrumb } from "@/components/upsc/UPSCBreadcrumb";

const features = [
  {
    icon: Target,
    title: "Exam-Oriented",
    description: "Every article is structured specifically for UPSC CSE pattern with prelims MCQs and mains answer writing tips.",
  },
  {
    icon: BookOpen,
    title: "Comprehensive Coverage",
    description: "All 9 GS subjects covered - Polity, Economy, Geography, History, Environment, Science & Tech, Art & Culture, IR, and Society.",
  },
  {
    icon: CheckCircle,
    title: "No Fluff Content",
    description: "Clear, concise notes without unnecessary filler. Just what you need to crack the exam.",
  },
  {
    icon: Users,
    title: "Free Forever",
    description: "All study material is completely free. Quality UPSC preparation shouldn't be behind a paywall.",
  },
];

const UPSCAboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About UPSCBriefs - Free UPSC Preparation Platform</title>
        <meta
          name="description"
          content="UPSCBriefs provides free, exam-oriented study material for UPSC Civil Services preparation. Clear, concise, and comprehensive notes for IAS aspirants."
        />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UPSCBreadcrumb items={[{ label: "About" }]} />

        {/* Hero */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-6">
            <GraduationCap className="w-8 h-8 text-blue-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">About UPSCBriefs</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your one-stop destination for free, high-quality UPSC Civil Services preparation material. 
            We believe quality education should be accessible to everyone.
          </p>
        </section>

        {/* Mission */}
        <section className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
          <p className="text-gray-700 leading-relaxed">
            To democratize UPSC preparation by providing clear, concise, and exam-oriented study material 
            that helps aspirants from all backgrounds succeed in the Civil Services Examination. 
            We focus on substance over style – no unnecessary fluff, just what you need to crack the exam.
          </p>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Why UPSCBriefs?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Article Format */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Our Article Format</h2>
          <p className="text-gray-600 mb-4">
            Every article on UPSCBriefs follows a standardized UPSC-friendly format:
          </p>
          <ul className="space-y-2">
            {[
              "Short Summary (2-3 lines)",
              "Context / Background",
              "Main Explanation with clear headings",
              "Important Features / Key Points",
              "UPSC Notes Version (bullet points for quick revision)",
              "Mains Answer Writing Angle",
              "Prelims Practice MCQs (2-3 questions)",
              "Previous Year Question Mapping",
              "Simple Conclusion",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="text-center bg-gray-50 border border-gray-200 rounded-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Start Your Preparation</h2>
          <p className="text-gray-600 mb-6">
            Explore our comprehensive collection of UPSC study material across all subjects.
          </p>
          <Button asChild size="lg">
            <Link to="/upscbriefs">
              Browse Articles
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </section>

        {/* Back to main site */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-blue-700 transition-colors inline-flex items-center"
          >
            Visit The Bulletin Briefs for more news and updates
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default UPSCAboutPage;
