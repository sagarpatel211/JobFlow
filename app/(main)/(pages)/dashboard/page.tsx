import { Clock, Briefcase, Code, Users, ExternalLink } from "lucide-react";
import Link from "next/link";

const DashboardPage = () => {
  const tasks = [
    { name: "LeetCode", done: 3, total: 10, icon: Code },
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
          <div
            key={index}
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
              <div className="h-full bg-primary" style={{ width: `${(task.done / task.total) * 100}%` }}></div>
            </div>
          </div>
        ))}

        {/* Timer Node - Now row-span-2 to match Job Listings */}
        <div className="row-span-2 bg-card text-card-foreground rounded-lg shadow-[0_8px_20px_rgba(0,0,0,0.5)] p-6 flex flex-col justify-center items-center">
          <Clock className="w-8 h-8 mb-2" />
          <div className="text-lg font-semibold">New jobs released in</div>
          <div className="text-3xl font-bold mt-2">8 hours</div>
        </div>

        {/* Job Listings - Already row-span-2 */}
        <div className="col-span-2 md:col-span-3 row-span-2 bg-card text-card-foreground rounded-lg shadow-[0_8px_20px_rgba(0,0,0,0.5)] p-6 flex flex-col">
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
              <tbody>
                {jobs.map((job, index) => (
                  <tr key={index} className="border-t border-border">
                    <td className="py-2">{job.company}</td>
                    <td className="py-2">{job.position}</td>
                    <td className="py-2 hidden md:table-cell">{job.datePosted}</td>
                    <td className="py-2">
                      <Link href={job.link} className="text-primary hover:underline inline-flex items-center">
                        Apply <ExternalLink className="ml-1 w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
