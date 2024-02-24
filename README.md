<!-- shift command V to preview -->

# Blind Secret Hitler

In blind Secret Hitler, players do not know their own role to start the game. Every action besides choosing players and voting has the option to make a default decision. Liberal roles default to always telling the truth, playing B and discarding R when possible. Hitler and fascists decisions are strategically determined considering a variety of factors intended to mimic real play.

A player may attempt to confirm themself as a fascist. If they are wrong and liberal, the game ends immediately and fascists win. Therefore, guessing is not encouraged. When a vanilla fascist confirms themself, they learn who Hitler is and any other fascists who have confirmed themselves. When Hitler confirms themself, normal rules apply for whether Hitler learns the other facists. Vanilla fascists are not notificied whether Hitler has confirmed themself or not.

There is no option to confirm yourself as liberal, as it would not make sense to ever risk it. If you are wrong, you lose immediately. Therefore, if you believe strongly that you are liberal enough to want to confirm yourself, then you've already bet the game that you are liberal. You may as well just play as a liberal and if you are wrong and fascist, you still have a chance to win, or even find out your true identity later and and change course.

There is also a setting that can be turned on called **Simple Blind** that simplifies the default decision making. In this setting, vanilla fascists take every opportunity to discard a B or lie. More information about it can be found here ...insert link

## Thoughts on Game Balance and META

It's not clear if this variant will favor the liberals or the facists. If normal strict META is followed and players default to assuming they are liberal, then liberals almost certainly have the edge, since fascists are blind and can't coordinate. Also 3v3 top deck may not always be possible.

It's clear that if everybody defaults to assuming they are liberal by mere probability, 4/7 vs 3/7, then liberals will have an overwhelming advantage and all players will have an over 50% winning percentage. This is lame and comparable to being easy to read as a fascist vs liberal, leading to wins as liberal and losses as fascist.

Therefore, players should adapt their play to give the best chance of winning any one game. As a result, the META can and should change.

### Considerations

As we know, an important liberal responsibility is voting for the right liberal liberal governments, especially towards the end of the game. In a normal game, a liberal that hasn't been in government to play B is still instrumental in a win by determining who they think is liberal and voting properly. If that player does not know, or worse, does not believe they are liberal, their vote cannot be counted on. Therefore, there is more importance on getting more players into government to learn about their role, which also helps fascists.

**Scenario:** The first two governments play B and the players in government are limited. It's unlikely that these are the actual four liberals. Other liberal players will assume by probability that they are likely fascist and it will be difficult to coordinate among liberals.

The idea of the META is that it's optimal for liberals and since fascists need to keep their cover, they are compelled to go along with it or out themselves. In this variant, there is no cover to keep. You can openly say you might be fascist without outing. Players that are 50-50 on their role have incentive to openly support the losing team, keeping the possibility of winning balanced for when they can learn their role.

## How Decisions are Made

I tried to account for as many factors as possible when making decisions. Sadly, this is not an AI model that can think and given the complex number of factors that could go into a decision, don't expect it to be perfect. That being said, I tried to account for almost every aspect of the game, in some way.

Factors that are considered in decision making:

- Whether a government is fascist fascist or not
- Hitler vs vanilla fascist
- The player count
- Whether hitler knows if a particular player is fascist or liberal
- How many B's are down along with many you and the chancellor have each played
- How many R's are down
- What the power is (investigation vs gun)
- The deck count
- Confirmed liberals
- Number of fascists and liberals claiming RRR
- Whether it's cucu, anti-DD or double dipping
- Probability of draws in a given scenario
- Existing policy conflicts and investigations

All decisions are based on probability, so even if for example there is only a 10% chance of blind conflicting as Hitler, it may happen.

## Simple Blind Setting

In this setting, fascist decisions are not strategic or optimal. The emphasis is on performing the fascist action when possible.

### Fascist Actions

- Discarding B policies as president
- Playing R policies as chancellor
- Changing the blue count
- Conflicting the chancellor
- Lying on investigation
- Lying about the top 3 policies in a 5-6 player game
- Refusing veto

### Considerations

- Players in government can learn if they are vanilla fascist or not confidently
- Hitler still plays with some nuance to keep liberal cover, so it's not guaranteed liberal if the fascist action is not taken, as you could still be Hitler.

### Strategy

