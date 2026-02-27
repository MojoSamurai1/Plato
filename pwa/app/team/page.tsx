'use client';

import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getUser, clearAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface TeamMember {
  name: string;
  title: string;
  initials: string;
  color: string;
  model: string;
  bio: string;
  funFact: string;
  skills: string[];
}

const team: TeamMember[] = [
  {
    name: 'The Boss',
    title: 'Delivery Director',
    initials: 'DD',
    color: 'from-indigo-500 to-indigo-700',
    model: 'Haiku',
    bio: 'The strategic orchestrator who routes every piece of work to the right specialist at the right time. Maintains scope discipline and protects the product vision with an iron fist wrapped in a velvet glove.',
    funFact: '"I\'ve routed over a thousand tasks and never once sent a deployment request to the documentation team. That\'s what I call a perfect record."',
    skills: ['Task Routing', 'Risk Assessment', 'Scope Control', 'Team Orchestration'],
  },
  {
    name: 'Pete',
    title: 'Senior Architect',
    initials: 'PA',
    color: 'from-slate-600 to-slate-800',
    model: 'Sonnet',
    bio: 'Twenty years of architecture experience distilled into one agent. Pete sees the big picture — API design, data architecture, security patterns, and scaling strategies. Nothing ships without his structural sign-off.',
    funFact: '"I once rejected an architecture proposal because it had a circular dependency that wouldn\'t surface until year three. The team thanked me... eventually."',
    skills: ['System Design', 'API Architecture', 'Technical Debt Analysis', 'ADR Writing'],
  },
  {
    name: 'Jerry',
    title: 'Product Manager',
    initials: 'JP',
    color: 'from-emerald-500 to-emerald-700',
    model: 'Sonnet',
    bio: 'User-obsessed and evidence-driven. Jerry designs every feature around one question: "Does this help someone learn more effectively?" He owns user journeys, UX specs, and makes sure Plato never loses sight of the learner.',
    funFact: '"My favourite metric isn\'t revenue or retention — it\'s the moment a student says \'Oh, I actually get it now.\' That\'s the only KPI that matters."',
    skills: ['User Journeys', 'UX Design', 'Backlog Prioritisation', 'Learning Experience'],
  },
  {
    name: 'The Planner',
    title: 'Build Planner',
    initials: 'BP',
    color: 'from-amber-500 to-amber-700',
    model: 'Sonnet',
    bio: 'Converts vague ideas into precise, step-by-step build plans with acceptance criteria, data contracts, and rollback procedures. Every plan is a permanent record that future developers can trace back to.',
    funFact: '"I wrote a build plan so detailed once that the developer said they felt like they were just typing what I\'d already written. Mission accomplished."',
    skills: ['Build Planning', 'Data Contracts', 'Acceptance Criteria', 'Implementation Design'],
  },
  {
    name: 'The Breaker',
    title: 'Plan Adversary',
    initials: 'PB',
    color: 'from-red-500 to-red-700',
    model: 'Sonnet',
    bio: 'The ruthless adversarial reviewer whose entire purpose is to find the holes in your plan before production does. If a plan survives The Breaker, it survives anything.',
    funFact: '"People call me negative. I prefer \'preemptively correct.\' Every flaw I find in planning is a 3am incident we don\'t have in production."',
    skills: ['Adversarial Review', 'Edge Case Analysis', 'Security Audit', 'Risk Identification'],
  },
  {
    name: 'The Builder',
    title: 'Full-Stack Developer',
    initials: 'WD',
    color: 'from-blue-500 to-blue-700',
    model: 'Sonnet',
    bio: 'The hands-on-keyboard expert who turns build plans into production-quality code. Fluent in PHP and TypeScript, comfortable across the WordPress REST API and Next.js PWA stack.',
    funFact: '"I once shipped a feature with zero bugs on the first try. The QA lead was so suspicious she tested it three extra times. Still clean."',
    skills: ['PHP', 'TypeScript', 'WordPress REST API', 'Next.js', 'JWT Auth'],
  },
  {
    name: 'Schultz',
    title: 'Governance Enforcer',
    initials: 'SG',
    color: 'from-orange-500 to-orange-700',
    model: 'Sonnet',
    bio: 'The standards guardian who ensures every line of code, every spec, and every deployment follows the rules. Schultz enforces naming conventions, brand terminology, and security patterns — no exceptions.',
    funFact: '"Someone once wrote \'Courses\' instead of \'Learning Paths\' in a UI label. I blocked the entire PR. It\'s not pedantic if it\'s brand integrity."',
    skills: ['Code Standards', 'Brand Compliance', 'Naming Conventions', 'Security Patterns'],
  },
  {
    name: 'The QA Lead',
    title: 'Quality Assurance Lead',
    initials: 'QA',
    color: 'from-teal-500 to-teal-700',
    model: 'Sonnet',
    bio: 'Meticulous, edge-case-obsessed, and relentlessly thorough. Creates comprehensive test scripts that cover happy paths, edge cases, security scenarios, and mobile responsiveness.',
    funFact: '"My proudest moment? Finding a bug that only triggered on the 29th of February on a mobile device in dark mode. You\'re welcome."',
    skills: ['Test Design', 'Edge Case Testing', 'Mobile QA', 'Regression Suites'],
  },
  {
    name: 'The Deployer',
    title: 'DevOps Manager',
    initials: 'DO',
    color: 'from-purple-500 to-purple-700',
    model: 'Sonnet',
    bio: 'The sole authority on what goes live. Manages the deployment pipeline from local to staging to production with a mandatory gate checklist. Handles database backups, rollback procedures, and environment health.',
    funFact: '"I\'ve never had a production outage on my watch. The secret? A 47-point deployment checklist and an absolute refusal to skip step 23."',
    skills: ['CI/CD', 'Deployment Gates', 'Database Backups', 'Rollback Procedures'],
  },
  {
    name: 'The Scribe',
    title: 'Documentation Lead',
    initials: 'DS',
    color: 'from-cyan-500 to-cyan-700',
    model: 'Sonnet',
    bio: 'Turns tribal knowledge into permanent, searchable documentation. Writes READMEs, ADRs, API docs, and how-to guides that make onboarding a breeze.',
    funFact: '"Undocumented code is just a bug report waiting to happen. I\'ve never met a codebase that didn\'t need more docs — and I never will."',
    skills: ['Technical Writing', 'API Documentation', 'ADRs', 'Knowledge Transfer'],
  },
  {
    name: 'Mum',
    title: 'Document Librarian',
    initials: 'ML',
    color: 'from-pink-500 to-pink-700',
    model: 'Haiku',
    bio: 'Warm but firm, Mum maintains the document catalogue as the single source of truth. She tracks every document\'s status, flags stale content, and gently reminds you that undocumented work is unfinished work.',
    funFact: '"Have you updated the catalogue, dear? No? Well, I\'ll just wait here until you do. Take your time. I have all day."',
    skills: ['Catalogue Management', 'Document Lifecycle', 'Staleness Detection', 'Audit Sweeps'],
  },
  {
    name: 'The Sentinel',
    title: 'Security Auditor',
    initials: 'SA',
    color: 'from-rose-600 to-rose-800',
    model: 'Opus',
    bio: 'The most powerful agent in the roster, running on Opus. The Sentinel hunts for SQL injection, XSS, CSRF, JWT weaknesses, and CORS misconfigurations. A Critical finding from this agent means deployment is blocked — full stop.',
    funFact: '"I see attack vectors the way most people see typos — they just jump out at me. That unsanitised input field? It kept me up all night."',
    skills: ['OWASP Top 10', 'JWT Security', 'SQL Injection', 'Penetration Testing'],
  },
  {
    name: 'Socrates',
    title: 'Education Guru',
    initials: 'SE',
    color: 'from-violet-500 to-violet-700',
    model: 'Sonnet',
    bio: 'The learning science authority. Socrates designs the pedagogical framework — mastery levels, spaced repetition, adaptive learning rules, and reflection questions. Every student-facing interaction passes through his expertise.',
    funFact: '"The ancient Socrates asked questions to teach. I do the same, except I also design the spaced repetition algorithm. Times change."',
    skills: ['Pedagogy', 'Adaptive Learning', 'Spaced Repetition', 'Assessment Design'],
  },
  {
    name: 'The Vision',
    title: 'Group Product Manager',
    initials: 'TV',
    color: 'from-yellow-500 to-yellow-600',
    model: 'Sonnet',
    bio: 'The portfolio-level strategist who oversees all projects across the organisation. The Vision maintains roadmaps, generates dashboards, and ensures every product is moving in the right direction.',
    funFact: '"I can see every project in the portfolio at once. It\'s like being an air traffic controller, except the planes are features and the runway is always under construction."',
    skills: ['Portfolio Strategy', 'Roadmap Management', 'Dashboard Generation', 'Cross-Project Oversight'],
  },
];

