"use client";

import { Clock, Briefcase, Code, Users, ExternalLink } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const DashboardPage = () => {
  const tasks = [
    { name: "LeetCode", done: 12, total: 10, icon: Code },
    { name: "Behavioral", done: 3, total: 10, icon: Users },
    { name: "System Design", done: 3, total: 10, icon: Briefcase },
    { name: "Jobs Applied", done: 3, total: 10, icon: Briefcase },
  ];

  const jobs = [
    { company: "Google", position: "Software Engineer", datePosted: "2023-04-01", link: "#" },
    { company: "Amazon", position: "Full Stack Developer", datePosted: "2023-04-02", link: "#" },
    { company: "Microsoft", position: "Frontend Engineer", datePosted: "2023-04-03", link: "#" },
    { company: "Apple", position: "iOS Developer", datePosted: "2023-04-04", link: "#" },
    { company: "Facebook", position: "React Developer", datePosted: "2023-04-05", link: "#" },
  ];

  return (
    <div className="flex flex-col min-h-3.5 bg-background">
      <h1 className="text-4xl sticky top-0 z-[10] p-6 bg-background/50 backdrop-blur-lg flex items-center border-b shadow-md">
        Dashboard
      </h1>
      <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 p-4 md:p-8 auto-rows-fr">
        {tasks.map((task, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            className="bg-card text-card-foreground rounded-lg shadow-[0_8px_20px_rgba(0,0,0,0.5)] p-6 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <task.icon className="w-6 h-6" />
              <span className="text-sm font-medium">{task.name}</span>
            </div>
            <div className="text-3xl font-bold">
              {task.done} / {task.total}
            </div>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${task.done >= task.total ? "bg-green-500" : "bg-primary"}`}
                initial={{ width: 0 }}
                animate={{ width: `${String((task.done / task.total) * 100)}%` }}
                transition={{ duration: 1 }}
              ></motion.div>
            </div>
          </motion.div>
        ))}

        <motion.div
          whileHover={{ scale: 1.03 }}
          className="row-span-2 bg-card text-card-foreground rounded-lg shadow-[0_8px_20px_rgba(0,0,0,0.5)] p-6 flex flex-col justify-center items-center"
        >
          <Clock className="w-8 h-8 mb-2" />
          <div className="text-lg font-semibold">Scraping jobs finished in</div>
          <div className="text-3xl font-bold mt-2">
            8 hours (make the clock tick) and have an arrow point to bottom left so they know
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="col-span-2 md:col-span-3 row-span-2 bg-card text-card-foreground rounded-lg shadow-[0_8px_20px_rgba(0,0,0,0.5)] p-6 flex flex-col"
        >
          <h2 className="text-xl font-semibold mb-4">Recent Job Postings</h2>
          <div className="overflow-y-auto flex-grow">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2">Company</th>
                  <th className="pb-2">Position</th>
                  <th className="pb-2 hidden md:table-cell">Date Posted</th>
                  <th className="pb-2">Link</th>
                </tr>
              </thead>
              <motion.tbody initial="hidden" animate="visible" transition={{ staggerChildren: 0.2 }}>
                {jobs.map((job, index) => (
                  <motion.tr key={index} variants={rowVariants} className="border-t border-border">
                    <td className="py-2">{job.company}</td>
                    <td className="py-2">{job.position}</td>
                    <td className="py-2 hidden md:table-cell">{job.datePosted}</td>
                    <td className="py-2">
                      <Link href={job.link} className="text-primary hover:underline inline-flex items-center">
                        Apply <ExternalLink className="ml-1 w-4 h-4" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
