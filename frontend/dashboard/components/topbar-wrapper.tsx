// components/topbar-wrapper.tsx
// Thin client shell that receives server-resolved props and renders the
// interactive Topbar. This avoids the Server Component / 'use client' conflict
// that caused the hydration freeze.
'use client'
import Topbar from './topbar'

type Props = {
  userName: string
  userInitials: string
  userEmail: string
  extensionLive?: boolean
}

export default function TopbarWrapper(props: Props) {
  return <Topbar {...props} />
}