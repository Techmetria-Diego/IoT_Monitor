# Use a imagem oficial do Node.js como base
FROM node:18-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instala o pnpm globalmente
RUN npm install -g pnpm

# Instala as dependências
RUN pnpm install

# Copia todo o código fonte
COPY . .

# Build da aplicação para produção
RUN pnpm run build

# Instala um servidor HTTP simples para servir os arquivos estáticos
RUN npm install -g serve

# Expõe a porta que a aplicação irá usar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["serve", "-s", "dist", "-l", "3000"]
