import { Link } from 'react-router-dom'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-8 bg-secondary py-4 border-t">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 text-center text-sm text-secondary-foreground">
        <p>
          &copy; {currentYear} Monitoramento Água Drive. Todos os direitos
          reservados.
        </p>
        <div className="mt-2">
          <Link to="#" className="hover:text-primary mx-2">
            Termos de Uso
          </Link>
          <span className="mx-2">|</span>
          <Link to="#" className="hover:text-primary mx-2">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  )
}
