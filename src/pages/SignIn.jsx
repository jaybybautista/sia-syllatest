import { Link, useNavigate } from 'react-router-dom'
import { CircleAlert, Mail, Check } from 'lucide-react'

const pillars = [
  ['Syllabus Deconstruction', 'Automatic extraction of COs, ILOs, and hours mapping.'],
  ['Dynamic TOS Alignment', "Computed distribution grids using Bloom's Revised Taxonomy."],
  ['CHED Compliance Audit', 'Flag curriculum consistency gaps instantly before midterm uploads.'],
]

export default function SignIn() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-navy-950 via-[#1e3a8a] via-55% to-navy-900">
      <section className="flex w-[600px] shrink-0 flex-col justify-between bg-gradient-to-r from-navy-950 via-[#1e3a8a] via-55% to-navy-900 p-16 shadow-[0_12px_24px_rgba(0,0,0,0.2),0_24px_48px_rgba(2,6,23,0.4)] max-lg:hidden">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-2xl font-extrabold text-white">
              ST
            </div>
            <p className="text-2xl font-extrabold text-white">SyllaTest AI</p>
          </div>
          <p className="text-[32px] font-bold leading-[1.2] text-white">
            Aligning University Syllabi, Exams, and Curriculums Seamlessly
          </p>
        </div>
        <div className="flex flex-col gap-6">
          <p className="text-base leading-normal text-gray-300">
            Transform syllabus documents into structured learning outcomes, automated Tables of
            Specifications (TOS), and compliant diagnostic exam templates in under a minute.
          </p>
          <ul className="flex flex-col gap-4">
            {pillars.map(([title, text]) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent">
                  <Check size={14} className="text-white" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white">{title}</span>
                  <span className="text-xs text-gray-300">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2 text-gray-300">
          <p className="text-[11px]">POWERED BY CONTRA CORE COGNITIVE LLM</p>
          <p className="text-xs">© 2024 Pangasinan State University. All rights reserved.</p>
        </div>
      </section>

      <section className="flex flex-1 flex-col items-center justify-center gap-10 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-md lg:p-24">
        <div className="flex w-full max-w-[480px] flex-col gap-8 rounded-3xl border border-white/30 bg-white/90 p-10 shadow-[0_20px_20px_rgba(2,6,23,0.2)] backdrop-blur-md">
          <div className="flex flex-col gap-3 text-center">
            <h1 className="text-[28px] font-extrabold text-navy-900">University Portal</h1>
            <p className="text-sm text-ink-2">
              Please sign in with your official PSU Google Workspace account.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/10 p-4">
            <CircleAlert size={20} className="shrink-0 text-accent-dark" />
            <p className="text-xs font-medium text-ink">
              Access is restricted strictly to faculty members using active{' '}
              <span className="font-bold text-accent-dark">@psu.edu.ph</span> emails.
            </p>
          </div>
          <button
            onClick={() => navigate('/sso')}
            className="flex items-center justify-center gap-4 rounded-xl bg-accent p-4 text-[15px] font-semibold text-white shadow-[0_10px_12px_rgba(217,119,6,0.15)] hover:bg-accent-dark"
          >
            <Mail size={22} />
            Continue with PSU Mail
          </button>
          <hr className="border-line" />
          <div className="flex flex-col gap-2 text-slate-500">
            <p className="text-[11px] font-bold uppercase">AI &amp; Data Transparency Disclosure</p>
            <p className="text-xs leading-[1.4]">
              SyllaTest utilizes artificial intelligence to parse uploaded curriculum syllabi. All
              drafted Tables of Specifications (TOS) and test items must undergo manual peer and
              department chair verification prior to official release. Faculty remain solely
              accountable for curriculum consistency.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-300">
          <a href="https://psu.edu.ph/privacy" target="_blank" rel="noreferrer" className="hover:text-white">
            University Privacy Policy
          </a>
          <span>•</span>
          <a href="https://psu.edu.ph/terms" target="_blank" rel="noreferrer" className="hover:text-white">
            Terms of Service
          </a>
          <span>•</span>
          <Link to="/help" className="hover:text-white">
            System Support v2.1
          </Link>
        </div>
      </section>
    </div>
  )
}
