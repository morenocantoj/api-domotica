var app = require('../index');
var supertest = require('supertest');
var assert = require('assert');

var token = "";

function chk(err, done) {
  if (err) {
    console.log(err)
    done()
  }
}

describe('Suite de pruebas de la API REST domotica', function() {
    it('GET / OK', function(done) {
        supertest(app)
        .get('/')
        .expect(200, done)
    });
    it('POST /api/login OK', function(done) {
        supertest(app)
        .post('/api/login')
        .send({login: "morenocantoj", password: "tutuha50"})
        .set('Content-Type', 'application/json')
        .expect(200, done)
        .expect(function(resp) {
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
    it('GET /api/casas', function(done) {
        supertest(app)
        .get('/api/casas')
        .set('Authorization', 'Bearer '+token)
        .expect(200, done)
        .expect(function(resp) {
            assert.notEqual(resp.body.casas.lenght, 0);
        })
    })
    it ('GET /api/casas/1', function(done) {
        supertest(app)
        .get('/api/casas/1')
        .expect(200, done)
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
    it('DELETE /api/casas/1/controller/1/regulador/2', function(done) {
        supertest(app)
        .delete('/api/casas/1/controller/1/regulador/2')
        .set('Authorization', 'Bearer '+token)
        .expect(200, done)
    });
    it('GET /api/casas/1/controller/7/programaciones equal to 0', function() {
      return supertest(app)
      .get('/api/casas/1/controller/2/programaciones?date=16-04-1995 21:32:00')
      .expect(200)
      .expect(function(result) {
        assert.equal(result.body.programaciones.length, 0)
      })

    })
    it('GET /api/casas/1/controller/1/programaciones equal to 1', function(done) {
      supertest(app)
      .get('/api/casas/1/controller/1/programaciones?date=16-04-1995 21:32:00')
      .expect(200)
      .end(function(err, resp) {
        chk(err, done)
        assert.equal(resp.body.programaciones.length, 1)
        done()
      })
    })
    it('GET /api/casas/1/controller/3/eventos equal to 0', function(done) {
      supertest(app)
      .get('/api/casas/1/controller/3/eventos')
      .expect(200)
      .end(function(err, result) {
        chk(err, done)
        assert.equal(result.body.eventos.length, 0)
        done()
      })
    })
    it('GET /api/casas/1/controller/1/eventos equal to 1', function(done) {
      supertest(app)
      .get('/api/casas/1/controller/1/eventos')
      .expect(200)
      .end(function(err, result) {
        chk(err, done)
        assert.equal(result.body.eventos.length, 1)
        done()
      })
    })
    it('GET /api/casas/1/controller/-1/eventos FAIL', function(done) {
      supertest(app)
      .get('/api/casas/1/controller/-1/eventos')
      .expect(400, done)
    })
    it('POST /api/casas/1/controller/2 (añadir dispositivo)', function(done) {
      supertest(app)
      .post('/api/casas/1/controller/2')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer '+token)
      .send({nombre: "test", port: "21", type: "light"})
      .expect(201, done)
    })
    it('GET /api/casas/1/controller/2/eventos equal to 1', function(done) {
      supertest(app)
      .get('/api/casas/1/controller/2/eventos')
      .expect(200)
      .end(function(err, result) {
        chk(err, done)
        assert.equal(result.body.eventos.length, 1)
        done()
      })
    })
});
