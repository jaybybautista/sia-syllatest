import { Navigate, Route, Routes } from 'react-router-dom'
import SignIn from './pages/SignIn.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Upload from './pages/Upload.jsx'
import Verification from './pages/Verification.jsx'
import Consistency from './pages/Consistency.jsx'
import ExamConfig from './pages/ExamConfig.jsx'
import TosBuilder from './pages/TosBuilder.jsx'
import Generation from './pages/Generation.jsx'
import Review from './pages/Review.jsx'
import Export from './pages/Export.jsx'
import Bank from './pages/Bank.jsx'
import ChairDashboard from './pages/ChairDashboard.jsx'
import Approval from './pages/Approval.jsx'
import Analysis from './pages/Analysis.jsx'
import Admin from './pages/Admin.jsx'
import Sso from './pages/Sso.jsx'
import Notifications from './pages/Notifications.jsx'
import Help from './pages/Help.jsx'
import Profile from './pages/Profile.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/verification" element={<Verification />} />
      <Route path="/consistency" element={<Consistency />} />
      <Route path="/exam-config" element={<ExamConfig />} />
      <Route path="/tos" element={<TosBuilder />} />
      <Route path="/generation" element={<Generation />} />
      <Route path="/review" element={<Review />} />
      <Route path="/export" element={<Export />} />
      <Route path="/bank" element={<Bank />} />
      <Route path="/chair" element={<ChairDashboard />} />
      <Route path="/approval" element={<Approval />} />
      <Route path="/analysis" element={<Analysis />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/sso" element={<Sso />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/help" element={<Help />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
