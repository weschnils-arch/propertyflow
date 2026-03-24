# Floating Chat Widget — Design Spec

## Goal

A floating chat widget that appears on every page except `/communications`, allowing users to continue conversations without navigating away from their current task. Full two-way messaging with file uploads.

## Architecture

The widget is a single React component (`FloatingChat`) rendered in the app's `template.tsx` (which already handles layout routing). It uses the existing `/api/communications` and `/api/upload` endpoints — no new backend code needed.

State (selected conversation, sidebar open/closed) persists in localStorage so it survives page navigations.

## Components

### File: `src/components/layout/FloatingChat.tsx`

Single file containing all widget logic. No sub-components needed.

**States:**
- `isOpen` — widget expanded or collapsed (bubble only)
- `sidebarOpen` — conversation list sidebar expanded or collapsed
- `selectedConvoId` — current conversation entity ID (persisted in localStorage as `floating-chat-convo`)
- `conversations` — recent conversation list (fetched from `/api/communications`)
- `messages` — message thread for selected conversation
- `messageInput` — current input text
- `uploading` — file upload in progress

### Collapsed State (Bubble)

- Fixed position: `bottom-6 right-6`
- Purple gradient circle, 56px, `MessageSquare` icon
- Unread badge (red dot with count) if any conversations have unread messages
- Click toggles `isOpen`
- Framer Motion scale animation on hover/tap

### Expanded State (Chat Window)

380px wide, 500px tall, rounded-2xl, backdrop-blur, border.

**Header:**
- Selected contact: initials avatar + name + property info
- Sidebar toggle button (left side, `PanelLeftOpen`/`PanelLeftClose` icon)
- Close button (X)

**Sidebar (collapsible):**
- 200px wide when open, 0px when closed
- Animated width transition (200ms)
- Shows last 10 conversations from API
- Each item: initials circle + name + last message preview (truncated)
- Blue dot for unread
- Click switches active conversation
- Header: "Konversationen" label

**Message Area:**
- Scrollable, same bubble styling as `/communications` page
- Inbound: left-aligned, bg-card border
- Outbound: right-aligned, bg-primary
- Auto-scroll to bottom on new message
- "Noch keine Nachrichten" empty state

**Input Bar:**
- Textarea (auto-expand, 1-3 rows)
- Paperclip button for file upload (same accept types as main page: images, pdf, doc)
- Send button (primary color, disabled when empty)
- Enter to send, Shift+Enter for newline
- File upload uses `/api/upload` POST with FormData

## Data Flow

```
FloatingChat mounts
  → fetch GET /api/communications (conversation list)
  → restore selectedConvoId from localStorage
  → if selectedConvoId exists, fetch messages for that conversation

User selects conversation
  → save to localStorage
  → fetch GET /api/communications?tenantId={id} (messages)

User sends message
  → POST /api/communications (same payload as main page)
  → append to local messages array
  → auto-scroll

User uploads file
  → POST /api/upload with FormData
  → on success, send message referencing attachment

User closes widget
  → isOpen = false, state preserved
```

## Integration Point

**File: `src/app/template.tsx`**

Add `<FloatingChat />` to the non-public, non-tenant-portal layout. The template already routes between public/tenant/admin layouts, so this is where to add it.

```tsx
// In template.tsx, inside the admin AppShell branch:
return (
  <AppShell>
    {children}
    <FloatingChat />
  </AppShell>
)
```

The component self-hides on `/communications` via `usePathname()`.

## Visibility Rules

| Route | Widget Visible |
|---|---|
| `/dashboard` | Yes |
| `/properties` | Yes |
| `/tenants` | Yes |
| `/technicians` | Yes |
| `/communications` | **No** (full page handles it) |
| `/maintenance` | Yes |
| `/finances` | Yes |
| `/documents` | Yes |
| `/settings` | Yes |
| `/feature-request` | Yes |
| `/support` | Yes |
| `/login` | No (public route) |
| `/tenant-portal/*` | No (separate shell) |

## Styling

- Uses existing CSS classes: `glass-card`, `input-field`, Tailwind utilities
- Message bubbles match `/communications` page styling exactly
- Sidebar uses same `sidebar-link` hover states
- Follows current theme (dark/light/dim) automatically via CSS variables
- Widget shadow: `shadow-2xl` for depth
- Backdrop blur on the window: `backdrop-blur-xl`

## Dependencies

- `framer-motion` (already installed) — for open/close animation
- `lucide-react` (already installed) — icons
- No new packages needed

## What This Does NOT Include

- Real-time updates (polling/WebSocket) — future enhancement
- Tenant portal floating chat — only admin panel for now
- Notification sounds
- Typing indicators
