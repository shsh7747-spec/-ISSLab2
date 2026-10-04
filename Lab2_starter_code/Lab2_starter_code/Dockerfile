FROM node:22-slim

# Create app directory
ADD code/ /home/cs155/proj2/ 
WORKDIR /home/cs155/proj2/

# Remove any existing node_modules
RUN rm -rf node_modules > /dev/null 2>&1

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "node", "app" ]
