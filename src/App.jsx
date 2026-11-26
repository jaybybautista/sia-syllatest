import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
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
import { canOpen, homeByRole } from './data/accounts.js'
import { useAppState } from './state/context.js'

// Each of these opens on the list of uploaded syllabi; tapping one opens the screen for it.
const syllabusFeatures = [
  ['verification', '/verification', <Verification />],
  ['consistency', '/consistency', <Consistency />],
  ['tos', '/tos', <TosBuilder />],
  ['bank', '/bank', <Bank />],
  ['approval', '/approval', <Approval />],
  ['analysis', '/analysis', <Analysis />],
]

/**
 * Every page except sign-in needs a signed-in account, and each role only reaches its own pages;
 * anything else goes to that role's home screen.
 */
function RequireAccount() {
  const { signedIn, role } = useAppState()
  const { pathname } = useLocation()
  if (!signedIn) return <Navigate to="/signin" replace />
  if (!canOpen(role, pathname)) return <Navigate to={homeByRole[role]} replace />
  return <Outlet />
}

function Home() {
  const { signedIn, role } = useAppState()
  return <Navigate to={signedIn ? homeByRole[role] : '/signin'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/sso" element={<Sso />} />
      <Route element={<RequireAccount />}>
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
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/help" element={<Help />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
