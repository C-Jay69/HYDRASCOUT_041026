import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Briefcase } from 'lucide-react';

const openings = [
  {
    title: 'Senior Full-Stack Engineer (Automation Pipeline)',
    type: 'Full-time · Remote',
    department: 'Engineering',
  },
  {
    title: 'Data Engineer — County & Public Records',
    type: 'Full-time · Remote',
    department: 'Data',
  },
  {
    title: 'Compliance & Outreach Specialist (TCPA/DNC)',
    type: 'Contract · Remote',
    department: 'Compliance',
  },
];

export default function CareersPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Careers</h1>
        <p className="text-xl text-gray-600">
          We are a small, remote-first team building automation for the real estate investing
          industry. We are not actively hiring at scale right now, but we always want to hear
          from strong engineers and data people who care about lawful, well-built automation.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-4 mb-16">
        {openings.map((job) => (
          <div
            key={job.title}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6 rounded-xl border border-gray-200 bg-white"
          >
            <div>
              <h3 className="font-semibold text-gray-900">{job.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" /> {job.department}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {job.type}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Remote
                </span>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/contact">Introduce Yourself</Link>
            </Button>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-4 text-center">
        <p className="text-gray-600 mb-6">
          Don&apos;t see a fit but think you should be on the team anyway? Reach out through the
          contact page and tell us what you&apos;d want to build.
        </p>
        <Button asChild size="lg" className="bg-[#1a56db] hover:bg-[#1e40af] text-white">
          <Link href="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
}
