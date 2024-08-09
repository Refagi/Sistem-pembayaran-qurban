const express = require('express');
const routes = require('./routes/api');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const httpStatus = require('http-status');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const compression = require('compression');
const cors = require('cors');
const { jwtStrategy } = require('./config/passport');
const passport = require('passport');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const methodOverride = require('method-override');

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
// app.use(helmet());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // Hanya sumber dari domain yang sama
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', "'unsafe-inline'"], // Tambah izin CDN untuk skrip
        styleSrc: ["'self'", 'https://cdn.jsdelivr.net', "'unsafe-inline'"], // Tambah izin CDN untuk style dan gaya inline
      },
    },
  }),
);

// Serve static files such as CSS, JavaScript, and images from the "public" directory
app.use('/bootstrap', express.static(path.join(__dirname, 'bootstrap')));

app.set('view engine', 'ejs'); // Mengatur EJS sebagai template engine
app.set('views', path.join(__dirname, 'views')); // Mengatur direktori views

// aktifin parsing json
app.use(express.json());

// aktifin urlencoded
app.use(express.urlencoded({ extended: true }));

//set method di form html
app.use(methodOverride('_method'));

// sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

// enable cors
app.options('*', cors());

app.use(cookieParser());
// Konfigurasi express-session
app.use(
  session({
    secret: 'brongz', // Kunci rahasia untuk menandatangani ID sesi
    resave: false, // Jangan simpan sesi jika tidak ada perubahan
    saveUninitialized: false, // simpan sesi yang sudah diinisialisasi
    cookie: { secure: config.env === 'production', httpOnly: true }, // Setel 'secure' jika menggunakan HTTPS
    maxAge: 1000 * 60 * 60 * 24 * 7,
  }),
);

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

//middlewere untuk message succes
app.use((req, res, next) => {
  //message dari locals di simpan di session untuk di tampilkan di view
  res.locals.message = req.session.message || {};
  //setelah itu di hapus dari session
  delete req.session.message;
  next();
});

// Serve static files
// app.use(express.static('src/views'));

//route awal
app.use('/', routes);

// api routes method
app.use('/api', routes);

// send 404 error jika route tidak ada
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error jadi Instance API Error jika ada error yang tidak ketangkap
app.use(errorConverter);

// handle error
app.use(errorHandler);

//abaikan favicon
app.get('/favicon.ico', (req, res) => res.status(204));

module.exports = app;
