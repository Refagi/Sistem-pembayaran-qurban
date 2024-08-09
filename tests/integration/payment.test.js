const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const { userOne, admin, insertUsers, userTwo } = require('../fixtures/user.fixture');
const { animalOne, animalTwo, insertAnimals } = require('../fixtures/animal.fixture');
const { notesOne, notesTwo, insertNotes } = require('../fixtures/notes.fixture');
const { paymentOne, paymentTwo, insertPayments } = require('../fixtures/payment.fixture');
let { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const prisma = require('../../prisma');
const { tokenService } = require('../../src/services');

describe('Notes Route', () => {
  let newPayment;
  beforeEach(async () => {
    await insertUsers([userOne]);
    await insertAnimals([animalOne]);
    await insertNotes([notesOne]);
    await insertPayments([paymentOne]);
    newPayment = {
      animal_id: animalOne.id,
      notes_id: notesOne.id,
      amount: 2000000,
      status_animal: animalOne.status,
    };
  });

  describe('Authorization', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await prisma.payment.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertNotes([notesOne]);
      await insertPayments([paymentOne]);
      await insertPayments([paymentTwo]);
      const validAccessToken = await tokenService.generateAuthTokens(userOne);
      userOneAccessToken = validAccessToken.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await prisma.payment.deleteMany();
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .get(`/api/payments/${paymentOne.id}`)
        .send(newPayment)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .get(`/api/payments/${paymentOne.id}`)
        .query({ amountExpensive: 2000000, amountCheap: 1000, page: 1, size: 2 })
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .patch(`/api/payments/${paymentOne.id}`)
        .send(newPayment)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .delete(`/api/payments/${paymentOne.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).post('/api/payments').send(newPayment).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      const pagination = { amountExpensive: 2000000, amountCheap: 1000, page: 1, size: 2 };
      await request(app).get('/api/payments').query(pagination).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).get(`/api/payments/${paymentOne.id}`).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).patch(`/api/payments/${paymentOne.id}`).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).delete(`/api/payments/${paymentOne.id}`).expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/payments', () => {
    beforeEach(async () => {
      await prisma.payment.deleteMany();
      await prisma.notes.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertPayments([paymentOne]);
      await insertNotes([notesOne]);
      const validAccessTokenUser = await tokenService.generateAuthTokens(userOne);
      userOneAccessToken = validAccessTokenUser.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await prisma.payment.deleteMany();
    });

    test('should return 201 OK if successfully created Payment', async () => {
      const res = await request(app)
        .post('/api/payments/')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newPayment)
        .expect(httpStatus.CREATED);

      const paymentData = res.body.data;

      expect(paymentData).toEqual({
        id: expect.anything(),
        animal_id: newPayment.animal_id,
        notes_id: newPayment.notes_id,
        amount: newPayment.amount,
        status_animal: newPayment.status_animal,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      const dbPayment = await prisma.payment.findUnique({
        where: { id: paymentData.id },
      });

      expect(dbPayment).toBeDefined();
      expect(dbPayment).toMatchObject({
        id: expect.anything(),
        animal_id: newPayment.animal_id,
        notes_id: newPayment.notes_id,
        amount: newPayment.amount,
        status_animal: newPayment.status_animal,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 400 Bad Request if data is not input', async () => {
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/payments/:paymentId', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await prisma.payment.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertNotes([notesOne]);
      await insertPayments([paymentOne]);
      await insertPayments([paymentTwo]);
      const validAccessTokenAdmin = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessTokenAdmin.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await prisma.payment.deleteMany();
    });

    test('should return 200 OK if GET Payment By Id is successfully', async () => {
      const res = await request(app)
        .get(`/api/payments/${paymentOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      const paymentData = res.body.data;

      expect(paymentData).toEqual({
        id: expect.anything(),
        animal_id: paymentOne.animal_id,
        notes_id: paymentOne.notes_id,
        amount: paymentOne.amount,
        status_animal: paymentOne.status_animal,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 404 if Id Payment is Not Found', async () => {
      await request(app)
        .get(`/api/payments/${paymentTwo.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('GET /api/payments', () => {
    beforeEach(async () => {
      await prisma.payment.deleteMany();
      await prisma.notes.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertPayments([paymentOne]);
      await insertNotes([notesOne]);
      const validAccessTokenAdmin = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessTokenAdmin.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await prisma.payment.deleteMany();
    });

    test('should return 200 OK if GET Payment data is successfully', async () => {
      await insertPayments([paymentOne]);
      const pagination = { amountExpensive: paymentOne.amount, amountCheap: 10, page: 1, size: 1 };
      const res = await request(app)
        .get('/api/payments/')
        .query(pagination)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      const paymentData = res.body.data;
      const paymentCurrentPage = res.body.currentPage;
      const paymentTotalData = res.body.totalData;
      const paymentTotalPage = res.body.totalPage;

      expect(paymentData).toEqual([
        {
          id: expect.anything(),
          animal_id: paymentOne.animal_id,
          notes_id: paymentOne.notes_id,
          amount: paymentOne.amount,
          status_animal: paymentOne.status_animal,
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        },
      ]);

      expect(paymentCurrentPage).toEqual(expect.any(Number));
      expect(paymentTotalData).toEqual(expect.any(Number));
      expect(paymentTotalPage).toEqual(expect.any(Number));

      const dbPayment = await prisma.payment.findUnique({
        where: { id: paymentData[0].id },
      });

      expect(dbPayment).toBeDefined();
      expect(dbPayment).toMatchObject({
        id: expect.anything(),
        animal_id: paymentOne.animal_id,
        notes_id: paymentOne.notes_id,
        amount: paymentOne.amount,
        status_animal: paymentOne.status_animal,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 400 Bad Request if query pagination is null or undefined', async () => {
      const pagination = {
        amountExpensive: undefined,
        amountCheap: undefined,
        page: undefined,
        size: undefined,
      };
      await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query(pagination)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if query pagination is null or undefined', async () => {
      const pagination = { amountExpensive: undefined, amountCheap: undefined, page: 1, size: 1 };
      await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query(pagination)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if query pagination is null undefined', async () => {
      const pagination = {
        amountExpensive: 1000000000,
        amountCheap: 10,
        page: undefined,
        size: undefined,
      };
      await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query(pagination)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if page is grather than total page or size is greater than total data', async () => {
      const pagination = {
        amountExpensive: 1000000000,
        amountCheap: 10,
        page: 1,
        size: 100,
      };
      await request(app)
        .get('/api/payments')
        .query(pagination)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('PATCH /api/payments/:paymentId', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await prisma.payment.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertPayments([paymentTwo]);
      await insertPayments([paymentOne]);
      await insertNotes([notesOne]);
      const validAccessTokenAdmin = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessTokenAdmin.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await prisma.payment.deleteMany();
    });

    test('should return OK if Update data Payment is successfully', async () => {
      await insertPayments([paymentOne]);
      let newPaymentTwo = {
        animal_id: animalOne.id,
        amount: 3000000,
        status_animal: paymentOne.status_animal,
      };

      const res = await request(app)
        .patch(`/api/payments/${paymentOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newPaymentTwo)
        .expect(httpStatus.OK);

      const paymentData = res.body.data;

      expect(paymentData).toEqual({
        id: expect.anything(),
        animal_id: newPaymentTwo.animal_id,
        notes_id: expect.anything(),
        amount: newPaymentTwo.amount,
        status_animal: newPaymentTwo.status_animal,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      const dbPayment = await prisma.payment.findUnique({
        where: { id: paymentData.id },
      });

      expect(dbPayment).toBeDefined();
      expect(dbPayment).toMatchObject({
        id: expect.anything(),
        animal_id: newPaymentTwo.animal_id,
        notes_id: expect.anything(),
        amount: newPaymentTwo.amount,
        status_animal: newPaymentTwo.status_animal,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 404 if Id Payment is Not Found', async () => {
      let newPaymentTwo = {
        animal_id: animalOne.id,
        amount: 2000000,
        status_animal: paymentOne.status_animal,
      };
      await request(app)
        .patch(`/api/payments/${paymentTwo.id}`)
        .send(newPaymentTwo)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 400 Bad Request if data Update is null', async () => {
      await request(app)
        .patch(`/api/payments/${paymentOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({})
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /api/payments/:paymentId', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await prisma.payment.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertNotes([notesOne]);
      await insertPayments([paymentOne]);
      await insertPayments([paymentTwo]);
      const validAccessTokenAdmin = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessTokenAdmin.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await prisma.payment.deleteMany();
    });

    test('should return 200 OK if Delete data Payment By Id is successfully', async () => {
      const res = await request(app)
        .delete(`/api/payments/${paymentOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      const paymentData = res.body.data;

      expect(paymentData).toEqual({
        id: expect.anything(),
        animal_id: newPayment.animal_id,
        notes_id: newPayment.notes_id,
        amount: newPayment.amount,
        status_animal: expect.anything(),
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      const dbPayment = await prisma.notes.findUnique({
        where: { id: paymentData.id },
      });

      expect(dbPayment).toBeNull();
    });

    test('should return 404 if Id Payment is Not Found', async () => {
      await request(app)
        .delete(`/api/payments/${paymentTwo.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
