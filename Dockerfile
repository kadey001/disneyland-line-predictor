FROM node:20-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

# Set environment for development
ENV NODE_ENV=development

CMD ["npm", "run", "dev"]
