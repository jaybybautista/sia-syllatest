// The demo directory. Each account signs in with one fixed role; there is no switching role while
// signed in. To use another role, sign out and choose that account on the sign-in screen.
import { chair, user } from './mock.js'

export const roleLabel = { faculty: 'Faculty', chair: 'Department Chair', admin: 'Administrator' }

export const homeByRole = { faculty: '/dashboard', chair: '/chair', admin: '/admin' }

export const demoAccounts = [
  { ...user, role: 'faculty' },
  { ...chair, role: 'chair', college: user.college, rank: chair.role },
  { name: 'ICT Systems Admin', email: 'ict-admin@psu.edu.ph', role: 'admin', college: 'ICT Office' },
]

export const accountByEmail = Object.fromEntries(demoAccounts.map((a) => [a.email, a]))

// Pages each role may open. A path matches its own entry and anything below it
// ("/bank" also allows "/bank/elec4-2324-2").
const pagesByRole = {
  faculty: [
    '/dashboard',
    '/upload',
    '/verification',
    '/consistency',
    '/tos',
    '/bank',
    '/bloom',
    '/exam-config',
    '/generation',
    '/review',
    '/export',
  ],
  chair: ['/chair', '/approval', '/analysis', '/bank', '/bloom'],
  admin: ['/admin'],
}
const sharedPages = ['/profile', '/notifications', '/help']

export function canOpen(role, pathname) {
  return [...(pagesByRole[role] ?? []), ...sharedPages].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function initialsOf(name) {
  return name
    .split(' ')
    .filter((w) => !w.endsWith('.'))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}
