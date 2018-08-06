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
            assert.equal(resp.body.casas[0].id, "1");
        })
    })
    it ('GET /api/casas/1', function() {
        supertest(app)
        .get('/api/casas/1')
        .expect(200)
        .end(function(err, resp) {
            assert.equal(resp.body.inmueble_id, "1");
        })
    });
    it ('GET /api/casas/1/controller/1', function(done) {
        supertest(app)
        .get('/api/casas/1/controller/1?offset=1')
        .set('Content-Type', 'application/json')
        .expect(function (res) {
            assert(res.body.id, "1");
        })
        .expect(200, done)
    });
    it('POST /api/casas/1/controller/1', function(done) {
        supertest(app)
        .post('/api/casas/1/controller/1')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer '+token)
        .send({nombre: "TEST"})
        .expect(201, done)
    });
    it('PUT /api/casas/1/controller/1/regulador/3', function(done) {
        supertest(app)
        .put('/api/casas/1/controller/1/regulador/3')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer '+token)
        .send({temperatura: "17"})
        .expect(function (res) {
            assert(res.body.nueva_temperatura, "17")
        })
        .expect(200, done)
    });
    it('DELETE /api/casas/1/controller/1/regulador/1', function(done) {
        supertest(app)
        .delete('/api/casas/1/controller/1/regulador/1')
        .set('Authorization', 'Bearer '+token)
        .expect(200, done)
    });
    it('POST /api/casas/1/controller/1/programacion', function(done) {
        supertest(app)
        .post('/api/casas/1/controller/1/programacion')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer '+token)
        .send({dispositivo_id: "3", fecha: "26/11/2017 15:30", action: "PUT temperatura 25"})
        .expect(200, done)
    });
});
