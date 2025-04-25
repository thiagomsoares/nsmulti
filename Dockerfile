FROM node:16.20.1-alpine

LABEL maintainer="Nightscout Contributors"

WORKDIR /opt/app

# Instala git para clonar o repositório
RUN apk add --no-cache git

# Clona o repositório diretamente do GitHub
RUN git clone https://github.com/thiagomsoares/nsmulti.git .

# Instala dependências, incluindo dotenv, de forma tolerante a dependências opcionais
RUN npm install --cache /tmp/empty-cache && \
    npm install dotenv --save && \
    npm run postinstall && \
    npm run env && \
    rm -rf /tmp/*

USER node
EXPOSE 1337

CMD ["node", "lib/server/server.js"]