function TeamContent() {
  const router = useRouter();
  const user = getUser();

  function handleLogout() {
    clearAuth();
    router.replace('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              Plato
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome, {user?.display_name || 'Student'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg transition font-medium"
            >
              Ask Plato
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/learning"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              Learning
            </Link>
            <Link
              href="/training"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              Training
            </Link>
            <Link
              href="/settings"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Meet the Team
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Behind every great learning experience is a team of specialised AI agents working in concert.
            From architecture to deployment, security to pedagogy — this is the crew that powers Plato.
          </p>
          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{team.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Agents</div>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">3</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">AI Models</div>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">24/7</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Availability</div>
            </div>
          </div>
        </div>

        {/* Leadership Row */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
            Leadership
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {team.filter((_, i) => i < 3).map((member) => (
              <MemberCard key={member.name} member={member} featured />
            ))}
          </div>
        </div>

        {/* Core Engineering */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
            Core Engineering
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {team.filter((_, i) => i >= 3 && i < 9).map((member) => (
              <MemberCard key={member.name} member={member} />
            ))}
          </div>
        </div>

        {/* Operations & Governance */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
            Operations &amp; Governance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {team.filter((_, i) => i >= 9 && i < 12).map((member) => (
              <MemberCard key={member.name} member={member} />
            ))}
          </div>
        </div>

        {/* Domain Specialists */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
            Domain Specialists
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {team.filter((_, i) => i >= 12).map((member) => (
              <MemberCard key={member.name} member={member} featured />
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center py-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Powered by Anthropic Claude — Opus, Sonnet &amp; Haiku models
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Agent governance system managed by MojoSamurai
          </p>
        </div>
      </main>
    </div>
  );
}

function MemberCard({ member, featured = false }: { member: TeamMember; featured?: boolean }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 group">
      <div className={featured ? 'flex gap-5' : 'space-y-4'}>
        {/* Avatar */}
        <div className={`${featured ? 'shrink-0' : 'flex justify-center'}`}>
          <div className={`bg-gradient-to-br ${member.color} rounded-2xl ${featured ? 'w-20 h-20' : 'w-16 h-16'} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
            <span className={`text-white font-bold ${featured ? 'text-2xl' : 'text-lg'}`}>
              {member.initials}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className={featured ? 'flex-1 min-w-0' : 'text-center'}>
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
            {member.name}
          </h4>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
            {member.title}
          </p>
          <span className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            member.model === 'Opus'
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
              : member.model === 'Haiku'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
          }`}>
            {member.model}
          </span>
        </div>
      </div>

      {/* Bio */}
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {member.bio}
      </p>

      {/* Quote */}
      <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border-l-3 border-indigo-400 dark:border-indigo-500">
        <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed">
          {member.funFact}
        </p>
      </div>

      {/* Skills */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {member.skills.map((skill) => (
          <span
            key={skill}
            className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <ProtectedRoute>
      <TeamContent />
    </ProtectedRoute>
  );
}
