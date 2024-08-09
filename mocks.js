require('dotenv').config();
global.atob = require('atob');

jest.mock('./prisma/__mocks__/index.js');
jest.setTimeout(30000);
