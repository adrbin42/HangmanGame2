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

req.checkBody("ltr_guess", "Enter a letter silly!").notEmpty();
req.checkBody("ltr_guess", "I said enter a letter not a number!").isAlpha(); // check if its an alphabet
req.checkBody("ltr_guess", "You can only enter one letter at a time!").isLength({max: 1});

errors = req.validationErrors();
if (errors) {
    errors.forEach(function(error) {
    error_messages.push(error.msg);
    });
    res.render("index", {errors: error_messages,
                         guessesLeft: req.session.maxGuesses});
    }

    let letter = req.body.ltr_guess.toUpperCase(),
        alrdyGuessed,
        wrongGuess;

    if(req.session.maxGuesses <= 8 && req.session.maxGuesses > 0){
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
    }
    req.session.maxGuesses--;
    if(req.session.ltrGuesses.indexOf(letter+' ') == -1){
      req.session.ltrGuesses.push(letter + ' ');
      alrdyGuessed = false;
    }else{
      alrdyGuessed = true;
      req.session.maxGuesses++;
    }
    let tooManyGuesses;
    if(req.session.maxGuesses < 0){
      tooManyGuesses = "Duh, too many guesses, gameover dummy, you lose, hit restart!";
    }else if(req.session.maxGuesses == 0){
      tooManyGuesses = "If you finally got it, hit Final Guess button to enter the word!";
    }
    console.log("Already guessed: " + alrdyGuessed);
    console.log("Wrong guess: " + wrongGuess);
    console.log("Too many guesses: " + tooManyGuesses);
    res.render("index", {
      word:req.session.mysteryWord,
      hiddenwordOutput:req.session.hiddenword,
      guessesLeft:req.session.maxGuesses,
      lettersGuessed:req.session.ltrGuesses,
      alrdyGuessedError:alrdyGuessed,
      wrong:wrongGuess,
      toomanyguesses:tooManyGuesses});
});

app.post('/finalGuess',function(req,res){
  console.log(req.body.finalGuess);
  let finalGuess = req.body.finalGuess.toUpperCase(),
      winner,
      winningWord;
  if(finalGuess === req.session.mysteryWord){
    winner = true;
    for(let i = 0;i<finalGuess.length;i++){
      req.session.hiddenword[i] = finalGuess[i];
    }
  }else {
    winner = false;
  }
    winningWord = req.session.hiddenword.join('');
    console.log("This is my final guess : " + finalGuess);
    console.log("This is my mysteryWord: "+req.session.mysteryWord);
    console.log("Win or lose: "+winner);
  res.render("winlose",{chkIfWin:winner});
});

app.post('/restartApp',function(req,res){
  req.session.destroy();
  res.redirect("/");
});

app.listen(3000, function() {
  console.log("Working hard... Listening on 3000");
});
