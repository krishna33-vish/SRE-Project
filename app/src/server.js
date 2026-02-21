const express = require('express');
const client = require('prom-client');
const winston = require('winston');
const { createLogger, format, transports } = winston;

// Initialize Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code']
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Logger setup
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

const app = express();
app.use(express.json());

// Middleware for metrics collection
app.use((req, res, next) => {
  activeConnections.inc();
  const end = httpRequestDurationMicroseconds.startTimer();
  
  res.on('finish', () => {
    activeConnections.dec();
    end({ 
      method: req.method, 
      route: req.route?.path || req.path, 
      code: res.statusCode 
    });
    
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      code: res.statusCode
    });
    
    logger.info({
      message: 'Request completed',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - req.startTime
    });
  });
  
  req.startTime = Date.now();
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Readiness probe endpoint
app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready' });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Main API endpoints with failure modes for testing
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  
  // Simulate random latency for SLO testing
  if (Math.random() < 0.1) { // 10% of requests are slow
    setTimeout(() => {
      res.json({ id: userId, name: `User ${userId}`, slow: true });
    }, 500); // 500ms latency
  } else {
    res.json({ id: userId, name: `User ${userId}` });
  }
});

// Endpoint that can fail for testing
app.post('/api/orders', (req, res) => {
  const { items } = req.body;
  
  // Simulate random failures
  if (Math.random() < 0.05) { // 5% failure rate
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(201).json({ 
      orderId: Date.now(), 
      items,
      status: 'created' 
    });
  }
});

// Memory leak simulation (for chaos testing)
let memoryLeak = [];
app.post('/api/debug/leak', (req, res) => {
  const size = req.body.size || 1000000;
  memoryLeak.push(new Array(size).fill('leak'));
  res.json({ message: `Added ${size} items to memory leak` });
});

// CPU spike simulation
app.get('/api/debug/cpu-spike', (req, res) => {
  const duration = req.query.duration || 5000;
  const end = Date.now() + duration;
  while (Date.now() < end) {
    // Busy wait - CPU spike
    Math.random() * Math.random();
  }
  res.json({ message: `CPU spike for ${duration}ms completed` });
});

// Error simulation endpoint (controlled failure)
app.get('/api/debug/error', (req, res) => {
  const errorType = req.query.type || '500';
  
  switch(errorType) {
    case '400':
      res.status(400).json({ error: 'Bad request' });
      break;
    case '500':
      res.status(500).json({ error: 'Internal server error' });
      break;
    case 'timeout':
      setTimeout(() => res.json({ message: 'Delayed response' }), 5000);
      break;
    default:
      res.status(200).json({ message: 'No error' });
  }
});

// Reset debug state
app.post('/api/debug/reset', (req, res) => {
  memoryLeak = [];
  res.json({ message: 'Debug state reset' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;