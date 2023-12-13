# Blind Secret Hitler

In blind Secret Hitler, players do not know their own role to start the game. Every action besides choosing players and voting has the option to make a default decision. Liberal roles default to always telling the truth, playing B and discarding R when possible. Hitler and fascists decisions are strategically determined considering a variety of factors intended to mimic real play. An explanation of how decisions are made can be found HERE (put link).

A player may attempt to confirm themself as a fascist. If they are wrong and liberal, the game ends immediately and fascists win. Therefore, guessing is not encouraged. When a vanilla fascist confirms themself, they learn who Hitler is and any other fascists who also confirm themselves. When Hitler confirms themself, they only learn other confirmed fascists in a 5-6 player game or if the Hitler knows other facists in 7+ setting is on. Vanilla fascists are not notificied whether Hitler has confirmed themself or not.

There is no option to confirm yourself as liberal, as it would not make sense to ever risk it. If you are wrong, you lose immediately. Therefore, if you believe strongly that you are liberal enough  to want to confirm yourself, then you've already bet the game that you are liberal. You may as well just play as a liberal and if you are wrong and fascist, you still have a chance to win, or even find out your true identity later and switch sides.

There is also a setting that can be turned on called **Simple Blind** that simplifies the default decision making. It's explained here (insert link).

## Thoughts on Game Balance and META

It's not clear if this variant will favor the liberals or the facists. If normal strict META is followed and players default to assuming they are liberal, then liberals almost certainly have the edge, since fascists are blind and can't coordinate. Also 3v3 top deck may not always be possible.

It's clear that if everybody defaults to assuming they are liberal by mere probability, 4/7 vs 3/7, then liberals will have an overwhelming advantage and all player will have an over 50% winning percentage. This is lame and comparable to being easy to read as a fascist vs liberal, leading to wins as liberal and losses as fascist.

Therefore, players should adapt their play to give the best chance of winning any one game. As a result, the META can and should change.

### Considerations

 An important liberal responsibility is voting for the right liberal liberal governments, especially towards the end of the game. In a normal game, a liberal that hasn't been in government to play B is still instrumental in a win by determining who they think is liberal and voting properly. If that player does not know, or worse, does not believe they are liberal, their vote cannot be counted on. Therefore, there is more importance on getting more players into government to learn about their role, which also helps fascists.

**Scenario:** The first two governments play B and the players in government are limited. It's unlikely that these are the actual four liberals. Other liberal players will assume by probability that they are likely fascist and it will be difficult to coordinate among liberals.

The idea of the META is that it's optimal for liberals. Since fascists need to keep their cover, they are compelled to go along with it or out themselves. In this variant, there is no cover to keep. You can openly say you might be fascist without outing. Players that are 50-50 on their role have incentive to openly support the losing team, keeping the possibility of winning balanced for when they can learn their role.

## How Decisions are Made

Factors that are considered in decision making:
- Whether a government is fascist fascist or not
- Hitler and vanilla fascist make decision differently
- How many B's are played along with how many you have already played yourself
- How many R's are played and what the power is
- The deck count and whether it's overclaimed or underclaimed
- Whether or not a liberal has drawn RRR on the deck
- Whether it's cucu, anti-DD or double dipping

All decisions are based on a random probability, so even if for example there is only a 10% chance of blind conflicting as Hitler, it may happen.

**Note:** Meta pairings and seating position is not considered. There are no situations where a fascist will default to playing a B to get the gun or play a B to keep the most number of fascists in government.

### President Discard

Liberals always force on RBB by default. If you drop a B any time besides BBB, you are fascist.

#### Vanilla Fascist

- **RBB:** Vanilla fascists are equally likely to force vs drop and underclaim with the following factors increasing the drop probability to:
  - 90% if a liberal was RRR
  - 25% if it's fascist fascist, no power and 0B or 1B down
  - 100% if it's fascist fascist otherwise
  - 100% if 4B are played

- **RRB:** Vanilla fascists drop 100% of the time with the following factors decreasing the probability to:
  - 0% if your chancellor is also vanilla fascist, as they can drop. This will not occur in cucu since you were called liberal and believe you are liberal. You need to drop yourself to know you are not, otherwise, if you end up outing the fascist, you will not know if you are fascist.
  - 0% if the chancellor is Hitler and there's 0B or 1B down and no power.
  - 40% if the chancellor is Hitler and there's 2B or 3B down and no power.

#### Hitler

- **RBB:** Hitler drops on RBB with the following probabilities;
  - 60% if 0B or 1B down
  - 90% if 2B down
  - 100% if 3B or 4B down
  - 100% if hitler knows the chancellor is fascist through antiDD or cucu

- **RRB:** Hitler's RRB drop probobability is based on the number of B down, the number of B Hitler has played as well as if there is any power. The matrix row is the number of B down and the column is the number of B played by Hitler


`|   | 0 | 1 | 2 | 3 | 4 |`
`|---|---|---|---|---|---|`
`| 0 | .25  |   |   |   |   |`
`|---|---|---|---|---|---|`
`| 1 |  .4 | .3  |   |   |   |`
`|---|---|---|---|---|---|`
`| 2 | .9 or 1 if power | .5 or .8 if power | .7 or 1 if power |   |   |`
`|---|---|---|---|---|---|`
`| 3 | 1 | 1 | 1 | 1 |   |`
`|---|---|---|---|---|---|`
`| 4 | 1 | 1 | 1 | 1 | 1 |`

