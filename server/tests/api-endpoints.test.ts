import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';

describe('API Endpoints', () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(() => {
    // Clean up resources
    server.close();
  });

  describe('GET /api/contacts', () => {
    it('should return a contact when a valid phone number is provided', async () => {
      const response = await request(app).get('/api/contacts?phone=(555) 345-6789');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('contact_id');
      expect(response.body).toHaveProperty('first_name', 'Emily');
      expect(response.body).toHaveProperty('last_name', 'Chen');
      expect(response.body).toHaveProperty('phone', '(555) 345-6789');
    });

    it('should return an empty array when no contact matches the phone number', async () => {
      const response = await request(app).get('/api/contacts?phone=999-999-9999');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 400 when no phone parameter is provided', async () => {
      const response = await request(app).get('/api/contacts');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Phone parameter is required');
    });
  });

  describe('POST /api/contacts', () => {
    it('should create a new contact with the provided details', async () => {
      const contactData = {
        first_name: 'John',
        last_name: 'Smith',
        phone: '+1234567890'
      };
      
      const response = await request(app)
        .post('/api/contacts')
        .send(contactData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('contact_id');
      expect(response.body).toHaveProperty('first_name', 'John');
      expect(response.body).toHaveProperty('last_name', 'Smith');
      expect(response.body).toHaveProperty('phone', '+1234567890');
      expect(response.body).toHaveProperty('contact_url');
    });

    it('should create a contact with default values if names are not provided', async () => {
      const contactData = {
        phone: '+9876543210'
      };
      
      const response = await request(app)
        .post('/api/contacts')
        .send(contactData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('first_name', 'Caller');
      expect(response.body).toHaveProperty('last_name', 'Unknown');
    });

    it('should return 400 if phone number is not provided', async () => {
      const contactData = {
        first_name: 'John',
        last_name: 'Smith'
      };
      
      const response = await request(app)
        .post('/api/contacts')
        .send(contactData);
      
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/calls', () => {
    it('should log a call with all fields provided', async () => {
      const callData = {
        contact_id: '3',
        call_type: 'inbound',
        duration: 120,
        timestamp: '2025-04-06T14:30:00Z',
        notes: 'Discussed policy renewal options',
        agent: 'Sarah Johnson',
        phone: '+1234567890'
      };
      
      const response = await request(app)
        .post('/api/calls')
        .send(callData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Call logged successfully.');
      expect(response.body).toHaveProperty('log_id');
    });

    it('should log a call without a contact_id', async () => {
      const callData = {
        call_type: 'outbound',
        duration: 60,
        timestamp: '2025-04-06T15:30:00Z',
        notes: 'Left a message',
        agent: 'Emily Chen',
        phone: '+9876543210'
      };
      
      const response = await request(app)
        .post('/api/calls')
        .send(callData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
    });

    it('should handle minimal call data', async () => {
      const callData = {
        phone: '+9876543210'
      };
      
      const response = await request(app)
        .post('/api/calls')
        .send(callData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
    });
  });
}); 