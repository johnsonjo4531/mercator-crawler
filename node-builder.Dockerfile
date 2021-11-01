FROM node:14-alpine

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN mkdir -p /usr/src/app/node_modules && chown -R node:node /usr/src/app

# # Create app directory
WORKDIR /usr/src/app

# Copy usually goes source then destination. Remember source -> destination.
ONBUILD COPY ./package.json .
ONBUILD COPY ./yarn.lock .
ONBUILD COPY --chown=node . .
ONBUILD USER node
ONBUILD RUN yarn

ONBUILD RUN yarn build

CMD ["npm", "start"]
