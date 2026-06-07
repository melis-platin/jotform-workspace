import { Heading, List, Button } from '@jf/app-elements'

interface LivePreviewProfilePageProps {
  /** Resets the preview to the logged-out state. */
  onLogout: () => void
  /** Dismisses the profile view (returns to the previous page). */
  onClose: () => void
  name?: string
  username?: string
  email?: string
}

/**
 * Account / profile screen reached from the avatar popover. It is a system view
 * (never editable on the builder canvas) rendered like a default first page: an
 * AppHeader hero (owned by BuildPage) sits above, and the body below is composed
 * entirely from the real app-elements — Heading + List + Button — exactly as the
 * element panel registers them, so it stays theme-reactive with zero bespoke
 * markup. There is no backend in this prototype.
 */
export function LivePreviewProfilePage({
  onLogout,
  onClose,
  name = 'Okan Düngel',
  username = 'okandungel',
  email = 'okandungel@jotform.com',
}: LivePreviewProfilePageProps) {
  const personalItems = [
    { title: 'Name', description: name },
    { title: 'Username', description: username },
    { title: 'Email Address', description: email },
    { title: 'Password', description: '*********' },
  ]
  const manageItems = [
    { title: 'Delete Account', description: 'Permanently delete your account.' },
  ]

  const handleLogout = () => {
    onLogout()
    onClose()
  }

  return (
    <div className="live-preview__profile">
      <Heading size="Small" alignment="Left" heading="Personal Details" subheading="" />
      <List
        layout="Basic"
        imageStyle="None"
        size="Regular"
        action="Icon"
        actionIcon="Pencil"
        actionIconFilled={false}
        showHeader={false}
        items={personalItems}
      />
      <Heading size="Small" alignment="Left" heading="Danger Zone" subheading="" />
      <List
        layout="Basic"
        imageStyle="None"
        size="Regular"
        action="Button"
        buttonLabel="Delete Account"
        showHeader={false}
        items={manageItems}
      />
      <div className="live-preview__profile-logout">
        <Button
          variant="Outlined"
          corner="Default"
          size="Default"
          fullWidth
          leftIcon="none"
          rightIcon="none"
          label="Log out"
          onClick={handleLogout}
        />
      </div>
    </div>
  )
}