If Hitler knows the chancellor is fascist through antiDD then 0% and passes the B.
If there are at least R down, then Hitler drops 100%.

### Chancellor Play

Liberals of course always play B when given a choice.

#### Vanilla Fascist on RB

Vanilla fascists base probability of playing a red is given by the matrix where the row is the number of B down and the column is the number of B played by the fascist.


`|   | 0 | 1 | 2 | 3 | 4 |`
`|---|---|---|---|---|---|`
`| 0 | .75  |   |   |   |   |`
`|---|---|---|---|---|---|`
`| 1 |  .85 | .85  |   |   |   |`
`|---|---|---|---|---|---|`
`| 2 | .9 | .9 | .9 |   |   |`
`|---|---|---|---|---|---|`
`| 3 | .95 | .95 | .95 | .95 |   |`
`|---|---|---|---|---|---|`
`| 4 | 1 | 1 | 1 | 1 | 1 |`

The following circumstances change it:
- The president is fascist and has a power, play R 100%.
- The president is fascist with no power and 0B or 1B down, play R 15%.
- The president is liberal with 0B or 1B down and its investigation, player R 30% or 65% in a 9/10 player game
- If it's a fascist facist cucu with at least 3R or 3B down, play R 100%.
- If it's a fascist fascist cucu and not at leaset 3R or 3B, play R 50%.
- If 4B or 5R down, player R 100%.

#### Hitler on RB


Hitler base probability of playing a red is given by the matrix where the row is the number of B down and the column is the number of B played by Hitler.


`|   | 0 | 1 | 2 | 3 | 4 |`
`|---|---|---|---|---|---|`
`| 0 | .2  |   |   |   |   |`
`|---|---|---|---|---|---|`
`| 1 |  .3 | .15  |   |   |   |`
`|---|---|---|---|---|---|`
`| 2 | .7 | .4 | .3 |   |   |`
`|---|---|---|---|---|---|`
`| 3 | .85 | .75 | .5 | .25 |   |`
`|---|---|---|---|---|---|`
`| 4 | 1 | 1 | 1 | 1 | 1 |`

The following circumstances change that:
- If cucu, play B to 100% to avoid outing
- If it's a fascist facist cucu with at least 3R or 3B down, play R 100%.
- If it's a fascist fascist cucu and not at leaset 3R or 3B, play R 30% because otherwise Hitler looks terrible.
- If 4B down, player R 100%.

### Chancellor Claim

Liberal and Hitler chancellors always tell the truth. Fascists always tell the truth if the president is liberal.

#### Fascist Fascist Underclaim BB to RB
- If there is at least one overclaim, underclaim 100%
- If there is at most one underclaim and a liberal 3R president and no fascist 3R president, underclaim 90%
-Otherwise, do not underclaim

#### Fascist Fascist Overclaim RB to BB
- If there is no overclaim or underclaim and the blue count is at most 2B claimed, overclaim 75%
- If there is one underclaim and no liberal 3R president, overclaim 90%
- If there are at least two underclaims, overclaim 100%
- Otherwise, do not overclaim


## Fascist Fascist Conflicts

Default fascist fascist conflicts are rare, but possible and occur in the following circumstances:
- You've claimed RRR as president and there are at least 2 underclaims (you and someone else), then there's a 40% chance you will investigate another fasc as fasc.
- If there is a total of three underclaims, either from a double drop of RBB with an existing underclaim or a drop on RRB with two existing underclaims, then there's a 90% chance of conflicting.
- A player will conflict and out the chancellor on cucu with probability 90% if there are at least two underclaims and 40% if there's one underclaim.

Some cases are known to be fasc fasc by the president and others are not. The cucu conflict and the RRB conflict are unknown if it's fasc fasc at the time.

# Simple Blind Setting

In this setting, fascist decisions are not strategic or optimal. The emphasis is on performing the fascist action when possible.

## Fascist Actions
- Discarding B policies as president
- Playing R policies as chancellor
- Underclaiming BBB, RBB
- Conflicting chancellor
- Lying on investigation
- Lying about the top 3 policies in a 5-6 player game
- Refusing veto

## Considerations
- Players are more likely to confirm themselves fascist right away.
- There isn't the full effect of wondering if you yourself are deep undercover the same way you do with others
- Players who don't find out they are fascist through the default action will higher confidence they are liberal

## Strategy
If you believe the optimal fascist play in a given situation is to play like a liberal, then do so without taking the default action.
You can even lie and say that you chose the default action, trying to build liberal credibility. Realize you may be a liberal lying about why you are liberal, but telling the truth that you are liberal, so it's fine!

However, playing optimally in this way comes at the cost of missing the opportunity to possibly learn you role.

Keep in mind, if a fascist player shoots a liberal, a 3v3 top deck is not always possible, since not all fascists necessarily know who they are to nein.

**Example:** You are the chancellor under the gun with three B's down. You realize that the optimal fascist play is to play the fourth B and not get shot. You do so. Then, you claim you chose the default action, "confirming" you are liberal.

## Simple Decisions

COMMENT ON DIFFERENCES


# Possible variants

There could be the option for a player to investigate themself.
In a 7+ player game, one of the non-Hitler fascists can be an all knowing fascist, who learns all other fascists upon confirming themself. This would increase the chance of helping other fascists confirm themselves if they can't get into government and helping out to topdeck at the end of the game.