If you believe the optimal fascist play in a given situation is to play like a liberal, then do so without taking the default action.
You can even lie and say that you chose the default action, trying to build liberal credibility. Realize you may be a liberal lying about why you are liberal, but telling the truth that you are liberal, so it's fine!

However, playing optimally in this way comes at the cost of missing the opportunity to possibly learn you role.

Keep in mind, if a fascist player shoots a liberal, a 3v3 top deck is not always possible, since not all fascists necessarily know who they are to nein.

**Example:** You are the chancellor under the gun with three B's down. You realize that the optimal fascist play is to play the fourth B and not get shot. You do so. Then, you claim you chose the default action, "confirming" you are liberal.

### Simple Decisions

Vanilla fascists will always take an action that confirms themself as fascist, even if it is idiotic. They will always conflict their chancellor on policy, always change the blue claim, etc. regardless of whether it makes them look good or bad. Liberals of course never do this. Hitler decisions are more balanced around sometimes playing blues and avoiding conflicts.

## Cooperative Blind

In this setting, the roles are blind as in the normal blind setting. However, most of the other information is too. Presidents and chancellors are blind to their policies. Players are blind to the investigations they do. All policy and claim decisions are made by default. Therefore, all information is the same for everyone. Hence, the cooperative aspect. The goal is for everyone to work together to make the liberal team win, regardless of the role you control.

An interesting aspect of this setting is that while everyone has the same end goal, players may have different opinions on how to read the position. Therefore, players may disagree on who to trust and put into government. Each player still gets to make their independent decisions through voting and the power when they are president.

# Possible alternate rules and variants

- Hide player votes
- Fascists can know when Hitler has confirmed themself
- Players can investigate themselves
- In a 7+ player game, one of the non-Hitler fascists can be an all knowing fascist who learns all the other fascist upon confirming themself. This would increase the possibility of signally to other facists and ensuring a top deck when there is no liberal majority.
- Going into Hitler zone, someone (possibly the current chancellor) can pick one non-toucher (if there is one) to allow them to learn their role.

<!-- # Totally Blind
This is intended to be a twist on cooperative. It's essentially the same cooperative game except some players have an agenda for the fascists to win and know where the fascists are. They ahve to steer the game.
Talk about strategy and thought process
REALLY INTERESTING - aim to shoot people with poor logic. It doesn't matter if htey are lib role and 3v3 because you have 4 vs 2 voting majority to make the fascist vote forw hat you want. If fasc gets hitler, have to be extra cautious. -->

<!--

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

|     | 0   | 1   | 2   | 3   | 4   |
| --- | --- | --- | --- | --- | --- |
| 0   | .25 |     |     |     |     |
| 1   | .4  | .3  |     |     |     |
| 2   | .9  | .5  | .7  |     |     |
| 3   | 1   | 1   | 1   | 1   |     |
| 4   | 1   | 1   | 1   | 1   | 1   |

If 2B are down, the probabilities increase by 30%.

If Hitler knows the chancellor is fascist through antiDD then 0% and passes the B.
If there are at least R down, then Hitler drops 100%.

### Chancellor Play

Liberals of course always play B when given a choice.

#### Vanilla Fascist on RB

Vanilla fascists base probability of playing a red is given by the matrix where the row is the number of B down and the column is the number of B played by the fascist.

|     | 0   | 1   | 2   | 3   | 4   |
| --- | --- | --- | --- | --- | --- |
| 0   | .75 |     |     |     |     |
| 1   | .85 | .85 |     |     |     |
| 2   | .9  | .9  | .9  |     |     |
| 3   | .95 | .95 | .95 | .95 |     |
| 4   | 1   | 1   | 1   | 1   | 1   |

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

- Investigation: You've claimed RRR as president at any point and there are at least 2 total underclaims. Investigate another fasc as fasc:

  - 60% if 2 underclaims
  - 100% if at least 3 underclaims

Or you are double dipping and conflicted a lib on policy, you will conf another fasc 33% of the time and conf hitler 15% of the time.

- Policy: There is a total of three underclaims, either from a double drop of RBB with an existing underclaim or a drop on RRB with two existing underclaims, then there's a 90% chance of conflicting.
- If there are two underclaims, 33% chance of conflicting
- A player will conflict and out the chancellor on cucu with probability 90% if there are at least two underclaims and 40% if there's one underclaim.
- No conflict will occur if there is a gun

Some cases are known to be fasc fasc by the president and others are not. The cucu conflict and the RRB conflict are unknown if it's fasc fasc at the time.
-->
