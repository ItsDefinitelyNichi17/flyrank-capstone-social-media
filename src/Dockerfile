FROM node:20
WORKDIR /home/app/src
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "start"]
