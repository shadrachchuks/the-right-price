import React from "react";
import AppViews from "./views/AppViews";
import DeployerViews from "./views/DeployerViews";
import AttacherViews from "./views/AttacherViews";
import { renderDOM, renderView } from "./views/render";
import "./index.css";
import * as backend from "./build/index.main.mjs";
import { loadStdlib } from "@reach-sh/stdlib";
const reach = loadStdlib(process.env);

const GUESSEDPRICE = ["High", "Medium", "Low"];
const RESULT = ["ALICE_WIN", "DRAW", "BOB_WINS"];
const { standardUnit } = reach;
const defaults = { defaultFundAmt: "10", defaultWager: "3", standardUnit };

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { view: "ConnectAccount", ...defaults };
  }
  async componentDidMount() {
    const startingBalance = reach.parseCurrency(100);
    const acc = await reach.newTestAccount(startingBalance);
    const balAtomic = await reach.balanceOf(acc);
    const bal = reach.formatCurrency(balAtomic, 4);
    this.setState({ acc, bal });
    if (await reach.canFundFromFaucet()) {
      this.setState({ view: "FundAccount" });
    } else {
      this.setState({ view: "DeployerOrAttacher" });
    }
  }
  async fundAccount(fundAmount) {
    await reach.fundFromFaucet(this.state.acc, reach.parseCurrency(fundAmount)); //we transfer funds from the faucet to the user's account.
    this.setState({ view: "DeployerOrAttacher" }); //we set the component state to display Choose Role.
  }
  async skipFundAccount() {
    this.setState({ view: "DeployerOrAttacher" });
  } //we define what to do when the user clicks the Skip button,//which is to set the component state to display Choose Role
  selectAttacher() {
    this.setState({ view: "Wrapper", ContentView: Attacher });
  } // we set a sub-component based on whether the user clicks Deployer or Attacher.
  selectDeployer() {
    this.setState({ view: "Wrapper", ContentView: Deployer });
  }
  render() {
    return renderView(this, AppViews);
  } //we render the appropriate view from rps-9-web/views/AppViews.js.3
}

class Deal extends React.Component {
  random() {
    return reach.hasRandom.random();
  } //we provide the random callback
  async guessedPrice() {
    // Fun([], UInt)we provide the guessedPrice function callback.
    const priceGuess = await new Promise((resolvepriceGuessP) => {
      //we set the component state to display Get priceGuess dialog, and wait for a Promise which can be resolved via user interaction.
      this.setState({
        view: "GetPriceGuess",
        playable: true,
        resolvepriceGuessP,
      });
    });
    this.setState({
      view: "WaitingForResults",
      priceGuess,
      guessOutcome: GUESSEDPRICE[priceGuess],
    }); //which occurs after the Promise is resolved, we set the component state to display Waiting for results display.379
    return priceGuess;
  }
  seeResult(i) {
    this.setState({ view: "Done", outcome: RESULT[i] });
  } //we provide the seeOutcome and informTimeout callbacks, which set the component state to display Done display and Timeout display, respectively.3
  informTimeout() {
    this.setState({ view: "Timeout" });
  }
  guessPrice() {
    const priceGuess = Math.floor(Math.random() * 3);
    this.state.resolvepriceGuessP(priceGuess);
  } //On line 53, we define what happens when the user guesses a number The Promise from line 45 is resolved
  informDraw() {
    this.setState({ view: "Draw" });
  }
}

class Deployer extends Deal {
  constructor(props) {
    super(props);
    this.state = { view: "SetWager" }; //we set the component state to display Set Wager dialog.
  }
  setWager(wager) {
    this.setState({ view: "Deploy", wager });
  } //On line 61, we define what to do when the user clicks the Set Wager button, which is to set the component state to display Deploy dialog.
  async deploy() {
    //On lines 62 thru 69, we define what to do when the user clicks the Deploy button.
    const ctc = this.props.acc.contract(backend); //On line 63, we call acc.deploy, which triggers a deploy of the contract.
    this.setState({ view: "Deploying", ctc }); //On line 64, we set the component state to display Deploying display.
    this.wager = reach.parseCurrency(this.state.wager); // UInt  we set the wager property
    this.deadline = { ETH: 10, ALGO: 100, CFX: 1000 }[reach.connector]; // UInt we set the deadline property based on which connector is being used.
    backend.Alice(ctc, this); //we start running the Reach program as Alice, using the this React component as the participant interact interface object.
    const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null, 2); //On lines 68 and 69, we set the component state to display Waiting for Attacher display,
    this.setState({ view: "WaitingForAttacher", ctcInfoStr }); //which displays the deployed contract info as JSON.
  }
  render() {
    return renderView(this, DeployerViews);
  } //we render the appropriate view from rps-9-web/views/DeployerViews.js.
}

