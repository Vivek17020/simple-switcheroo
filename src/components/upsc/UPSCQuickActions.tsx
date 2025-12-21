import { Link } from "react-router-dom";
import { Brain, PenTool, Zap, FileText } from "lucide-react";

const actions = [
  {
    title: "Prelims Practice",
    description: "MCQs & Mock Tests",
    icon: Brain,
    href: "/upscbriefs/practice",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Mains Writing",
    description: "Answer Practice",
    icon: PenTool,
    href: "/upscbriefs/mains",
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "Quick CA",
    description: "Today's Updates",
    icon: Zap,
    href: "/upscbriefs/upsc-daily-ca",
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "Study Notes",
    description: "PDF Resources",
    icon: FileText,
    href: "/upscbriefs/resources",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
  },
];

const UPSCQuickActions = () => {
  return (
    <section className="py-8">
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.href}
            className={`group relative ${action.bgColor} rounded-2xl p-5 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
          >
            {/* Gradient overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            <div className="relative z-10">
              <action.icon className={`w-8 h-8 mb-3 bg-gradient-to-br ${action.color} bg-clip-text text-transparent group-hover:text-white transition-colors`} style={{ WebkitTextStroke: '1px currentColor' }} />
              <h3 className="font-bold text-slate-900 group-hover:text-white transition-colors mb-1">
                {action.title}
              </h3>
              <p className="text-sm text-slate-500 group-hover:text-white/80 transition-colors">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default UPSCQuickActions;
