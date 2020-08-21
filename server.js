require('dotenv').config();
const  createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const log = require('./utils/Colors');
const app = express();
const bodyParser = require('body-parser');

//routers
const indexRouter = require('./routes/index');
const recordsRouter = require('./routes/records');
const usersRouter = require('./routes/users');
const db = require('./utils/Database');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// middleware
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));
app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use(logger('dev'));
app.use(cookieParser());

app.use('/api', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/records', recordsRouter);
app.use('/api/public', express.static(path.join(__dirname, './public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(process.env.PORT, () =>{

  log.light('The magic happens on port ' + process.env.PORT + '. ' + new Date().toString());
});
