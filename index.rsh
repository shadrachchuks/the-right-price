"reach 0.1";

const [isGuessedPrice, HIGH, MEDIUM, LOW] = makeEnum(3);
const [isResults, ALICE_WIN, DRAW, BOB_WINS] = makeEnum(3);

const winner = (guessAlice, guessBob) => (guessAlice + (4 - guessBob)) % 3;

assert(winner(HIGH, MEDIUM) == ALICE_WIN);
assert(winner(MEDIUM, HIGH) == BOB_WINS);
assert(winner(HIGH, HIGH) == DRAW);

//we create a loop that will ensure that the value in winner is the ultimate outcome.
forall(UInt, (guessAlice) =>
  forall(UInt, (guessBob) => assert(isResults(winner(guessAlice, guessBob))))
);

forall(UInt, (guessedPrice) =>
  assert(winner(guessedPrice, guessedPrice) == DRAW)
);

//dual functions performed by all paticipants............
const Deal = {
  ...hasRandom,
  guessedPrice: Fun([], UInt),
  seeResult: Fun([UInt], Null),
  informTimeout: Fun([], Null),
  informDraw: Fun([], Null),
};

export const main = Reach.App(() => {
  const Alice = Participant("Alice", {
    ...Deal,
    wager: UInt,
    deadline: UInt,
  });

  const Bob = Participant("Bob", {
    ...Deal,
    acceptWager: Fun([UInt], Null),
  });
  init();

  //Informing each paticipate of a timeout in progam
  const informTimeout = () => {
    each([Alice, Bob], () => {
      interact.informTimeout();
    });
  };

  //Alice publish her wager and deadline.......
  Alice.only(() => {
    const wager = declassify(interact.wager);
    const deadline = declassify(interact.deadline);
  });
  Alice.publish(wager, deadline).pay(wager);
  commit();

  //Bob makes his move in the accepting the wager...........
  Bob.only(() => {
    interact.acceptWager(wager);
  });
  Bob.pay(wager).timeout(relativeTime(deadline), () =>
    closeTo(Alice, informTimeout)
  );

  /// validating the results to know and check the condition if its a draw then return back to the game run the process again
  var result = DRAW;
  invariant(balance() == 2 * wager && isResults(result));
  while (result == DRAW) {
    commit();
    // The first one to publish deploys the contract
    Alice.only(() => {
      const _guessAlice = interact.guessedPrice();
      const [_commitAlice, _saltAlice] = makeCommitment(interact, _guessAlice);
      const commitAlice = declassify(_commitAlice);
    });
    Alice.publish(commitAlice).timeout(relativeTime(deadline), () =>
      closeTo(Bob, informTimeout)
    );
    commit();

    //Here we hiding the price picked by Alice from Bob before he publishes his guessed price
    unknowable(Bob, Alice(_guessAlice, _saltAlice));
    // The second one to publish always attaches
    Bob.only(() => {
      const guessBob = declassify(interact.guessedPrice());
    });
    Bob.publish(guessBob).timeout(relativeTime(deadline), () =>
      closeTo(Alice, informTimeout)
    );
    commit();

    //here we make Alice publish her guess so it becomes public after bob has accepted the wager and publish his guess
    Alice.only(() => {
      const saltAlice = declassify(_saltAlice);
      const guessAlice = declassify(_guessAlice);
    });

    Alice.publish(saltAlice, guessAlice).timeout(relativeTime(deadline), () =>
      closeTo(Bob, informTimeout)
    );
    checkCommitment(commitAlice, saltAlice, guessAlice);

    result = winner(guessAlice, guessBob);
    continue;
  }

  assert(result == ALICE_WIN || result == BOB_WINS);
  transfer(2 * wager).to(result == ALICE_WIN ? Alice : Bob);
  commit();

  //There each paticpate see the outcome of the steps that take.
  each([Alice, Bob], () => {
    interact.seeResult(result);
  });
  // exit();
});
