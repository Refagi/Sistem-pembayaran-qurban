const request = require('supertest');
const { faker } = require('@faker-js/faker');
const httpStatus = require('http-status');
const app = require('../../src/app');
const { userOne, admin, insertUsers, userTwo } = require('../fixtures/user.fixture');
const { animalOne, animalTwo, insertAnimals } = require('../fixtures/animal.fixture');
let { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const prisma = require('../../prisma');
const { tokenService } = require('../../src/services');

describe.skip('Animal Route', () => {
  let randomIndex = Math.round(Math.random());
  let choseAnimal = randomIndex === 0 ? 'kambing' : 'sapi';
  let chosePriceAnimal = choseAnimal === 'kambing' ? 1000000 : 20000000;
  let choseStatusAnimal = randomIndex === 0 ? 'available' : 'sold';
  let newAnimal;
  beforeEach(async () => {
    newAnimal = {
      type: choseAnimal,
      price: chosePriceAnimal,
      status: choseStatusAnimal,
    };
  });

  describe.skip('Authorization', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertAnimals([animalTwo]);
      const validAccessToken = await tokenService.generateAuthTokens(userOne);
      userOneAccessToken = validAccessToken.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .post('/api/animals')
        .send(newAnimal)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .get(`/api/animals/${animalOne.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .patch(`/api/animals/${animalOne.id}`)
        .send(newAnimal)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .delete(`/api/animals/${animalOne.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).post('/api/animals').send(newAnimal).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      const pagination = {
        priceExpensive: 1000000000,
        priceCheap: 10,
        status: animalOne.status,
        type: animalOne.type,
        page: 1,
        size: 2,
      };
      await request(app).get('/api/animals').query(pagination).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).get(`/api/animals/${animalOne.id}`).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).patch(`/api/animals/${animalOne.id}`).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).delete(`/api/animals/${animalOne.id}`).expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/animals', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertAnimals([animalTwo]);
      const validAccessTokenUser = await tokenService.generateAuthTokens(userOne);
      const validAccessTokenAdmin = await tokenService.generateAuthTokens(admin);
      userOneAccessToken = validAccessTokenUser.access.token;
      adminAccessToken = validAccessTokenAdmin.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
    });

    test('should return 201 OK if successfully created Animal', async () => {
      const res = await request(app)
        .post('/api/animals')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newAnimal)
        .expect(httpStatus.CREATED);

      const animalData = res.body.data;

      expect(animalData).toEqual({
        id: expect.anything(),
        type: newAnimal.type,
        price: newAnimal.price,
        status: newAnimal.status,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      const dbAnimal = await prisma.animals.findUnique({
        where: { id: animalData.id },
      });

      expect(dbAnimal).toBeDefined();
      expect(dbAnimal).toMatchObject({
        id: expect.anything(),
        type: newAnimal.type,
        price: newAnimal.price,
        status: newAnimal.status,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 400 Bad Request if type animal is not kambing or kambing', async () => {
      let randomIndex = Math.round(Math.random());
      let choseAnimal = randomIndex === 0 ? 'gajah' : 'jerapah';
      const newAnimalTwo = { ...newAnimal, type: choseAnimal };
      await request(app)
        .post('/api/animals/')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newAnimalTwo)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if status animal is not avialable or sold', async () => {
      let randomIndex = Math.round(Math.random());
      let choseAnimal = randomIndex === 0 ? 'ON' : 'OFF';
      const newAnimalTwo = { ...newAnimal, status: choseAnimal };
      await request(app)
        .post('/api/animals/')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newAnimalTwo)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if data is not input', async () => {
      await request(app)
        .post('/api/animals')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/animals/select-animals', () => {
    let selectAnimal;
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      selectAnimal = {
        user_id: userOne.id,
        animal_id: animalOne.id,
        customerName: userOne.name,
        customerEmail: userOne.email,
      };
      const validAccessTokenUser = await tokenService.generateAuthTokens(userOne);
      userOneAccessToken = validAccessTokenUser.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
    });

    test('should return 201 OK if successfully Created Select-animal', async () => {
      const res = await request(app)
        .post('/api/animals/select-animals')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(selectAnimal)
        .expect(httpStatus.CREATED);

      const selectAnimalData = res.body.data;

      expect(selectAnimalData).toEqual({
        id: expect.anything(),
        user_id: selectAnimal.user_id,
        animal_id: selectAnimal.animal_id,
        paidOff: expect.anything(),
        payment_amount: expect.anything(),
        customerName: selectAnimal.customerName,
        customerEmail: selectAnimal.customerEmail,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
        Animal: {
          id: expect.anything(),
          type: expect.anything(),
          price: expect.anything(),
          status: expect.anything(),
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        },
      });

      const dbSelectAnimal = await prisma.notes.findUnique({
        where: { id: selectAnimalData.id },
        include: {
          Animal: true,
        },
      });

      expect(dbSelectAnimal).toBeDefined();
      expect(dbSelectAnimal).toMatchObject({
        id: expect.anything(),
        user_id: selectAnimal.user_id,
        animal_id: selectAnimal.animal_id,
        paidOff: expect.anything(),
        payment_amount: expect.anything(),
        customerName: selectAnimal.customerName,
        customerEmail: selectAnimal.customerEmail,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
        Animal: {
          id: expect.anything(),
          type: expect.anything(),
          price: expect.anything(),
          status: expect.anything(),
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        },
      });
    });

    test('should return 400 Bad Request if format Email invalid', async () => {
      selectAnimal.customerEmail = 'brongz@yahoo';
      await request(app)
        .post('/api/animals/select-animals')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(selectAnimal)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if data is not input', async () => {
      await request(app)
        .post('/api/animals/select-animals')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/animals/:animalId', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertAnimals([animalTwo]);
      const validAccessTokenAdmin = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessTokenAdmin.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
    });

    test('should return 200 OK if GET Animal By Id is successfully', async () => {
      const res = await request(app)
        .get(`/api/animals/${animalOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      const animalData = res.body.data;

      expect(animalData).toEqual({
        id: expect.anything(),
        type: animalOne.type,
        price: animalOne.price,
        status: animalOne.status,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 404 if Id Animal is Not Found', async () => {
      await request(app)
        .get(`/api/animals/${animalTwo.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);
    });
  });

  describe('GET /api/animals', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertAnimals([animalTwo]);
      const validAccessTokenUser = await tokenService.generateAuthTokens(userOne);
      userOneAccessToken = validAccessTokenUser.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
    });

    test('should return 200 OK if GET Animals data is successfully', async () => {
      const pagination = {
        priceExpensive: 1000000000,
        priceCheap: 10,
        status: animalOne.status,
        type: animalOne.type,
        page: 1,
        size: 2,
      };
      const res = await request(app)
        .get('/api/animals')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .query(pagination)
        .expect(httpStatus.OK);

      const animalData = res.body.data;
      const animalCurrentPage = res.body.currentPage;
      const animalTotalData = res.body.totalData;
      const animalTotalPage = res.body.totalPage;

      expect(animalData).toEqual([
        {
          id: expect.anything(),
          type: animalOne.type,
          price: animalOne.price,
          status: animalOne.status,
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        },
        {
          id: expect.anything(),
          type: animalOne.type,
          price: animalOne.price,
          status: animalOne.status,
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        },
      ]);

      expect(animalCurrentPage).toEqual(expect.any(Number));
      expect(animalTotalData).toEqual(expect.any(Number));
      expect(animalTotalPage).toEqual(expect.any(Number));

      const dbAnimal = await prisma.animals.findUnique({
        where: { id: animalData[0].id },
      });

      expect(dbAnimal).toBeDefined();
      expect(dbAnimal).toMatchObject({
        id: expect.anything(),
        type: animalOne.type,
        price: animalOne.price,
        status: animalOne.status,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 400 Bad Request if query pagination is null', async () => {
      const pagination = { priceExpensive: null, priceCheap: null, status: null, type: null, page: null, size: null };
      await request(app)
        .get('/api/animals')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .query(pagination)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if query pagination is null', async () => {
      const pagination = { priceExpensive: null, priceCheap: null, status: null, type: null, page: 1, size: 1 };
      await request(app)
        .get('/api/animals')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .query(pagination)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if query pagination is null', async () => {
      const pagination = {
        priceExpensive: 1000000000,
        priceCheap: 10,
        status: animalOne.status,
        type: animalOne.type,
        page: null,
        size: null,
      };
      await request(app)
        .get('/api/animals')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .query(pagination)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if page is grather than total page or size is greater than total data', async () => {
      const pagination = {
        priceExpensive: 1000000000,
        priceCheap: 10,
        status: animalOne.status,
        type: animalOne.type,
        page: 1,
        size: 100,
      };
      await request(app)
        .get('/api/animals')
        .query(pagination)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('PATCH /api/animals/:animalId', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      const validAccessTokenAdmin = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessTokenAdmin.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
    });

    test('should return OK if Update data Animal is successfully', async () => {
      const res = await request(app)
        .patch(`/api/animals/${animalOne.id}`)
        .send(newAnimal)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      const animalData = res.body.data;

      expect(animalData).toEqual({
        id: expect.anything(),
        type: newAnimal.type,
        price: newAnimal.price,
        status: newAnimal.status,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      const dbAnimal = await prisma.animals.findUnique({
        where: { id: animalData.id },
      });

      expect(dbAnimal).toBeDefined();
      expect(dbAnimal).toMatchObject({
        id: expect.anything(),
        type: newAnimal.type,
        price: newAnimal.price,
        status: newAnimal.status,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 404 if Id Animal is Not Found', async () => {
      await request(app)
        .patch(`/api/animals/${animalTwo.id}`)
        .send(newAnimal)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 400 Bad Request if type animal is not kambing or sapi', async () => {
      let randomIndex = Math.round(Math.random());
      let choseAnimal = randomIndex === 0 ? 'gajah' : 'jerapah';
      const newAnimalTwo = { ...newAnimal, type: choseAnimal };
      await request(app)
        .patch(`/api/animals/${animalOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newAnimalTwo)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if status animal is not available or sold', async () => {
      let randomIndex = Math.round(Math.random());
      let choseAnimal = randomIndex === 0 ? 'on' : 'off';
      const newAnimalTwo = { ...newAnimal, status: choseAnimal };
      await request(app)
        .patch(`/api/animals/${animalOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newAnimalTwo)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if data Update is null', async () => {
      await request(app)
        .patch(`/api/animals/${animalOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({})
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /api/animals/:animalId', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      const validAccessTokenAdmin = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessTokenAdmin.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
    });

    test('should return 200 OK if Delete data animal By Id is successfully', async () => {
      const res = await request(app)
        .delete(`/api/animals/${animalOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      const animalData = res.body.data;

      expect(animalData).toEqual({
        id: expect.anything(),
        type: animalOne.type,
        price: animalOne.price,
        status: animalOne.status,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      const dbAnimal = await prisma.animals.findUnique({
        where: { id: animalData.id },
      });

      expect(dbAnimal).toBeNull();
    });

    test('should return 404 if Id Animal is Not Found', async () => {
      await request(app)
        .delete(`/api/animals/${animalTwo.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
