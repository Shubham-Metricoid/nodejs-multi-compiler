FROM node:slim
WORKDIR /app
COPY . /app
RUN npm install

# Install Python dependencies (if any)
RUN apt-get update && apt-get install -y python3 python3-pip

# Install PHP dependencies (if any)
RUN apt-get install -y php

# Start the application
CMD npm run dev
