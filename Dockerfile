FROM node:16.20.1-alpine

LABEL maintainer="Nightscout Contributors"

WORKDIR /opt/app

# Instala git para clonar o repositório
RUN apk add --no-cache git

# Clona o repositório diretamente do GitHub
RUN git clone https://github.com/thiagomsoares/nsmulti.git .

# Instala dependências, incluindo dotenv
RUN npm install dotenv --save && \
    npm install --cache /tmp/empty-cache && \
    npm run postinstall && \
    npm run env && \
    rm -rf /tmp/*
    # mkdir /tmp/public && \
    # chown node:node /tmp/public

USER node
EXPOSE 1337

CMD ["node", "lib/server/server.js"]
