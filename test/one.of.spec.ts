import * as path from 'path';
import * as express from 'express';
import { expect } from 'chai';
import * as request from 'supertest';
import { createApp } from './common/app';

const packageJson = require('../package.json');

describe.only(packageJson.name, () => {
  let app = null;

  before(async () => {
    const apiSpec = path.join('test', 'resources', 'one.of.yaml');
    app = await createApp(
      { apiSpec },
      3005,
      app => {
        app.post(`${app.basePath}/one_of`, (req, res) => {
          res.json(req.body);
        });
        app.use((err, req, res, next) => {
          res.status(err.status || 500).json({
            message: err.message,
            code: err.status || 500,
          });
        });
      },
      false,
    );
  });

  after(() => {
    app.server.close();
  });

  it('should return 200 one first oneOf option', async () => {
    return request(app)
      .post(`${app.basePath}/one_of`)
      .set('content-type', 'application/json')
      .send({
        id: 'some_id',
        array_of_oneofs: [
          {
            type: 'type_1',
            unique_one: 'unique_one',
          },
        ],
      })
      .expect(200);
  });

  it('should return 200 one second oneOf option', async () => {
    return request(app)
      .post(`${app.basePath}/one_of`)
      .set('content-type', 'application/json')
      .send({
        id: 'some_id',
        array_of_oneofs: [
          {
            type: 'type_2',
            unique_two: 'unique_two',
          },
        ],
      })
      .expect(200);
  });

  it('should return 400 for invalid oneOf option', async () => {
    return request(app)
      .post(`${app.basePath}/one_of`)
      .set('content-type', 'application/json')
      .send({
        id: 'some_id',
        array_of_oneofs: [
          {
            type: 'type_2',
            unique_three: 'unique_three',
          },
        ],
      })
      .expect(400)
      .then(r => {
        const e = r.body;
        expect(e.message).to.contain(
          'should match exactly one schema in oneOf',
        );
      });
  });
});