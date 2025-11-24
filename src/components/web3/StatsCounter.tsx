import { useEffect, useState } from "react";
import { BookOpen, FileText, Users } from "lucide-react";

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
}

function StatItem({ icon, value, label, suffix = "" }: StatItemProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200 hover:border-[#6A5BFF] transition-colors">
      <div className="p-4 rounded-xl bg-gradient-to-br from-[#6A5BFF]/20 to-[#4AC4FF]/20">
        {icon}
      </div>
      <div className="text-4xl font-bold bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] bg-clip-text text-transparent">
        {count}{suffix}
      </div>
      <div className="text-sm font-medium text-gray-600">{label}</div>
    </div>
  );
}

interface StatsCounterProps {
  totalArticles: number;
  totalTopics: number;
}

export function StatsCounter({ totalArticles, totalTopics }: StatsCounterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-16">
      <StatItem
        icon={<FileText className="w-8 h-8 text-[#6A5BFF]" />}
        value={totalArticles}
        label="Tutorials"
        suffix="+"
      />
      <StatItem
        icon={<BookOpen className="w-8 h-8 text-[#6A5BFF]" />}
        value={totalTopics}
        label="Topics Covered"
      />
      <StatItem
        icon={<Users className="w-8 h-8 text-[#6A5BFF]" />}
        value={1000}
        label="Learning Community"
        suffix="+"
      />
    </div>
  );
}
