import React from "react";
//add draw
const exports = {};

// Player views must be extended.
// It does not have its own Wrapper view.

exports.GetPriceGuess = class extends React.Component {
  render() {
    const { parent, playable, hand } = this.props;
    console.log(parent, playable, hand);
    return (
      <div>
        {hand ? "It was a draw! Pick again." : ""}
        <br />
        {!playable ? "Please wait..." : ""}
        <br />
        <button disabled={!playable} onClick={() => parent.guessPrice()}>
          Guess
        </button>
      </div>
    );
  }
};

exports.WaitingForResults = class extends React.Component {
  render() {
    return (
      <div>
        Waiting for results... <br />
        You guessed {this.props.guessOutcome}
      </div>
    );
  }
};

exports.Done = class extends React.Component {
  render() {
    const { outcome } = this.props;
    return (
      <div>
        Thank you for playing. The outcome of this game was:
        <br />
        {outcome || "Unknown"}
      </div>
    );
  }
};

exports.Timeout = class extends React.Component {
  render() {
    return <div>There's been a timeout. (Someone took too long.)</div>;
  }
};

export default exports;
