FROM node:20
WORKDIR /home/app/backend
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "start"]
