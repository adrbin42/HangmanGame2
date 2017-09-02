const express = require('express');
const app = express();
const mustacheExpress = require('mustache-express');
const session = require('express-session');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const fs = require('fs');
const parseurl = require('parseurl');
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(express.static('public'));

app.use(session({
  secret: 'winnerswin',
  resave: false,
  saveUninitialized: true
}));

app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set ('view engine', 'mustache');

app.get('/', function(req, res) {

  req.session.maxGuesses = 8;
  req.session.hiddenword = [];
  req.session.ltrGuesses = [];
  req.session.letter = '';
  req.session.mysteryWord = undefined;
  req.session.winner = '';

  if(req.session.mysteryWord == undefined){
    let index = Math.floor(Math.random()* words.length);
    let word = words[index];
    req.session.mysteryWord = word.toUpperCase();
  }

  if(req.session.maxGuesses == 8){
    for(let i = 0;i<req.session.mysteryWord.length;i++){
      req.session.hiddenword.push('_' + ' ');
    }
  }
    res.render("index", {
      word:req.session.mysteryWord,
      hiddenwordOutput:req.session.hiddenword,
      guessesLeft:req.session.maxGuesses
    });
});

app.post('/makeGuess',function(req,res) {

  let error_messages = [];
  let errors = "";

  req.checkBody("ltr_guess", "Enter a letter silly, cannot be blank!").notEmpty();
  req.checkBody("ltr_guess", "I said enter a letter not a number!").isAlpha(); // check if its an alphabet
  req.checkBody("ltr_guess", "You can only enter one letter at a time!").isLength({max: 1});

  errors = req.validationErrors();
  if (errors) {
      errors.forEach(function(error) {
      error_messages.push(error.msg);
      });
      req.session.maxGuesses++;
    }

      let letter = req.body.ltr_guess.toUpperCase(),
          alrdyGuessed,
          makeAFinalGuess,
          tooManyGuesses,
          wrongGuess;

      if(req.session.maxGuesses <= 8 && req.session.maxGuesses > 1){
          for(let i = 0;i<req.session.mysteryWord.length;i++){
            if(req.session.mysteryWord[i] == letter){
              req.session.hiddenword[i] = letter;
            }
          }
          if(req.session.mysteryWord.indexOf(letter) != -1){
          wrongGuess = false;
            }else{
          wrongGuess = true;
          }

      if(req.session.ltrGuesses.indexOf(letter+' ') == -1){
        req.session.ltrGuesses.push(letter + ' ');
        alrdyGuessed = false;
      }else{
        alrdyGuessed = true;
        req.session.maxGuesses++;
      }
      req.session.maxGuesses--;
      if(req.session.hiddenword.join('') === req.session.mysteryWord){
        req.session.winner = true;
        res.render("winlose",{chkIfWin:req.session.winner});
      }else{
        res.render("index", {
          word:req.session.mysteryWord,
          hiddenwordOutput:req.session.hiddenword,
          guessesLeft:req.session.maxGuesses,
          lettersGuessed:req.session.ltrGuesses,
          alrdyGuessedError:alrdyGuessed,
          wrong:wrongGuess,
          errors: error_messages});
      }
    } else if (req.session.maxGuesses == 1){
      req.session.maxGuesses--;
      tooManyGuesses = "If you finally got it, hit Final Guess button to enter the word!";
      res.render("index", {
        word:req.session.mysteryWord,
        hiddenwordOutput:req.session.hiddenword,
        guessesLeft:req.session.maxGuesses,
        lettersGuessed:req.session.ltrGuesses,
        alrdyGuessedError:alrdyGuessed,
        wrong:wrongGuess,
        toomanyguesses:tooManyGuesses,
        errors: error_messages});
    }else if(req.session.maxGuesses <= 0) {
      req.session.maxGuesses--;
      req.session.winner = false;
      res.render("winlose",{chkIfWin:req.session.winner});
    }
});

app.post('/finalGuess',function(req,res){
  let finalGuess = req.body.finalGuess.toUpperCase();
    if(finalGuess === req.session.mysteryWord){
      req.session.winner = true;
      for(let i = 0;i<finalGuess.length;i++){
        req.session.hiddenword[i] = finalGuess[i];
      }
      res.render("winlose",{chkIfWin:req.session.winner});
    }else if(finalGuess !== req.session.mysteryWord) {
      req.session.winner = false;
      res.render("winlose",{chkIfWin:req.session.winner});
    }
});

app.post('/restartApp',function(req,res){
  req.session.destroy();
  res.redirect("/");
});

app.listen(3000, function() {
  console.log("Working hard... Listening on 3000");
});
