import { Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { SECURITY_INFO } from '@/lib/secure-xlsx'

export const SecurityStatusCard = () => {
  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Shield className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Status de Segurança
        <Badge variant="outline" className="text-amber-700 border-amber-300">
          Protegido
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <div className="space-y-2">
          <p className="text-sm text-amber-800">
            <strong>Vulnerabilidades conhecidas identificadas:</strong>
          </p>
          <div className="space-y-1">
            {SECURITY_INFO.vulnerabilities.map((vuln, index) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                <AlertTriangle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">{vuln.type}:</span>{' '}
                  <span className="text-amber-700">{vuln.description}</span>
                  <br />
                  <span className="text-amber-600">Mitigação: {vuln.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-green-800">
            <strong>Proteções implementadas:</strong>
          </p>
          <div className="grid grid-cols-1 gap-1">
            {SECURITY_INFO.mitigations.map((mitigation, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-green-700">
                <CheckCircle className="h-3 w-3 flex-shrink-0" />
                <span>{mitigation}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-xs text-amber-600 mt-3 p-2 bg-amber-100 rounded">
          <strong>Nota:</strong> Estamos monitorando as atualizações da biblioteca xlsx. 
          As correções definitivas serão aplicadas assim que as versões corrigidas forem publicadas.
        </div>
      </AlertDescription>
    </Alert>
  )
}
