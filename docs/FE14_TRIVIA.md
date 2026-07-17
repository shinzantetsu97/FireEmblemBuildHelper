# FE14 Trivia Drafts

## Corrin marrying one of Azura's offspring breaks Kana's family supports

Corrin and Azura are already first cousins: Mikoto and Arete are sisters.

If Corrin marries one of Azura's offspring, their child Kana becomes both:

- Azura's grandchild through the married parent; and
- Azura's first cousin once removed through Corrin.

Azura's other offspring consequently becomes both Kana's aunt or uncle and Kana's second cousin. Despite being immediate family through the marriage, Kana and that offspring receive no support chain at all. They cannot reach A+, S, or even the ordinary C-A family ranks.

In effect, Fates constructs the relationship, encounters the resulting genealogy, and disables the support entirely. Corrin marrying Azura's child was already awful; locking Kana out of supporting their own aunt or uncle is the final bit of "Incest Emblem" trivia.

### Verification notes

- The Japanese support-candidate documentation explicitly identifies the no-support exception when Corrin marries one of Azura's offspring.
- Ordinary parent-child and sibling offspring relationships support only through A and cannot use Friendship or Partner Seals with one another.
- Source: [Pegasus Knight FE14 support S/A+ candidate table](https://www.pegasusknight.com/wiki/fe14/%E3%83%A6%E3%83%8B%E3%83%83%E3%83%88/%E6%94%AF%E6%8F%B4S%E3%83%BBA%2B%E5%80%99%E8%A3%9C)

## Kana is a data-modeling nightmare for no payoff

What do you mean that, in order to calculate Kana's stats properly, you need to:

- Determine one of Corrin's 67 available partners and check their stats, primary class, and secondary class.
- If that partner is a second-generation unit, determine their other parent and resolve their inherited stats and classes first.
- If Corrin is female, resolve male Kana's uniquely janky class inheritance: when the other parent's original class collides and has no valid parallel fallback, he can simply be left without an additional inherited class tree.
- If Corrin marries one of Azura's children, remove Azura's other child from Kana's support list entirely because that unit is now Kana's aunt or uncle.
- On top of all that, enter both parents' current stat lines and Corrin's boon, bane, and Talent before Kana's resulting profile becomes deterministic.

Kana is not even an especially good unit because of those poor bases. Somehow this one mediocre dragon child requires roughly six configuration choices, recursive parent resolution, live class-fallback logic, conditional support deletion, and both parents' stats just to describe one concrete version of them.

What do you mean the smallest dragon in the roster has the largest dependency graph?
