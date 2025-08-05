import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react'

const NotFound = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname,
    )
  }, [location.pathname])

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center mx-auto">
          <CardHeader className="pb-4">
            <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-3xl font-bold mb-2">404</CardTitle>
            <p className="text-xl text-muted-foreground">
              Página não encontrada
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              A página que você está procurando não existe ou foi movida.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate(-1)} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={() => navigate('/')}>
                <Home className="mr-2 h-4 w-4" />
                Ir para o Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default NotFound