class Attacher extends Deal {
  constructor(props) {
    super(props);
    this.state = { view: "Attach" }; //we initialize the component state to display Attach dialog.
  }
  attach(ctcInfoStr) {
    //we define what happens when the user clicks the Attach button.
    const ctc = this.props.acc.contract(backend, JSON.parse(ctcInfoStr)); //we call acc.attach
    this.setState({ view: "Attaching" }); //we set the component state to display Attaching display.408
    backend.Bob(ctc, this); //we start running the Reach program as Bob, using the this React component as the participant interact interface object.
  }
  async acceptWager(wagerAtomic) {
    // Fun([UInt], Null)we define the acceptWager callback
    const wager = reach.formatCurrency(wagerAtomic, 4);
    return await new Promise((resolveAcceptedP) => {
      //we set the component state to display Accept Terms dialog,
      this.setState({ view: "AcceptTerms", wager, resolveAcceptedP }); //and wait for a Promise which can be resolved via user interaction.
    });
  }
  termsAccepted() {
    //we define what happens when the user clicks the Accept Terms and Pay Wager button: the Promise from line 90 is resolved,
    this.state.resolveAcceptedP();
    this.setState({ view: "WaitingForTurn" });
  } //and we set the component state to display Waiting for Turn display.
  render() {
    return renderView(this, AttacherViews);
  } //On line 93, we render the appropriate view from rps-9-web/views/AttacherViews.js
}
renderDOM(<App />);
/*
import React from 'react'
import {loadStdlib} from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib(process.env);

const startingBalance = stdlib.parseCurrency(100);

const [ accAlice, accBob ] = await stdlib.newTestAccounts(2, startingBalance);
console.log('Hello, Alice and Bob!');

//formatting the currency to a 4 decemal place...........
const fmt = (x) => stdlib.formatCurrency(x, 4);

const getBalance = async (who) => fmt(await stdlib.balanceOf(who));

//Getting the balace before the game starts for alice and bob
const AliceBeforeBalance = await getBalance(accAlice);
const BobBeforeBalance = await getBalance(accBob);


console.log('Launching...');
const ctcAlice = accAlice.contract(backend);
const ctcBob = accBob.contract(backend, ctcAlice.getInfo());

const GUESSEDPRICE = ['High', 'Medium', 'Low'];
const RESULT = ['Alice wins', 'Draw', 'Bob wins'];



const Deal = (Who) => ({
  ...stdlib.hasRandom,
    guessedPrice: () => {
      const guessedPrice =  Math.floor(Math.random() * 3);
      console.log(`${Who} guessed ${GUESSEDPRICE[guessedPrice]}`)
      return guessedPrice;
    },
    seeResult: (result) => {
    console.log(`${Who} saw the ${RESULT[result]}`)
}

});

console.log('Starting backends...');

await Promise.all([
  backend.Alice(ctcAlice, {
    ...stdlib.hasRandom,
    // implement Alice's interact object here
    ...Deal('Alice'),
     wager: stdlib.parseCurrency(5),
  }),
  backend.Bob(ctcBob, {
    ...stdlib.hasRandom,
    // implement Bob's interact object here
    ...Deal('Bob'),
    acceptWager:  (amt) => {
      console.log(`Bob accepts the ${fmt(amt)}`)
    }
  }),
]);

//getting the balance of bob and alice after wager has been placed.
const afteAclice = await getBalance(accAlice);
const afterBob = await getBalance(accBob);

//remitting funds after the winner has been decalred

console.log(`Alice moved from ${AliceBeforeBalance} to ${afteAclice}`)
console.log(`Bob moved from ${BobBeforeBalance} to ${afterBob}`)



console.log('Goodbye, Alice and Bob!');
*/
