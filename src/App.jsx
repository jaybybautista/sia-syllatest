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
import BloomTaxonomy from './pages/BloomTaxonomy.jsx'
import SyllabusHistory from './components/SyllabusHistory.jsx'
import SyllabusRoute from './components/SyllabusRoute.jsx'

// Each of these opens on the list of uploaded syllabi; tapping one opens the screen for it.
const syllabusFeatures = [
  ['verification', '/verification', <Verification />],
  ['consistency', '/consistency', <Consistency />],
  ['tos', '/tos', <TosBuilder />],
  ['bank', '/bank', <Bank />],
  ['approval', '/approval', <Approval />],
  ['analysis', '/analysis', <Analysis />],
]

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/upload" element={<Upload />} />
      {syllabusFeatures.flatMap(([key, path, page]) => [
        <Route key={key} path={path} element={<SyllabusHistory feature={key} />} />,
        <Route
          key={`${key}-detail`}
          path={`${path}/:syllabusId`}
          element={<SyllabusRoute feature={key}>{page}</SyllabusRoute>}
        />,
      ])}
      <Route path="/bloom" element={<BloomTaxonomy />} />
      <Route path="/exam-config" element={<ExamConfig />} />
      <Route path="/generation" element={<Generation />} />
      <Route path="/review" element={<Review />} />
      <Route path="/export" element={<Export />} />
      <Route path="/chair" element={<ChairDashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/sso" element={<Sso />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/help" element={<Help />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
