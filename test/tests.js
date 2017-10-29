var app = require('../index');
var supertest = require('supertest');
var assert = require('assert');

var token = "";

describe('Suite de pruebas de la API REST domotica', function() {
    it('GET / OK', function(done) {
        supertest(app)
        .get('/')
        .expect(200, done)
    });
    it('POST /api/login OK', function() {
        supertest(app)
        .post('/api/login')
        .send({login: "morenocantoj", password: "elfaryvive"})
        .set('Content-Type', 'application/json')
        .expect(200)
        .end(function(err, resp) {
            token = resp.body.token;
            assert(JSON.stringify(resp.body) != null);
        })
    });
    it('POST /api/login FAIL', function(done) {
        supertest(app)
        .post('/api/login')
        .send({login: "rally", password: "petorro"})
        .set('Content-Type', 'application/json')
        .expect(500, done)
    })
    it('GET /api/casas', function() {
        supertest(app)
        .get('/api/casas')
        .set('Authorization', 'Bearer '+token)
        .expect(200)
        .end(function(err, resp) {
            assert(JSON.stringify(resp.body.casas[0].id) == 1);
        })
    })
    it ('GET /api/casas/1', function() {
        supertest(app)
        .get('/api/casas/1')
        .expect(200)
        .end(function(err, resp) {
            assert(JSON.stringify(resp.body.inmueble_id) == 1);
        })
    });
    it ('GET /api/casas/1/controller/1', function() {
        supertest(app)
        .get('/api/casas/1/controller/1')
        .expect(200)
        .end(function(err, resp) {
            assert(JSON.stringify(resp.body.id) == 7);
        })
    });
});