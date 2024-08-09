const request = require('supertest');
const { faker } = require('@faker-js/faker');
const httpStatus = require('http-status');
const httpMocks = require('node-mocks-http');
const moment = require('moment');
const app = require('../../src/app');
const { userOne, admin, insertUsers } = require('../fixtures/user.fixture');
const {
  generateTokens,
  insertRefreshToken,
  refreshOne,
  userOneRefreshToken,
  userTwoRefreshToken,
} = require('../fixtures/token.fixture');
const prisma = require('../../prisma');
const { auth } = require('../../src/middlewares/auth');
const ApiError = require('../../src/utils/ApiError');
const config = require('../../src/config/config');
const { tokenService } = require('../../src/services');
const { tokenTypes } = require('../../src/config/tokens');

describe.skip('Auth routes', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
    await prisma.token.deleteMany();
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
    await prisma.token.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    let newUser;
    beforeEach(() => {
      newUser = {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1#',
        role: 'user',
      };
    });

    test('should return 201 and successfully register user if request data is ok', async () => {
      const res = await request(app).post('/api/auth/register/').send(newUser).expect(httpStatus.CREATED);

      const userData = res.body.userCreated;

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
        where: {
          id: userData.id,
        },
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

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return 400 error if email is invalid', async () => {
      newUser.email = 'invalidEmail';

      await request(app).post('/api/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if email is already used', async () => {
      await insertUsers([userOne]);
      newUser.email = userOne.email;

      await request(app).post('/api/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      newUser.password = 'passwo1';

      await request(app).post('/api/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password does not contain both letters and numbers', async () => {
      newUser.password = 'password';

      await request(app).post('/api/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);

      newUser.password = '11111111';

      await request(app).post('/api/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should return 200 and login user if email and password match', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app).post('/api/auth/login').send(loginCredentials);

      expect(res.body.user).toEqual({
        id: expect.anything(),
        name: userOne.name,
        email: userOne.email,
        password: expect.anything(),
        role: userOne.role,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return 401 error if password is wrong', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: 'wrongPassword1',
      };

      const res = await request(app).post('/api/auth/login').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Incorrect email or password' });
    });
  });

  describe('PATCH /api/auth/logout', () => {
    test('should return 200 and logout user if email match', async () => {
      await insertUsers([userOne]);
      const logoutCredentials = { email: userOne.email };

      const res = await request(app).patch('/api/auth/logout').send(logoutCredentials).expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        id: expect.anything(),
        name: expect.anything(),
        email: userOne.email,
        password: expect.anything(),
        role: expect.anything(),
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 404 error if email not found', async () => {
      await insertUsers([userOne]);
      const logoutCredentials = {
        email: 'nonexistentemail@gmail.com',
      };

      const res = await request(app).patch('/api/auth/logout').send(logoutCredentials).expect(httpStatus.NOT_FOUND);

      expect(res.body).toEqual({ code: httpStatus.NOT_FOUND, message: 'Email not found' });
    });
  });

  describe('POST /api/auth/refresh', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await insertUsers([userOne]); //insert lagi user yang baru
    });

    test('should return 200 and new token if refresh token is valid', async () => {
      await insertRefreshToken([refreshOne]);
      const refreshCredentials = { refreshToken: generateTokens.userOneAccessToken };
      const res = await request(app).post('/api/auth/refresh').send(refreshCredentials).expect(httpStatus.OK);

      expect(res.body).toEqual({
        refresh: {
          access: { token: expect.anything(), expires: expect.anything() },
          refresh: { token: expect.anything(), expires: expect.anything() },
        },
      });

      const dbToken = await prisma.token.findFirst({
        where: { userId: userOne.id, type: tokenTypes.REFRESH },
      });

      expect(dbToken).toBeDefined(); //memastikan tidak undefind
      expect(dbToken.refresh).not.toBe(refreshOne.token); //memastikan token sudah di ganti
    });

    test('should return 401 unauthorized if type token doesnt match', async () => {
      await insertRefreshToken([refreshOne]);
      const refreshCredentials = { refreshToken: userOneAccessToken };
      const res = await request(app).post('/api/auth/refresh').send(refreshCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Invalid token type' });
    });

    test('should return 401 unauthorized if token not found', async () => {
      await insertRefreshToken([refreshOne]);
      const refreshCredentials = { refreshToken: userTwoRefreshToken };
      const res = await request(app).post('/api/auth/refresh').send(refreshCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Token not found' });
    });

    test('should return 401 unauthorized if token not valid', async () => {
      await insertRefreshToken([refreshOne]);
      const refreshCredentials = { refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID_PAYLOAD' };
      const res = await request(app).post('/api/auth/refresh').send(refreshCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Invalid token signature' });
    });
  });
});

describe.skip('Auth middleware', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
    await prisma.token.deleteMany();
    await insertUsers([userOne]);
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
    await prisma.token.deleteMany();
  });

  test('should call next with no errors if access token is valid', async () => {
    const validAccessToken = await tokenService.generateAuthTokens(userOne); //token di generate lagi karena sebelumnya logout (blacklisted = true)
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${validAccessToken.access.token}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user.id).toEqual(userOne.id);
  });

  test('should call next with unauthorized error if access token is not found in header', async () => {
    const req = httpMocks.createRequest();
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' }),
    );
  });

  test('should call next with unauthorized error if access token is not a valid jwt token', async () => {
    const req = httpMocks.createRequest({ headers: { Authorization: 'Bearer randomToken' } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' }),
    );
  });

  test('should call next with unauthorized error if the token is not an access token', async () => {
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const refreshToken = tokenService.generateToken(userOne.id, expires, tokenTypes.REFRESH);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${refreshToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' }),
    );
  });

  test('should call next with unauthorized error if access token is generated with an invalid secret', async () => {
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = tokenService.generateToken(userOne.id, expires, tokenTypes.ACCESS, 'invalidSecret');
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' }),
    );
  });

  test('should call next with unauthorized error if access token is expired', async () => {
    const expires = moment().subtract(1, 'minutes');
    const accessToken = tokenService.generateToken(userOne.id, expires, tokenTypes.ACCESS);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' }),
    );
  });

  describe('delete user in database before run', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
    });

    test('should call next with unauthorized error if user is not found', async () => {
      const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
      const next = jest.fn();

      await auth()(req, httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' }),
      );
    });
  });
});
