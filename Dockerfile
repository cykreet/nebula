FROM node:16-alpine

RUN npm i -g pnpm
WORKDIR /workspace

COPY .gitignore .gitignore
RUN pnpm install

COPY tsup.config.js tsup.config.js
RUN pnpm build

RUN apk add tini

CMD ["/sbin/tini", "--", "node", "./dist/main.js"]