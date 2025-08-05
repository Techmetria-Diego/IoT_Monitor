import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileText,
  Download,
} from 'lucide-react'
import { useState } from 'react'
import { SearchResultFile } from '@/types'
import { Separator } from './ui/separator'

interface FilePreviewProps {
  file: SearchResultFile | null
  onOpenChange: (open: boolean) => void
}

export const FilePreview = ({ file, onOpenChange }: FilePreviewProps) => {
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const totalPages = 5 // Mock total pages for PDF

  if (!file) return null

  const handleDownload = () => {
    // Mock download functionality
    alert(`Downloading ${file.name}...`)
  }

  const renderContent = () => {
    switch (file.type) {
      case 'image':
        return (
          <div className="flex justify-center items-center p-4 bg-muted rounded-lg overflow-hidden">
            <img
              src={`https://img.usecurling.com/p/800/600?q=${file.name}`}
              alt={`Preview of ${file.name}`}
              className="max-w-full max-h-[70vh] object-contain transition-transform duration-300"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        )
      case 'pdf':
        return (
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <div className="w-full h-[65vh] overflow-auto border bg-background rounded-md mb-4">
              <img
                src={`https://img.usecurling.com/p/800/1100?q=document%20page%20${page}`}
                alt={`Page ${page} of ${file.name}`}
                className="w-full h-auto transition-transform duration-300 origin-top-left"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      case 'text':
        return (
          <div className="w-full h-[70vh] p-4 bg-muted rounded-lg overflow-auto border">
            <pre className="text-sm whitespace-pre-wrap">
              {`Este é um conteúdo de texto simulado para o arquivo: ${file.name}.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam. `}
            </pre>
          </div>
        )
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[70vh] bg-muted rounded-lg text-center p-8">
            <FileText className="h-24 w-24 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">
              Visualização não disponível
            </h3>
            <p className="text-muted-foreground mt-2">
              A pré-visualização para arquivos do tipo '{file.type}' ainda não é
              suportada.
            </p>
          </div>
        )
    }
  }

  return (
    <Dialog open={!!file} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">{file.name}</DialogTitle>
          <DialogDescription>
            {file.path} - {(file.size / 1024 / 1024).toFixed(2)} MB
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto -mx-6 px-6">
          {renderContent()}
        </div>
        <Separator />
        <DialogFooter className="flex-col sm:flex-row sm:justify-between w-full">
          <div className="flex items-center gap-2">
            {(file.type === 'image' || file.type === 'pdf') && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoom((z) => z - 0.1)}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoom((z) => z + 0.1)}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="text-secondary-foreground"
            >
              Fechar
            </Button>
            <Button
              onClick={handleDownload}
              className="text-primary-foreground"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
