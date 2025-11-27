import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Auth E2E', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('deve registrar novo usuário', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `teste${Date.now()}@e2e.com`,
          password: 'senha123',
          name: 'Usuário Teste E2E',
          clinicId: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          authToken = res.body.access_token;
        });
    });

    it('deve rejeitar email duplicado', () => {
      const email = `duplicado${Date.now()}@e2e.com`;
      
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'senha123',
          name: 'Usuário Teste',
          clinicId: 1,
        })
        .expect(201)
        .then(() => {
          return request(app.getHttpServer())
            .post('/auth/register')
            .send({
              email,
              password: 'senha123',
              name: 'Usuário Teste 2',
              clinicId: 1,
            })
            .expect(400);
        });
    });
  });

  describe('/auth/login (POST)', () => {
    it('deve fazer login com credenciais válidas', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@elevare.com',
          password: 'senha123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
        });
    });

    it('deve rejeitar credenciais inválidas', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@elevare.com',
          password: 'senhaerrada',
        })
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('deve retornar perfil do usuário autenticado', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@elevare.com',
          password: 'senha123',
        });

      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${loginRes.body.access_token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'admin@elevare.com');
        });
    });

    it('deve rejeitar sem token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });
});
