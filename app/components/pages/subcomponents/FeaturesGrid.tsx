import Image from 'next/image';
import { Card, CardContent } from '@/frontend/reusable-elements/cards/Card';

interface Feature {
  image: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    image: '/icons/Single system for cases.png',
    title: 'Single System for Cases, Runs & Defects',
    description: 'Manage test cases, test runs, and defects in one unified platform. Eliminate spreadsheets and scattered tools.',
  },
  {
    image: '/icons/Data migration.png',
    title: 'Data Migration & Bulk Import',
    description: 'Import test cases, test runs, and defects from spreadsheets or CSV files. Migrate from other tools quickly and with minimal effort.',
  },
  {
    image: '/icons/End to end tarceability.png',
    title: 'End-to-End Traceability',
    description: 'Track relationships between test cases, test runs, and defects. See the complete picture of what\'s tested, what failed, and what\'s fixed.',
  },
  {
    image: '/icons/Manual and automation testing.png',
    title: 'Manual + Automation Testing',
    description: 'Plan and track manual tests alongside automated suites in one open-source platform. Unified reporting for all stakeholders.',
  },
  {
    image: '/icons/Comments and collaboration.png',
    title: 'Comments & Collaboration',
    description: 'Add comments and discussions on defects and test artifacts. Collaborate with your team in context with threaded conversations.',
  },
  {
    image: '/icons/Email notification.png',
    title: 'Email Notifications',
    description: 'Get automated notifications for test runs, defect assignments, and status changes so your team can react quickly to issues.',
  },
];

export const FeaturesGrid = () => {
  return (
    <Card variant="glass" className="mb-24">
      <CardContent className="py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Powerful Features</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => {
            return (
              <Card
                key={feature.title}
                variant="glass"
                className="border-l-4 border-l-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all group"
              >
                <CardContent className="py-6 px-5">
                  <div className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className="mb-3 flex items-center justify-center w-14 h-14 group-hover:scale-110 transition-transform">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        width={56}
                        height={56}
                        className="object-contain"
                        priority
                      />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-white/70 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

