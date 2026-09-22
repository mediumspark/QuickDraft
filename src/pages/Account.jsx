import * as React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LogOut, BadgeCheck, Upload } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import GiveAwardModal, { AwardIconBySlug } from '@/components/GiveAwardModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'
import { GENRE_BOARDS } from '@/data/forumBoards'
import {
  getPromptOfTheDay,
  setPromptOfTheDay,
  getProfile,
  getMyWallet,
  updateMyProfile,
  uploadAvatar,
  getVerificationProgress,
  listMyAwardInventory,
} from '@/services/supabase'

export default function Account() {
  const { user, isAdmin, loading, signOut, isAuthConfigured } = useAuth()
  const { addToast } = useToast()
  const [searchParams] = useSearchParams()
  const [authOpen, setAuthOpen] = React.useState(false)
  const [prompt, setPrompt] = React.useState('')
  const [promptLoading, setPromptLoading] = React.useState(false)
  const [savingPrompt, setSavingPrompt] = React.useState(false)

  const [profile, setProfile] = React.useState(null)
  const [wallet, setWallet] = React.useState(null)
  const [verify, setVerify] = React.useState(null)
  const [displayName, setDisplayName] = React.useState('')
  const [bio, setBio] = React.useState('')
  const [interests, setInterests] = React.useState([])
  const [savingProfile, setSavingProfile] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [inventory, setInventory] = React.useState([])
  const [shopOpen, setShopOpen] = React.useState(false)
  const fileRef = React.useRef(null)

  React.useEffect(() => {
    const award = searchParams.get('award')
    if (award === 'success') addToast('Award purchase complete — check your inventory')
    if (award === 'cancel') addToast('Checkout canceled', 'error')
  }, [searchParams, addToast])

  const reloadProfile = React.useCallback(async () => {
    if (!user) return
    const [p, w, v, inv] = await Promise.all([
      getProfile(user.id),
      getMyWallet(),
      getVerificationProgress(user.id),
      listMyAwardInventory(),
    ])
    setProfile(p.data)
    setWallet(w.data)
    setVerify(v.data)
    setDisplayName(p.data?.display_name || '')
    setBio(p.data?.bio || '')
    setInterests(Array.isArray(p.data?.interests) ? p.data.interests : [])
    setInventory(inv.data || [])
  }, [user])

  React.useEffect(() => {
    if (user) reloadProfile()
  }, [user, reloadProfile])

  React.useEffect(() => {
    if (!isAdmin) return undefined
    let cancelled = false
    setPromptLoading(true)
    ;(async () => {
      const { data, error } = await getPromptOfTheDay()
      if (cancelled) return
      if (error) addToast(error.message || 'Could not load prompt', 'error')
      setPrompt(data?.body || '')
      setPromptLoading(false)
    })()
    return () => { cancelled = true }
  }, [isAdmin, addToast])

  const savePrompt = async () => {
    setSavingPrompt(true)
    try {
      const { error } = await setPromptOfTheDay(prompt)
      if (error) throw error
      addToast(prompt.trim() ? 'Prompt of the day updated' : 'Prompt cleared from the homepage')
    } catch (err) {
      addToast(err.message || 'Could not save prompt', 'error')
    } finally {
      setSavingPrompt(false)
    }
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const { error } = await updateMyProfile({
        display_name: displayName,
        bio,
        interests,
      })
      if (error) throw error
      addToast('Profile saved')
      await reloadProfile()
    } catch (err) {
      addToast(err.message || 'Could not save profile', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const onAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { error } = await uploadAvatar(file)
      if (error) throw error
      addToast('Avatar updated')
      await reloadProfile()
    } catch (err) {
      addToast(err.message || 'Upload failed', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const toggleInterest = (slug) => {
    setInterests((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-lg space-y-6">
        <h1 className="text-3xl font-bold">Account</h1>
        {user ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Signed in</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {isAdmin && (
                  <p className="text-xs text-primary font-medium">Admin</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link to={`/writers/${user.id}`}>
                    <Button variant="outline">Public profile</Button>
                  </Link>
                  <Link to="/drafts">
                    <Button variant="outline">My drafts</Button>
                  </Link>
                  <Link to="/write">
                    <Button>Write</Button>
                  </Link>
                  <Button variant="ghost" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Sign out
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-semibold text-muted-foreground">
                        {(displayName || user.email || '?').slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
                    <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
                      {uploading ? <Spinner size="sm" /> : <Upload className="h-4 w-4 mr-1" />}
                      Upload avatar
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bio">Short bio ({bio.length}/300)</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    value={bio}
                    maxLength={300}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="A few lines about what you write…"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {GENRE_BOARDS.map((b) => {
                      const on = interests.includes(b.slug)
                      return (
                        <label
                          key={b.slug}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs cursor-pointer ${
                            on ? 'border-primary bg-accent' : 'border-border'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={on}
                            onChange={() => toggleInterest(b.slug)}
                          />
                          {b.name}
                        </label>
                      )
                    })}
                  </div>
                </div>
                <Button onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? <Spinner size="sm" /> : null}
                  Save profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Points
                  {verify?.is_verified_writer && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <BadgeCheck className="h-4 w-4" />
                      Verified writer
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Total earned (public): </span>
                  <span className="font-semibold tabular-nums">{profile?.points_earned ?? 5}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Current balance (private): </span>
                  <span className="font-semibold tabular-nums">{wallet?.points_balance ?? 5}</span>
                </p>
                {!verify?.is_verified_writer && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Unlock Verified Writer to earn points:</p>
                    <p>{verify?.has_writing ? '✓' : '○'} Publish writing to the forum</p>
                    <p>{verify?.has_upvote ? '✓' : '○'} Receive an upvote on your writing</p>
                    <p>{verify?.has_critique ? '✓' : '○'} Receive a critique comment on your writing</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Publishing grants 5 points per page. Upvotes gift weight without spending your balance.
                  You can’t buy points — only awards.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Awards inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {inventory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No awards yet. Buy with points or card, then give on a post.</p>
                ) : (
                  <ul className="space-y-2">
                    {inventory.map((row) => (
                      <li key={row.award_id} className="flex items-center gap-2 text-sm">
                        <AwardIconBySlug icon={row.awards?.icon} />
                        <span className="font-medium">{row.awards?.name}</span>
                        <span className="text-muted-foreground">×{row.quantity}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button variant="outline" onClick={() => setShopOpen(true)}>Buy awards</Button>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Prompt of the day</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This shows on the homepage under the headline. Leave blank to hide it.
                  </p>
                  {promptLoading ? (
                    <Spinner />
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="potd">Prompt</Label>
                        <Textarea
                          id="potd"
                          rows={4}
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Write today’s prompt…"
                        />
                      </div>
                      <Button onClick={savePrompt} disabled={savingPrompt}>
                        {savingPrompt ? <Spinner size="sm" /> : null}
                        Save to homepage
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-muted-foreground">Sign in to manage your account.</p>
              <Button onClick={() => setAuthOpen(true)}>Sign in</Button>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} redirectPath="/account" isConfigured={isAuthConfigured} />
      {user && (
        <GiveAwardModal
          open={shopOpen}
          onOpenChange={setShopOpen}
          postId={null}
          onGiven={reloadProfile}
          addToast={addToast}
        />
      )}
    </div>
  )
}
