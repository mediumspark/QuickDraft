import { Link } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { clearPendingPayment } from '@/services/payments'
import * as React from 'react'

export default function PaymentCancelled() {
  React.useEffect(() => {
    clearPendingPayment()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-lg text-center space-y-6">
        <XCircle className="h-14 w-14 text-muted-foreground mx-auto" />
        <div>
          <h1 className="text-3xl font-bold">Payment cancelled</h1>
          <p className="text-muted-foreground mt-2">
            No charge was made. You can return to the builder and try again whenever you’re ready.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/builder">
            <Button size="lg">Back to Builder</Button>
          </Link>
          <Link to="/pricing">
            <Button size="lg" variant="outline">View Pricing</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
