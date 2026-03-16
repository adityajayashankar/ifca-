FROM node:16-alpine3.11

WORKDIR /senior-central



COPY . /senior-central

RUN npm install

RUN npm run build

EXPOSE 3000

CMD npm run dev
