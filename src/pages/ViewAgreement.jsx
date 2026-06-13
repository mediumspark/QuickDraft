import * as React from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import AgreementPreview from '@/components/AgreementPreview'
import PartyNameInputs from '@/components/PartyNameInputs'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { loadAgreementById } from '@/services/supabase'
import { downloadPdf } from '@/utils/pdfUtils'
export default function ViewAgreement() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [agreement, setAgreement] = React.useState(null)
  const [signatures, setSignatures] = React.useState({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error: err } = await loadAgreementById(id, token)
      if (err || !data) {
        setError('Agreement not found or invalid share link.')
      } else {
        setAgreement(data)
        setSignatures(data.signatures || {})
      }
      setLoading(false)
    }
    load()
  }, [id, token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">{error}</p>
        <Link to="/"><Button variant="outline">Back to Home</Button></Link>
      </div>
    )
  }

  const handlePartiesChange = (parties) => {
    setAgreement((a) => ({ ...a, parties }))
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="font-semibold">QuickDraft</Link>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadPdf(agreement, signatures)}
            >
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Read-only shared agreement. Fill in your name and sign below.
        </div>

        <PartyNameInputs parties={agreement.parties} onChange={handlePartiesChange} />

        <AgreementPreview
          agreement={agreement}
          signatures={signatures}
          onSignaturesChange={setSignatures}
        />
      </div>
    </div>
  )
}
