const request = require('supertest');
const { faker } = require('@faker-js/faker');
const httpStatus = require('http-status');
const app = require('../../src/app');
const { userOne, admin, insertUsers, userTwo } = require('../fixtures/user.fixture');
let { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const prisma = require('../../prisma');
const { tokenService } = require('../../src/services');

describe.skip('Users route', () => {
  let newUser;
  beforeEach(async () => {
    newUser = {
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      email: 'brong@gmail.com',
      password: 'password1#',
      role: 'user',
    };
  });

  describe('Authorization', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await insertUsers([userOne, admin]);
      const validAccessToken = await tokenService.generateAuthTokens(userOne);
      userOneAccessToken = validAccessToken.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .post('/api/users')
        .send(newUser)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      const pagination = { role: userOne.role, page: 1, size: 2 };

      await request(app)
        .get('/api/users')
        .query({ pagination })
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .get(`/api/users/${userOne.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .patch(`/api/users/${userOne.id}`)
        .send(newUser)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .delete(`/api/users/${userOne.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).post('/api/users').send(newUser).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      const pagination = { role: userOne.role, page: 1, size: 2 };
      await request(app).get('/api/users').query({ pagination }).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).get(`/api/users/${userOne.id}`).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).patch(`/api/users/${userOne.id}`).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).delete(`/api/users/${userOne.id}`).expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST api/users/', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await insertUsers([userOne, admin]);
      const validAccessToken = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessToken.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
    });

    test('should return 201 OK if successfully created user', async () => {
      const res = await request(app)
        .post('/api/users/')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.CREATED);

      const userData = res.body.data;

      expect(userData).toEqual({
        id: expect.anything(),
        name: newUser.name,
        password: expect.anything(),
        email: newUser.email,
        role: newUser.role,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      const dbUser = await prisma.user.findUnique({
        where: { id: userData.id },
      });

      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(newUser.password);

      expect(dbUser).toMatchObject({
        id: expect.anything(),
        name: newUser.name,
        password: expect.anything(),
        email: newUser.email,
        role: newUser.role,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 400 Bad Request if format email invalid', async () => {
      newUser.email = 'brongz@yahoo';
      await request(app)
        .post('/api/users')
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if password length is less than 8 characters', async () => {
      newUser.password = 'brong1#';
      await request(app)
        .post('/api/users')
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if password is not unique characters ', async () => {
      newUser.password = 'brong1';
      await request(app)
        .post('/api/users')
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if password is not contain 1 caracter unique or 1 number', async () => {
      newUser.password = 'brongzzz';
      await request(app)
        .post('/api/users')
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if data is not input', async () => {
      await request(app)
        .post('/api/users')
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe.skip('GET /api/users/:userId', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await insertUsers([userOne, admin]);
      const validAccessToken = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessToken.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
    });

    test('should return 200 OK if Get User By Id is successfully', async () => {
      const res = await request(app)
        .get(`/api/users/${userOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      const userData = res.body.data;

      expect(userData).toEqual({
        id: expect.anything(),
        name: userOne.name,
        password: expect.anything(),
        email: userOne.email,
        role: userOne.role,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 404 if Id user is Not Found', async () => {
      await request(app)
        .get(`/api/users/${userTwo.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe.skip('GET /api/user/email/:email', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await insertUsers([userOne, admin]);
      const validAccessToken = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessToken.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
    });

    test('should return 200 OK if Get user By Email is successfully', async () => {
      const res = await request(app)
        .get(`/api/users/email/${userOne.email}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      const userData = res.body.data;

      expect(userData).toEqual({
        id: expect.anything(),
        name: userOne.name,
        password: expect.anything(),
        email: userOne.email,
        role: userOne.role,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 404 if Email user is Not Found', async () => {
      await request(app)
        .get(`/api/users/email/${userTwo.email}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 400 Bad Request if format email invalid', async () => {
      userOne.email = 'brongz@yahoo';
      await request(app)
        .get(`/api/users/email/${userOne.email}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe.skip('GET /api/users', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await insertUsers([userOne, admin]);
      const validAccessToken = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessToken.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
    });

    test('should return 200 OK if Get Users Data is successfully', async () => {
      const pagination = { role: userOne.role, page: 1, size: 2 };
      const res = await request(app)
        .get('/api/users/')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query(pagination)
        .expect(httpStatus.OK);

      const userData = res.body.data;
      const userCurrentPage = res.body.currentPage;
      const userTotalData = res.body.totalData;
      const userTotalPage = res.body.totalPage;

      expect(res.body.data).toEqual([
        {
          id: expect.anything(),
          name: userOne.name,
          password: expect.anything(),
          email: userOne.email,
          role: userOne.role,
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        },
      ]);

      expect(userCurrentPage).toEqual(expect.any(Number));
      expect(userTotalData).toEqual(expect.any(Number));
      expect(userTotalPage).toEqual(expect.any(Number));

      const dbUser = await prisma.user.findUnique({
        where: { id: userData[0].id },
      });

      expect(dbUser).toBeDefined();
      expect(dbUser).toMatchObject({
        id: expect.anything(),
        name: userOne.name,
        password: expect.anything(),
        email: userOne.email,
        role: userOne.role,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('shoul return 400 Bad Request if query pagination is null', async () => {
      await request(app)
        .get('/api/users')
        .query({ role: null, page: null, size: null })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('shoul return 400 Bad Request if query pagination is null', async () => {
      await request(app)
        .get('/api/users')
        .query({ role: null, page: 1, size: 2 })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('shoul return 400 Bad Request if query pagination is null', async () => {
      await request(app)
        .get('/api/users')
        .query({ role: userOne.role, page: null, size: 2 })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('shoul return 400 Bad Request if query pagination is null', async () => {
      await request(app)
        .get('/api/users')
        .query({ role: userOne.role, page: 1, size: null })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if page is grather than total page or size is greater than total data', async () => {
      await request(app)
        .get('/api/users')
        .query({ role: userOne.role, page: 1, size: 100 })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe.skip('PATCH /api/users/:userId', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await insertUsers([userOne, admin]);
      const validAccessToken = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessToken.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
    });

    test('should return 200 Ok if Update data user By Id is successfully', async () => {
      const res = await request(app)
        .patch(`/api/users/${userOne.id}`)
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      const userData = res.body.data;

      expect(userData).toEqual({
        id: expect.anything(),
        name: newUser.name,
        password: expect.anything(),
        email: newUser.email,
        role: newUser.role,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      const dbUser = await prisma.user.findUnique({
        where: { id: userData.id },
      });

      expect(dbUser).toBeDefined();
      expect(dbUser).toMatchObject({
        id: expect.anything(),
        name: newUser.name,
        password: expect.anything(),
        email: newUser.email,
        role: newUser.role,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 400 Bad Request if format Email is invalid', async () => {
      newUser.email = 'brongz@yahoo';
      await request(app)
        .patch(`/api/users/${userOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 if Update User By Id is Not Found', async () => {
      await request(app)
        .patch(`/api/users/${userTwo.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 401 Bad Request if data Update is null ', async () => {
      await request(app)
        .patch(`/api/users/${userOne.id}`)
        .send({})
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe.skip('DELETE /api/users/:userId', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await insertUsers([userOne, admin]);
      const validAccessToken = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessToken.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
    });

    test('should return Ok if Delete User By Id successfully', async () => {
      const res = await request(app)
        .delete(`/api/users/${userOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      const userData = res.body.data;

      expect(userData).toEqual({
        id: expect.anything(),
        name: userOne.name,
        password: expect.anything(),
        email: userOne.email,
        role: userOne.role,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      const dbUser = await prisma.user.findUnique({
        where: { id: userData.id },
      });

      expect(dbUser).toBeNull();
    });

    test('should return 404 if Delete User By Id is Not Found', async () => {
      await request(app)
        .delete(`/api/users/${userTwo.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
