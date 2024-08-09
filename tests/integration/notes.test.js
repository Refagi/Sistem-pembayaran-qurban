const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const { userOne, admin, insertUsers, userTwo } = require('../fixtures/user.fixture');
const { animalOne, animalTwo, insertAnimals } = require('../fixtures/animal.fixture');
const { notesOne, notesTwo, insertNotes } = require('../fixtures/notes.fixture');
let { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const prisma = require('../../prisma');
const { tokenService } = require('../../src/services');

describe.skip('Notes Route', () => {
  let newNotes;
  beforeEach(async () => {
    await insertUsers([userOne]);
    await insertAnimals([animalOne]);
    newNotes = {
      user_id: userOne.id,
      animal_id: animalOne.id,
      payment_amount: 2000000,
      paidOff: false,
      customerName: userOne.name,
      customerEmail: userOne.email,
    };
  });

  describe('Authorization', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertNotes([notesOne]);
      await insertNotes([notesTwo]);
      const validAccessToken = await tokenService.generateAuthTokens(userOne);
      userOneAccessToken = validAccessToken.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .post('/api/notes')
        .send(newNotes)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .get('/api/payments/')
        .query({
          paymentAmountExpensive: notesOne.payment_amount,
          paymentAmountCheap: notesOne.payment_amount,
          page: 1,
          size: 2,
        })
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .patch(`/api/notes/${notesOne.id}`)
        .send(newNotes)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if role is not admin', async () => {
      await request(app)
        .delete(`/api/notes/${notesOne.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).post('/api/notes').send(newNotes).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      const pagination = {
        paymentAmountExpensive: notesOne.payment_amount,
        paymentAmountCheap: notesOne.payment_amount,
        page: 1,
        size: 1,
      };
      await request(app).get('/api/notes').query(pagination).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).get(`/api/notes/${notesOne.id}`).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).patch(`/api/notes/${notesOne.id}`).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 unauthorized error if not access token', async () => {
      await request(app).delete(`/api/notes/${notesOne.id}`).expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/notes', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertNotes([notesOne]);
      await insertNotes([notesTwo]);
      const validAccessTokenUser = await tokenService.generateAuthTokens(userOne);
      const validAccessTokenAdmin = await tokenService.generateAuthTokens(admin);
      userOneAccessToken = validAccessTokenUser.access.token;
      adminAccessToken = validAccessTokenAdmin.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
    });

    test('should return 201 OK if successfully created Notes', async () => {
      const newNotesTwo = {
        user_id: userOne.id,
        animal_id: animalOne.id,
        payment_amount: 2000000,
        customerName: userOne.name,
        customerEmail: userOne.email,
      };
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newNotesTwo)
        .expect(httpStatus.CREATED);

      const notesData = res.body.data;

      expect(notesData).toEqual({
        id: expect.anything(),
        user_id: newNotesTwo.user_id,
        animal_id: newNotesTwo.animal_id,
        payment_amount: newNotesTwo.payment_amount,
        paidOff: expect.anything(),
        customerName: newNotesTwo.customerName,
        customerEmail: newNotesTwo.customerEmail,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      const dbNotes = await prisma.notes.findUnique({
        where: { id: notesData.id },
      });

      expect(dbNotes).toBeDefined();
      expect(dbNotes).toMatchObject({
        id: expect.anything(),
        user_id: newNotesTwo.user_id,
        animal_id: newNotesTwo.animal_id,
        payment_amount: newNotesTwo.payment_amount,
        paidOff: expect.anything(),
        customerName: newNotesTwo.customerName,
        customerEmail: newNotesTwo.customerEmail,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 400 Bad Request if format customerEmail is invalid', async () => {
      newNotes.customerEmail = 'brongz@yahoo';
      await request(app)
        .post('/api/notes/')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newNotes)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if data is not input', async () => {
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/notes/:notesId', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertNotes([notesOne]);
      await insertNotes([notesTwo]);
      const validAccessTokenUser = await tokenService.generateAuthTokens(userOne);
      userOneAccessToken = validAccessTokenUser.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
    });

    test('should return 200 OK if GET Notes By Id is successfully', async () => {
      const res = await request(app)
        .get(`/api/notes/${notesOne.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      const notesData = res.body.data;

      expect(notesData).toEqual({
        id: expect.anything(),
        user_id: notesOne.user_id,
        animal_id: notesOne.animal_id,
        payment_amount: notesOne.payment_amount,
        paidOff: expect.anything(),
        customerName: notesOne.customerName,
        customerEmail: notesOne.customerEmail,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 404 if Id Notes is Not Found', async () => {
      await request(app)
        .get(`/api/notes/${notesTwo.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('GET /api/notes', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertNotes([notesOne]);
      await insertNotes([notesTwo]);
      const validAccessTokenAdmin = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessTokenAdmin.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
    });

    test('should return 200 OK if GET Notes data is successfully', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({
          paymentAmountExpensive: notesOne.payment_amount,
          paymentAmountCheap: notesOne.payment_amount,
          page: 1,
          size: 1,
        })
        .expect(httpStatus.OK);

      const notesData = res.body.data[0];
      const notesCurrentPage = res.body.currentPage;
      const notesTotalData = res.body.totalData;
      const notesTotalPage = res.body.totalPage;

      expect(notesData).toEqual({
        id: expect.anything(),
        user_id: notesOne.user_id,
        animal_id: notesOne.animal_id,
        payment_amount: notesOne.payment_amount,
        paidOff: expect.anything(),
        customerName: notesOne.customerName,
        customerEmail: notesOne.customerEmail,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      expect(notesCurrentPage).toEqual(expect.any(Number));
      expect(notesTotalData).toEqual(expect.any(Number));
      expect(notesTotalPage).toEqual(expect.any(Number));

      const dbNotes = await prisma.notes.findUnique({
        where: { id: notesData.id },
      });

      expect(dbNotes).toBeDefined();
      expect(dbNotes).toMatchObject({
        id: expect.anything(),
        user_id: notesOne.user_id,
        animal_id: notesOne.animal_id,
        payment_amount: notesOne.payment_amount,
        paidOff: expect.anything(),
        customerName: notesOne.customerName,
        customerEmail: notesOne.customerEmail,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 400 Bad Request if query pagination is null', async () => {
      const pagination = {
        paymentAmountExpensive: undefined,
        paymentAmountCheap: undefined,
        page: undefined,
        size: undefined,
      };
      await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query(pagination)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if query pagination is null', async () => {
      const pagination = { paymentAmountExpensive: undefined, paymentAmountCheap: undefined, page: 1, size: 1 };
      await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query(pagination)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if query pagination is null', async () => {
      const pagination = {
        paymentAmountExpensive: 1000000000,
        paymentAmountCheap: 100000,
        page: undefined,
        size: undefined,
      };
      await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query(pagination)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if page is grather than total page or size is greater than total data', async () => {
      const pagination = {
        paymentAmountExpensive: 1000000000,
        paymentAmountCheap: 100000,
        page: 1,
        size: 100,
      };
      await request(app)
        .get('/api/notes')
        .query(pagination)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('PATCH /api/notes/:notesId', () => {
    let newNotesTwo;
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertNotes([notesOne]);
      await insertNotes([notesTwo]);
      newNotesTwo = {
        user_id: userOne.id,
        animal_id: animalOne.id,
        payment_amount: 2000000,
        customerName: userOne.name,
        customerEmail: userOne.email,
      };
      const validAccessTokenAdmin = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessTokenAdmin.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
    });

    test('should return OK if Update data Notes is successfully', async () => {
      const res = await request(app)
        .patch(`/api/notes/${notesOne.id}`)
        .send(newNotesTwo)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      const notesData = res.body.data;

      expect(notesData).toEqual({
        id: expect.anything(),
        user_id: newNotesTwo.user_id,
        animal_id: newNotesTwo.animal_id,
        payment_amount: newNotesTwo.payment_amount,
        paidOff: expect.anything(),
        customerName: newNotesTwo.customerName,
        customerEmail: newNotesTwo.customerEmail,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      const dbNotes = await prisma.notes.findUnique({
        where: { id: notesData.id },
      });

      expect(dbNotes).toBeDefined();
      expect(dbNotes).toMatchObject({
        id: expect.anything(),
        user_id: newNotesTwo.user_id,
        animal_id: newNotesTwo.animal_id,
        payment_amount: newNotesTwo.payment_amount,
        paidOff: expect.anything(),
        customerName: newNotesTwo.customerName,
        customerEmail: newNotesTwo.customerEmail,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });

    test('should return 400 Bad Request if format customerEmail is invalid', async () => {
      newNotesTwo.customerEmail = 'brongz@yahoo';
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newNotesTwo)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 if Id Notes is Not Found', async () => {
      await request(app)
        .patch(`/api/notes/${notesTwo.id}`)
        .send(newNotesTwo)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 400 Bad Request if data Update is null', async () => {
      await request(app)
        .patch(`/api/notes/${notesOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({})
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /api/notes/:notesId', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
      await insertUsers([userOne, admin]);
      await insertAnimals([animalOne]);
      await insertNotes([notesOne]);
      await insertNotes([notesTwo]);
      const validAccessTokenAdmin = await tokenService.generateAuthTokens(admin);
      adminAccessToken = validAccessTokenAdmin.access.token;
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.token.deleteMany();
      await prisma.animals.deleteMany();
      await prisma.notes.deleteMany();
    });

    test('should return 200 OK if Delete data Notes By Id is successfully', async () => {
      const res = await request(app)
        .delete(`/api/notes/${notesOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      const notesData = res.body.data;

      expect(notesData).toEqual({
        id: expect.anything(),
        user_id: notesOne.user_id,
        animal_id: notesOne.animal_id,
        payment_amount: notesOne.payment_amount,
        paidOff: expect.anything(),
        customerName: notesOne.customerName,
        customerEmail: notesOne.customerEmail,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });

      const dbNotes = await prisma.notes.findUnique({
        where: { id: notesData.id },
      });

      expect(dbNotes).toBeNull();
    });

    test('should return 404 if Id Notes is Not Found', async () => {
      await request(app)
        .delete(`/api/notes/${notesTwo.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
